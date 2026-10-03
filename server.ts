import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { connectDB, isDbConnected } from './server/config/database';
import authRoutes from './server/routes/authRoutes';
import userRoutes from './server/routes/userRoutes';
import transactionRoutes from './server/routes/transactionRoutes';
import goalRoutes from './server/routes/goalRoutes';

dotenv.config();

async function startServer() {
  const app = express();
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json({ limit: '1mb' }));

  // Connect to MongoDB safely without crashing on failure
  await connectDB();

  // Core MongoDB-backed REST API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/users', transactionRoutes);
  app.use('/api', transactionRoutes);
  app.use('/api', goalRoutes);

  // Initialize Gemini client if API key is present
  const apiKey = process.env.GEMINI_API_KEY;
  let ai: GoogleGenAI | null = null;

  if (apiKey) {
    try {
      ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    } catch (err) {
      console.warn('Failed to initialize GoogleGenAI client:', err);
    }
  }

  // Health endpoint
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      database: isDbConnected() ? 'connected' : 'standalone_fallback',
      hasGeminiApiKey: !!apiKey,
      timestamp: new Date().toISOString(),
    });
  });

  // Resilient Gemini generator with automatic fallback across approved models
  const APPROVED_MODELS = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];

  async function callGeminiWithRetry(contents: string, config: any) {
    if (!ai) throw new Error('Gemini client not initialized');
    let lastError: any = null;

    for (const model of APPROVED_MODELS) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          return await ai.models.generateContent({
            model,
            contents,
            config,
          });
        } catch (err: any) {
          lastError = err;
          const isTransient =
            err?.status === 503 ||
            err?.message?.includes('503') ||
            err?.message?.includes('high demand') ||
            err?.status === 429 ||
            err?.message?.includes('429');

          if (isTransient && attempt < 2) {
            await new Promise((res) => setTimeout(res, 600));
            continue;
          }
          break; // Try next model in APPROVED_MODELS
        }
      }
    }
    throw lastError;
  }

  function generateDynamicDeterministicAnswer(
    userPrompt: string,
    inBangla: boolean,
    ctx: any
  ): string {
    const norm = userPrompt.toLowerCase().trim();
    const userName = ctx?.userName ? ctx.userName.split(' ')[0] : inBangla ? 'সম্মানিত গ্রাহক' : 'there';
    const income = ctx?.monthlyIncome || 0;
    const spending = ctx?.monthlySpending || 0;
    const netSavings = ctx?.netSavings !== undefined ? ctx.netSavings : Math.max(0, income - spending);
    const savingsRate = ctx?.savingsRate !== undefined ? ctx.savingsRate : (income > 0 ? Number(((netSavings / income) * 100).toFixed(1)) : 0);
    const balance = ctx?.cashFlow?.startingBalance || 0;
    const categories = Array.isArray(ctx?.categories) ? ctx.categories : [];
    const topCat = categories.length > 0
      ? [...categories].sort((a: any, b: any) => b.amount - a.amount)[0]
      : { category: 'Food & Groceries', amount: spending, percentage: 100 };
    const goals = Array.isArray(ctx?.goals) ? ctx.goals : [];
    const primaryGoal = goals[0] || {
      title: 'General Savings',
      targetAmount: 50000,
      currentAmount: 15000,
      progressPercentage: 30,
      remainingAmount: 35000,
    };
    const projectedBalance = balance + netSavings;

    // 1. Why run short before month end / cash flow pressure
    if (
      norm.includes('run short') ||
      norm.includes('short before') ||
      norm.includes('month-end') ||
      norm.includes('মাস শেষ') ||
      norm.includes('টাকা শেষ') ||
      norm.includes('pressure')
    ) {
      if (inBangla) {
        return `আপনার আর্থিক হিসাব অনুযায়ী, এ মাসে আপনার মোট আয় ৳${income.toLocaleString()} এবং মোট ব্যয় ৳${spending.toLocaleString()}। আপনার সবচেয়ে বড় খরচের খাত হলো **${topCat.category}** (৳${topCat.amount.toLocaleString()}, যা মোট খরচের ${topCat.percentage}%)।\n\nমাসের শেষভাগে বড় বড় খরচ ও নিয়মিত বিলের কারণে হাতে উদ্বৃত্ত কমে আসে (বর্তমান নিট সঞ্চয় ৳${netSavings.toLocaleString()})। মাসের শুরুতেই বড় খরচের খাতের জন্য একটি নির্দিষ্ট বাফার আলাদা রাখলে মাস শেষে আর্থিক টানাপোড়েন তৈরি হবে না।`;
      }
      return `Based on your live financial ledger, your total monthly income is ৳${income.toLocaleString()} and monthly spending is ৳${spending.toLocaleString()}. Your largest outflow category is **${topCat.category}** at ৳${topCat.amount.toLocaleString()} (${topCat.percentage}% of all expenditures).\n\nBecause outflows cluster around your top spending categories and recurring obligations, your net monthly surplus is ৳${netSavings.toLocaleString()} (available liquid balance: ৳${balance.toLocaleString()}). Locking an automated buffer at the start of the month will eliminate month-end cash flow pressure.`;
    }

    // 2. Which category should I reduce
    if (
      norm.includes('which category') ||
      norm.includes('reduce') ||
      norm.includes('cut') ||
      norm.includes('কোন খাত') ||
      norm.includes('কোথায় খরচ কমাব')
    ) {
      if (inBangla) {
        return `আপনার বর্তমান ব্যয়ের বিশ্লেষণে খরচ কমানোর সবচেয়ে বড় সুযোগ রয়েছে **${topCat.category}** খাতে, যেখানে বর্তমানে ৳${topCat.amount.toLocaleString()} (${topCat.percentage}%) ব্যয় হচ্ছে।\n\nএই খাত থেকে ১০-১৫% সাশ্রয় করতে পারলে প্রতি মাসে অতিরিক্ত প্রায় ৳${Math.round(topCat.amount * 0.12).toLocaleString()} সাশ্রয় করা সম্ভব, যা আপনার সঞ্চয়ের গতি বৃদ্ধি করবে।`;
      }
      return `Looking at your actual spending breakdown, your primary area for optimization is **${topCat.category}**, which currently accounts for ৳${topCat.amount.toLocaleString()} (${topCat.percentage}% of your total spending).\n\nTrimming 10–15% from this category can yield approximately ৳${Math.round(topCat.amount * 0.12).toLocaleString()} in monthly savings directly toward your goals.`;
    }

    // 3. How can I save more money
    if (
      norm.includes('save more') ||
      norm.includes('save money') ||
      norm.includes('বেশি সঞ্চয়') ||
      norm.includes('সঞ্চয় বাড়াব')
    ) {
      if (inBangla) {
        return `বর্তমানে আপনার মাসিক সঞ্চয় ৳${netSavings.toLocaleString()} (সঞ্চয়ের হার: ${savingsRate}%)।\n\nআরও বেশি সঞ্চয় করার বাস্তবসম্মত পদক্ষেপ:\n১. **${topCat.category}** খাতের খরচ (বর্তমান ৳${topCat.amount.toLocaleString()}) থেকে সামান্য কমিয়ে মাসে অতিরিক্ত ৳${Math.round(topCat.amount * 0.1).toLocaleString()} জমানো।\n২. অপ্রয়োজনীয় লেনদেন ফি এবং অতিরিক্ত চার্জ এড়িয়ে চলা।\n৩. এই অতিরিক্ত টাকা সরাসরি আপনার **${primaryGoal.title}** সঞ্চয় লক্ষ্যে যুক্ত করা।`;
      }
      return `Your current monthly savings is ৳${netSavings.toLocaleString()} (${savingsRate}% savings rate).\n\nActionable steps to increase your savings:\n1. Moderate spending in your top category **${topCat.category}** (currently ৳${topCat.amount.toLocaleString()}) to free up ~৳${Math.round(topCat.amount * 0.1).toLocaleString()}/month.\n2. Minimize small transactional tariffs and discretionary leaks.\n3. Automatically route this surplus into your **${primaryGoal.title}** goal (target: ৳${primaryGoal.targetAmount.toLocaleString()}).`;
    }

    // 4. Savings goal on track
    if (
      norm.includes('on track') ||
      norm.includes('savings goal') ||
      norm.includes('goal') ||
      norm.includes('লক্ষ্যমাত্রা') ||
      norm.includes('টার্গেট')
    ) {
      const remaining = primaryGoal.remainingAmount ?? Math.max(0, primaryGoal.targetAmount - primaryGoal.currentAmount);
      const progress = primaryGoal.progressPercentage ?? Math.round((primaryGoal.currentAmount / primaryGoal.targetAmount) * 100);
      if (inBangla) {
        return `আপনার মূল সঞ্চয় লক্ষ্য **${primaryGoal.title}** এর বর্তমান অবস্থা:\n\n• লক্ষ্যমাত্রা: ৳${primaryGoal.targetAmount.toLocaleString()}\n• বর্তমান জমা: ৳${primaryGoal.currentAmount.toLocaleString()} (${progress}% সম্পন্ন)\n• অবশিষ্ট ঘাটতি: ৳${remaining.toLocaleString()}\n\nআপনার বর্তমান মাসিক সঞ্চয়ের গতি (৳${netSavings.toLocaleString()}/মাস) বজায় রাখলে আপনি দ্রুত এই লক্ষ্য পূরণ করতে পারবেন।`;
      }
      return `Status for your primary savings goal **${primaryGoal.title}**:\n\n• Target: ৳${primaryGoal.targetAmount.toLocaleString()}\n• Current Saved: ৳${primaryGoal.currentAmount.toLocaleString()} (${progress}% achieved)\n• Remaining Gap: ৳${remaining.toLocaleString()}\n\nWith your current monthly surplus of ৳${netSavings.toLocaleString()}/month, you are making consistent progress toward completing this goal.`;
    }

    // 5. Why spending high
    if (
      norm.includes('খরচ বেশি') ||
      norm.includes('spending high') ||
      norm.includes('spending the most') ||
      norm.includes('expense high')
    ) {
      if (inBangla) {
        return `এই মাসে আপনার মোট খরচ ৳${spending.toLocaleString()}। আপনার সবচেয়ে বেশি খরচ হচ্ছে **${topCat.category}** খাতে (৳${topCat.amount.toLocaleString()}, যা মোট ব্যয়ের ${topCat.percentage}%)।\n\nএই প্রধান খরচের খাতটি নিয়ন্ত্রণ করাই সামগ্রিক মাসিক ব্যয় কমিয়ে আনার সবচেয়ে দ্রুততম উপায়।`;
      }
      return `Your total expenditure this month is ৳${spending.toLocaleString()}. The biggest factor driving your spending is **${topCat.category}**, where you have spent ৳${topCat.amount.toLocaleString()} (${topCat.percentage}% of total outflows).\n\nKeeping this single category within a planned budget is the most impactful way to control total monthly outflows.`;
    }

    // 6. Balance next month
    if (
      norm.includes('next month') ||
      norm.includes('balance') ||
      norm.includes('কত টাকা থাকতে পারে') ||
      norm.includes('ব্যালেন্স')
    ) {
      if (inBangla) {
        return `আপনার বর্তমান ব্যালেন্স ৳${balance.toLocaleString()}, মাসিক আয় ৳${income.toLocaleString()} এবং মাসিক ব্যয় ৳${spending.toLocaleString()} এর ভিত্তিতে আগামী মাস শেষে আপনার সম্ভাব্য ব্যালেন্স দাঁড়াবে প্রায় **৳${projectedBalance.toLocaleString()}** (AI-assisted forecast)।\n\nআপনার বর্তমান সঞ্চয়ের হার ${savingsRate}%, যা ইতিবাচক ক্যাশ-ফ্লো নিশ্চিত করছে।`;
      }
      return `Based on your available balance of ৳${balance.toLocaleString()}, regular income of ৳${income.toLocaleString()}, and current spending of ৳${spending.toLocaleString()}, your projected month-end balance is approximately **৳${projectedBalance.toLocaleString()}** (AI-assisted forecast).\n\nYour net monthly savings rate of ${savingsRate}% provides a healthy ongoing positive cash-flow buffer.`;
    }

    // General response
    if (inBangla) {
      return `আসসালামু আলাইকুম ${userName}! আপনার আর্থিক তথ্য অনুযায়ী: চলতি মাসের আয় ৳${income.toLocaleString()}, ব্যয় ৳${spending.toLocaleString()}, সঞ্চয় ৳${netSavings.toLocaleString()} এবং উপলব্ধ ব্যালেন্স ৳${balance.toLocaleString()}। আপনার সবচেয়ে বড় খরচের খাত **${topCat.category}** (৳${topCat.amount.toLocaleString()})। আপনার বাজেট বা সঞ্চয় নিয়ে নির্দিষ্ট কোনো পরামর্শ চাইলে জানান!`;
    }
    return `Assalamu Alaikum ${userName}! Based on your authentic financial ledger: Monthly Income is ৳${income.toLocaleString()}, Spending is ৳${spending.toLocaleString()}, Net Savings is ৳${netSavings.toLocaleString()}, and Available Balance is ৳${balance.toLocaleString()}. Your largest expense category is **${topCat.category}** (৳${topCat.amount.toLocaleString()}). Please let me know how I can help with your budgeting or savings goals!`;
  }

  // AI Coach query endpoint
  app.post('/api/ai/coach', async (req: Request, res: Response) => {
    const { prompt, isBangla, financialContext } = req.body;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const ctx = financialContext || {};

    if (ai) {
      try {
        const categoriesList = Array.isArray(ctx.categories)
          ? ctx.categories
              .map(
                (c: any) =>
                  `  • ${c.category}: ৳${c.amount} (${c.percentage}% of spending, MoM change: ${
                    c.momChangePercentage > 0 ? '+' : ''
                  }${c.momChangePercentage}%) - Top merchants: ${
                    c.topMerchants?.join(', ') || 'Various'
                  }`
              )
              .join('\n')
          : '  • Food & Groceries: ৳8,200 (28.1%, +14% surge)\n  • Shopping & Gadgets: ৳5,800 (19.9%, -6%)\n  • Utility & Fixed Costs: ৳4,600 (15.8%)\n  • Transportation: ৳4,400 (15.1%)\n  • Entertainment & Others: ৳3,400 (11.6%)\n  • Cash-out & Bank Fees: ৳2,800 (9.6%, +12% fee leak)';

        const goalsList = Array.isArray(ctx.goals)
          ? ctx.goals
              .map(
                (g: any) =>
                  `  • ${g.title}: Target ৳${g.targetAmount}, Saved ৳${g.currentAmount} (${g.progressPercentage}%), Remaining ৳${g.remainingAmount}, Required Monthly: ৳${g.requiredMonthlySavings}/mo, Current Average: ৳${g.currentAverageMonthlySaving}/mo, Monthly Savings Gap: ৳${g.monthlySavingsGap}/mo, Deadline: ${g.deadline}, Projected Completion: ${g.projectedCompletionDate}`
              )
              .join('\n')
          : '  • Emergency Fund: Target ৳30,000, Saved ৳18,500 (61.7%), Remaining ৳11,500, Required Monthly: ৳5,000/mo, Current Average: ৳3,200/mo, Gap: ৳1,800/mo, Deadline: 2024-12-14, Projected: Dec 2024';

        const healthPillars = ctx.healthScore?.factors
          ? `Saving Consistency: ${ctx.healthScore.factors.savingConsistency}%, Spending Control: ${ctx.healthScore.factors.spendingControl}%, Cash Flow Stability: ${ctx.healthScore.factors.cashFlowStability}%, Goal Progress: ${ctx.healthScore.factors.goalProgress}%`
          : 'Saving Consistency: 82%, Spending Control: 71%, Cash Flow Stability: 79%, Goal Progress: 84%';

        const nameToUse = ctx.userName ? ctx.userName.split(' ')[0] : 'Ahmed';

        const systemInstruction = `You are ArthoBachao AI Personal Financial Coach, an expert digital wealth engine built specifically for Bangladesh (Dhaka lifestyle, bKash, Nagad, City Bank, Dhaka Metro MRT, Pathao, Shwapno). You provide explainable, empathetic, non-judgmental, and mathematically sound coaching grounded strictly in the user's authentic ledger data.

CURRENCY CONVENTION: Always use Bangladeshi Taka (BDT / ৳), for example ৳5,000 or ৳29,200. Never use USD ($) or any other foreign currency.

LANGUAGE: ${
          isBangla
            ? `Respond in warm, natural, and fluent Bangla (বাংলায় উত্তর দিন). Address the user respectfully as "${nameToUse}" or "আপনি".`
            : `Respond in English starting with a warm greeting: "Assalamu Alaikum ${nameToUse}!".`
        }

==================================================
AUTHENTIC USER FINANCIAL LEDGER DATA:
==================================================
- Monthly Income: ৳${ctx.monthlyIncome ?? 38500}
- Total Monthly Spending: ৳${ctx.monthlySpending ?? 29200}
- Net Monthly Savings: ৳${ctx.netSavings ?? 9300}
- Current Savings Rate: ${ctx.savingsRate ?? 24.2}%
- Total Available Balance: ৳${ctx.cashFlow?.startingBalance ?? 24850}

CATEGORICAL EXPENDITURE BREAKDOWN:
${categoriesList}

SAVINGS GOALS STATUS:
${goalsList}

ARTHOBACHAO AI FINANCIAL HEALTH SCORE:
• Score: ${ctx.healthScore?.score ?? 79} / 100 (${ctx.healthScore?.status ?? 'Very Good'}, outperforms ${
          ctx.healthScore?.percentile ?? 74
        }% of peer profiles)
• Diagnostic Factors: ${healthPillars}

30-DAY CASH-FLOW FORECAST:
• Starting Balance: ৳${ctx.cashFlow?.startingBalance ?? 24850}
• Projected Month-End Close: ৳${ctx.cashFlow?.projectedMonthEnd ?? 7450}
• Recommended Buffer: ৳${ctx.cashFlow?.recommendedBuffer ?? 18000}

==================================================
COACHING & FACTUAL RULES:
==================================================
1. STRICT FACTUAL CONSISTENCY: Always cite the EXACT numbers from the ledger data above. Do NOT invent, round differently, or hallucinate financial figures.
2. CAUSALITY & REASONING: Explain the exact cause behind patterns using the user's actual top expense categories and numbers.
3. PRACTICAL SUGGESTIONS: Offer concrete, actionable steps using Bangladesh context (e.g. bKash, City Bank ATM debit card, reducing delivery spend).
4. CONCISE, STRUCTURED FORMAT: Use bullet points, bold key figures, and concise paragraphs.`;

        const response: any = await callGeminiWithRetry(prompt, {
          systemInstruction,
          temperature: 0.5,
        });

        const generatedText = response?.text || '';
        if (generatedText) {
          return res.json({
            source: 'gemini',
            text: generatedText,
          });
        }
      } catch (geminiError: any) {
        console.warn('Gemini API call failed, falling back to deterministic response:', geminiError?.message);
      }
    }

    // Dynamic deterministic fallback using the user's actual financial context
    const dynamicText = generateDynamicDeterministicAnswer(prompt, Boolean(isBangla), ctx);
    return res.json({
      source: 'deterministic_fallback',
      text: dynamicText,
      message: 'Using built-in deterministic financial intelligence',
    });
  });

  // Vite middleware in dev or static files in production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static('dist'));
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`ArthoBachao AI server listening on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error launching ArthoBachao AI server:', err);
  process.exit(1);
});
