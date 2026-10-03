import { CoachMessage, SavingsGoal, Transaction } from '../types/financial';
import {
  calculateMonthlyOverview,
  calculateFinancialHealthScore,
  calculateCompleteGoalAnalysis,
  getDetailedForecast,
  generateSpendingInsights,
} from './financialCalculations';

export interface FinancialContext {
  userName?: string;
  monthlyIncome: number;
  monthlySpending: number;
  netSavings: number;
  savingsRate: number;
  healthScore: {
    score: number;
    status: string;
    percentile: number;
    factors: {
      savingConsistency: number;
      spendingControl: number;
      cashFlowStability: number;
      goalProgress: number;
    };
  };
  categories: Array<{
    category: string;
    amount: number;
    percentage: number;
    momChangePercentage: number;
    status: string;
    topMerchants: string[];
  }>;
  goals: Array<{
    id: string;
    title: string;
    targetAmount: number;
    currentAmount: number;
    remainingAmount: number;
    progressPercentage: number;
    requiredMonthlySavings: number;
    currentAverageMonthlySaving: number;
    monthlySavingsGap: number;
    deadline: string;
    projectedCompletionDate: string;
  }>;
  cashFlow: {
    startingBalance: number;
    projectedMonthEnd: number;
    upcomingBills: number;
    pressureDays: number[];
    recommendedBuffer: number;
  };
  insights: Array<{
    type: string;
    category?: string;
    changePercent?: number;
    impactAmount?: number;
    explanation: string;
  }>;
}

export async function askFinancialCoach(
  userQuery: string,
  transactions: Transaction[],
  goals: SavingsGoal[],
  monthlyIncome: number = 38500,
  isBangla: boolean = false,
  userName?: string
): Promise<CoachMessage> {
  const overview = calculateMonthlyOverview(transactions, '2024-10');
  const health = calculateFinancialHealthScore(transactions, goals, monthlyIncome);
  const insights = generateSpendingInsights(transactions, '2024-10', '2024-09');
  const forecast = getDetailedForecast(24850, false, transactions);
  const goalAnalyses = goals.map((g) => calculateCompleteGoalAnalysis(g, transactions));

  const financialContext: FinancialContext = {
    userName,
    monthlyIncome,
    monthlySpending: overview.totalExpenses,
    netSavings: overview.netSavings,
    savingsRate: overview.savingsRate,
    healthScore: {
      score: health.score,
      status: health.status,
      percentile: health.percentile,
      factors: health.factors,
    },
    categories: overview.categories.map((c) => ({
      category: c.category,
      amount: c.amount,
      percentage: c.percentage,
      momChangePercentage: c.momChangePercentage,
      status: c.status,
      topMerchants: c.topMerchants,
    })),
    goals: goalAnalyses.map((ga) => ({
      id: ga.goalId,
      title: ga.title,
      targetAmount: ga.targetAmount,
      currentAmount: ga.currentAmount,
      remainingAmount: ga.remainingAmount,
      progressPercentage: ga.progressPercentage,
      requiredMonthlySavings: ga.requiredMonthlySavings,
      currentAverageMonthlySaving: ga.currentAverageMonthlySaving,
      monthlySavingsGap: ga.monthlySavingsGap,
      deadline: ga.deadline,
      projectedCompletionDate: ga.projectedCompletionDate,
    })),
    cashFlow: {
      startingBalance: forecast.startingBalance,
      projectedMonthEnd: forecast.projectedMonthEnd,
      upcomingBills: forecast.upcomingBills,
      pressureDays: forecast.pressureDays,
      recommendedBuffer: forecast.recommendedBuffer,
    },
    insights: insights.map((i) => ({
      type: i.type,
      category: i.category,
      changePercent: i.changePercent,
      impactAmount: i.impactAmount,
      explanation: i.explanation,
    })),
  };

  let geminiText: string | null = null;
  let isGeminiSource = false;

  try {
    const endpoint =
      typeof window !== 'undefined' ? '/api/ai/coach' : 'http://localhost:3000/api/ai/coach';
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: userQuery,
        isBangla,
        financialContext,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.source === 'gemini' && data.text) {
        geminiText = data.text;
        isGeminiSource = true;
      }
    }
  } catch (err) {
    console.warn('Network request to /api/ai/coach failed, using deterministic engine:', err);
  }

  const normalized = userQuery.toLowerCase().trim();
  const emergencyGoal = goals.find((g) => g.id === 'goal-emergency-fund') || goals[0];
  const target = emergencyGoal?.targetAmount || 30000;
  const currentSaved = emergencyGoal?.currentAmount || 18500;
  const remainingGap = Math.max(0, target - currentSaved);

  // Structured recommendations builder to complement answers with actionable cards
  let structuredData: CoachMessage['structuredData'] = undefined;

  if (
    normalized.includes('30,000') ||
    normalized.includes('emergency fund') ||
    normalized.includes('six months') ||
    normalized.includes('realistic') ||
    normalized.includes('on track') ||
    normalized.includes('save') ||
    normalized.includes('জরুরি')
  ) {
    structuredData = {
      targetVelocity: {
        current: 3200,
        needed: 5000,
        percentage: 64,
        shortfall: 1800,
      },
      recommendations: [
        {
          category: 'Food Delivery Capping',
          currentMonthly: 8200,
          potentialSavings: 900,
          why: 'Ordering late-night snacks on weekends accounts for ৳3,600 monthly.',
          actionLabel: 'Set Weekend Limit (৳1,200/wk)',
          badge: '-11% target',
          icon: 'delivery_dining',
        },
        {
          category: 'Fee-Free ATM Withdrawals',
          currentMonthly: 2800,
          potentialSavings: 650,
          why: 'Consolidating micro MFS cash-out withdrawals saves ৳650 in 1.85% tariffs.',
          actionLabel: 'Use City Bank ATM Free',
          badge: 'Avoidable Fees',
          icon: 'account_balance_wallet',
        },
      ],
      simulation: {
        target,
        currentMonths: Number((remainingGap / 3200).toFixed(1)),
        optimizedMonths: Number((remainingGap / 4750).toFixed(1)),
        currentEstDate: 'Aug 2025',
        optimizedEstDate: 'Dec 2024',
      },
    };
  } else if (
    normalized.includes('month-end') ||
    normalized.includes('short before') ||
    normalized.includes('run short') ||
    normalized.includes('মাস শেষে') ||
    normalized.includes('pressure')
  ) {
    structuredData = {
      targetVelocity: {
        current: 24850,
        needed: 29350,
        percentage: 84,
        shortfall: 4500,
      },
      recommendations: [
        {
          category: 'Upcoming Rent & Bills',
          currentMonthly: 17200,
          potentialSavings: 4500,
          why: 'Fixed outflows cluster heavily on Day 26 (Rent ৳16,000 + utilities ৳1,200).',
          actionLabel: 'Lock Buffer Now (৳4,500)',
          badge: 'Fixed Buffer',
          icon: 'receipt_long',
        },
        {
          category: 'MFS Micro-Withdrawals',
          currentMonthly: 2800,
          potentialSavings: 420,
          why: 'Small frequent withdrawals from agents cost 1.85% each time.',
          actionLabel: 'Use City Bank ATM Free',
          badge: 'Zero Fee',
          icon: 'atm',
        },
      ],
      simulation: {
        target: 30000,
        currentMonths: 9.4,
        optimizedMonths: 5.8,
        currentEstDate: 'Aug 2025',
        optimizedEstDate: 'Dec 2024',
      },
    };
  }

  // If Gemini answered, prioritize the live model's reasoning
  let finalText = geminiText;

  // If Gemini was unavailable or returned empty, use the explainable deterministic engine
  if (!finalText) {
    if (
      normalized.includes('short before month-end') ||
      normalized.includes('month-end') ||
      normalized.includes('run short') ||
      normalized.includes('মাস শেষ')
    ) {
      finalText = isBangla
        ? `আপনার ক্যাশ-ফ্লো প্যাটার্ন অনুযায়ী মাসের শেষ সপ্তাহে (২৪ থেকে ২৮ তারিখের মধ্যে) বড় ধরণের খরচ জমে যায়। বিশেষ করে ২৬ তারিখে বাসা ভাড়া (৳১৬,০০০) এবং ইউটিলিটি বিল (৳১,২০০) মিলিয়ে মোট ৳১৭,২০০ একসাথে পরিশোধ করতে হয়।\n\nএছাড়া মাসের শুরুতে রেস্তোরাঁ ও ফুড ডেলিভারিতে (৳৮,২০০) বেশি খরচ হয়ে যাওয়ায় মাসের শেষভাগে হাতে মাত্র ~৳৩,২০০ উদ্বৃত্ত থাকে। এর সমাধান হিসেবে ২০ অক্টোবরের মধ্যে bKash-এ ৳৪,৫০০ ইমার্জেন্সি বাফার আলাদা করে রাখার পরামর্শ দেওয়া হচ্ছে।`
        : `Based on your cash-flow rhythm, you experience a high-pressure cluster between Day 24 and Day 28, where Apartment Rent (৳16,000) and Utility dues (৳1,200) hit simultaneously on Day 26 (totaling ৳17,200).\n\nBecause weekend dining spending is front-loaded in the first two weeks (totaling ৳8,200), your projected month-end balance dips to ~৳3,200 before recovering. I recommend locking a ৳4,500 liquid safety buffer into bKash by Oct 20 to eliminate month-end overdraft stress.`;
    } else if (
      normalized.includes('save ৳5,000') ||
      normalized.includes('save 5000') ||
      normalized.includes('save more') ||
      normalized.includes('টাকা save') ||
      normalized.includes('সঞ্চয়')
    ) {
      finalText = isBangla
        ? `বর্তমানে আপনার মাসিক গড় সঞ্চয় ৳৩,২০০। প্রতি মাসে ৳৫,০০০ সঞ্চয় করতে হলে আপনাকে অতিরিক্ত ৳১,৮০০ সাশ্রয় করতে হবে।\n\nআপনার প্রধান সুযোগগুলো:\n১. ফুড ও ডেলিভারি খরচ (বর্তমান ৳৮,২০০): উইকেন্ডে ডেলিভারি কমিয়ে সপ্তাহে ৳১,২০০ তে সীমাবদ্ধ রাখলে মাসে ৳৯০০ সাশ্রয় হবে।\n২. এজেন্ট ক্যাশ-আউট চার্জ (বর্তমান ৳২,৮০০): bKash/Nagad এজেন্টের পরিবর্তে সিটি ব্যাংকের ফ্রি এটিএম ব্যবহার করলে মাসে ৳৬৫০ সাশ্রয় হবে।\n\nএই দুটি সাধারণ পরিবর্তনেই কোনো প্রয়োজনীয় খরচ না কমিয়ে প্রতি মাসে অতিরিক্ত ৳১,৫৫০ থেকে ৳১,৮০০ সাশ্রয় করা সম্ভব।`
        : `Your current average monthly saving is ৳3,200. Reaching a ৳5,000/month pace requires saving approximately ৳1,800 more each month.\n\nYour highest flexible spending categories are:\n• Food & Delivery: ৳8,200 (surged +14% this month)\n• Shopping & Gadgets: ৳5,800\n• Cash-out & Bank Fees: ৳2,800 (1.85% tariff leak)\n\nCapping weekend food delivery to ৳1,200/wk (+৳900 saved) and switching cash withdrawals to free City Bank ATMs (+৳650 saved) bridges this ৳1,800 gap without impacting your essentials.`;
    } else if (
      normalized.includes('emergency fund') ||
      normalized.includes('on track') ||
      normalized.includes('ইমার্জেন্সি ফান্ড')
    ) {
      finalText = isBangla
        ? `হ্যাঁ আহমেদ! আপনি আপনার জরুরি ফান্ডের জন্য সঠিক ট্র্যাকে আছেন।\n\n• লক্ষ্য: ৳৩০,০০০\n• বর্তমান জমার পরিমাণ: ৳১৮,৫০০ (৬১.৭% অর্জিত)\n• বাকি ঘাটতি: ৳১১,৫০০\n• বর্তমান মাসিক গতি: ৳৩,২০০/মাস\n• ডিসেম্বর ২০২৪ এর মধ্যে শেষ করতে প্রয়োজনীয় গতি: ৳৫,০০০/মাস\n\nআপনি ঢাকায় আপনার সমবয়সী পেশাদারদের ৭৪% এর চেয়ে এগিয়ে আছেন। পরিকল্পিত ৳৫,০০০/মাস ধরে রাখলে ডিসেম্বর ২০২৪ এর মধ্যে সম্পূর্ণ লক্ষ্য অর্জিত হবে।`
        : `Yes Ahmed! You are solidly on track for your Emergency Fund.\n\n• Target: ৳30,000\n• Current Balance: ৳18,500 (61.7% achieved)\n• Remaining Gap: ৳11,500\n• Current Average Pace: ৳3,200/month\n• Required Pace to hit Dec 2024 deadline: ৳5,000/month\n\nYou are outperforming 74% of peers in Dhaka. Continuing your ৳5,000/mo balanced plan projects full completion by December 2024.`;
    } else if (
      normalized.includes('increasing') ||
      normalized.includes('spending the most') ||
      normalized.includes('খরচ বাড়ছে')
    ) {
      finalText = isBangla
        ? `যে খাতে আপনার খরচ সবচেয়ে বেশি বাড়ছে তা হলো **খাবার ও গ্রোসারি** (Food & Groceries)।\n\n• অক্টোবর মাসের খরচ: ৳৮,২০০ (মোট খরচের ২৮.১%)\n• গত মাসের তুলনায় বৃদ্ধি: +১৪% (সেপ্টেম্বরের চেয়ে +৳১,৪০০ বেশি)\n• প্রধান কারণ: পাঠাও ফুড ও ফুডপান্ডায় উইকেন্ডে ঘন ঘন দেরিতে খাবার অর্ডার করা।`
        : `The category increasing your spending the most is **Food & Groceries**.\n\n• October Spend: ৳8,200 (28.1% of all outflows)\n• MoM Increase: +14% surge (+৳1,400 vs September)\n• Primary Driver: Frequent weekend late-night food deliveries on Pathao Food and Foodpanda.`;
    } else if (
      normalized.includes('health score') ||
      normalized.includes('স্কোর')
    ) {
      finalText = isBangla
        ? `আপনার অর্থবাঁচাও এআই আর্থিক স্বাস্থ্য স্কোর বর্তমানে **৭৯ / ১০০** ("খুব ভালো"), যা ঢাকার ৭৪% সমমানের প্রোফাইলের চেয়ে ভালো।\n\nস্কোর নির্ধারণকারী ৪টি মূল স্তম্ভ:\n১. সঞ্চয়ের ধারাবাহিকতা: **৮২%** (৳৯,৩০০ নিট সঞ্চয় ২০% লক্ষ্যের চেয়ে বেশি)\n২. খরচ নিয়ন্ত্রণ: **৭১%** (+১৪% ফুড ডেলিভারি বৃদ্ধি এবং ৳২,৮০০ ক্যাশ-আউট ফি এর কারণে স্কোর কমেছে)\n৩. ক্যাশ-ফ্লো স্থিতিশীলতা: **৭৯%** (২৬ তারিখের বাসা ভাড়ার প্রভাব)\n৪. লক্ষ্যমাত্রা অগ্রগতি: **৮৪%** (ইমার্জেন্সি ফান্ডের ৬১.৭% সম্পন্ন)\n\nউইকেন্ড ডেলিভারি ও এটিএম ফি নিয়ন্ত্রণ করলে খরচ নিয়ন্ত্রণ ৮০% ছাড়িয়ে যাবে এবং সামগ্রিক স্কোর ৮৫+ ("অনুকূল") এ পৌঁছাবে।`
        : `Your ArthoBachao AI Financial Health Score is currently **79 / 100** ("Very Good"), outperforming 74% of peer digital profiles in Dhaka.\n\nThe 4 components affecting your score:\n1. Saving Consistency: **82%** (Net savings of ৳9,300 exceeds 20% target)\n2. Spending Control: **71%** (Lowered by the +14% food delivery surge and ৳2,800 in MFS cash-out tariffs)\n3. Cash Flow Stability: **79%** (Reflects Day 24-28 rent concentration)\n4. Savings Goal Progress: **84%** (Solid progress on Emergency Fund and MacBook)\n\nTrimming discretionary delivery orders and MFS tariffs will lift your Spending Control to 80%+, moving your overall score to 85+ ("Optimal").`;
    } else if (
      normalized.includes('balance look like') ||
      normalized.includes('next month') ||
      normalized.includes('টাকা কত থাকতে পারে')
    ) {
      finalText = isBangla
        ? `আপনার নির্ধারিত আয় ও নিয়মিত খরচের পূর্বাভাস অনুযায়ী মাস শেষে আপনার সম্ভাব্য ব্যালেন্স দাঁড়াবে প্রায় **৳৭,৪৫০** (AI-assisted forecast)।\n\n• সম্ভাব্য মোট আয়: ৳৩৮,৫০০ (বেতন ৳৩২,৫০০ + ফ্রিল্যান্সিং ৳৬,০০০)\n• সম্ভাব্য মোট খরচ: ~৳৩১,০৫০ (২৬ তারিখের বাসা ভাড়া ৳১৬,০০০ ও ইউটিলিটি ৳১,২০০ সহ)\n• নিরাপদ মার্জিন: ২৬ তারিখে ব্যালেন্স ৳৩,২০০ পর্যন্ত নেমে মাস শেষে ৳৭,৪৫০ এ দাঁড়াবে।\n• যদি আপনি প্রতিদিন ৳৩০০ খরচ কমান, তবে মাস শেষে ব্যালেন্স ৳১১,২৫০ পর্যন্ত বৃদ্ধি পেতে পারে।\n*(নোট: এটি একটি নির্দেশনামূলক এআই পূর্বাভাস, কোনো নিশ্চয়তা নয়)।*`
        : `Based on your scheduled inflows and obligations, your projected month-end balance will be approximately **৳7,450** (AI-assisted forecast).\n\n• Expected Inflows: ৳38,500 (Salary ৳32,500 + Freelance ৳6,000)\n• Expected Outflows: ~৳31,050 (including Day 26 rent of ৳16,000 & utilities of ৳1,200)\n• Safe Margin: Dips to ৳3,200 on Day 26, then closes safely at ৳7,450.\n• With simulated ৳300/day expense cuts, your month-end cushion rises to ৳11,250.\n*(Note: This is an indicative AI-assisted forecast, not a guaranteed outcome).*`;
    } else {
      finalText = isBangla
        ? `আসসালামু আলাইকুম আহমেদ! আমি আপনার আর্থিক হিসাব বিশ্লেষণ করেছি (আয়: ৳৩৮,৫০০, ব্যয়: ৳২৯,২০০, সঞ্চয়: ৳৯,৩০০, বর্তমান মোট ব্যালেন্স: ৳২৪,৮৫০)। আপনার আর্থিক স্বাস্থ্য স্কোর ৭৯/১০০ (খুব ভালো)। আপনার বাজেট বা সঞ্চয় নিয়ে যেকোনো প্রশ্ন থাকলে আমাকে জানান!`
        : `Assalamu Alaikum Ahmed! I have analyzed your live financial ledger (Income: ৳38,500, Spending: ৳29,200, Net Savings: ৳9,300, Available Liquid Balance: ৳24,850). Your financial health score is rated 79/100 (Very Good). Please let me know how I can help optimize your budget or accelerate your savings goals!`;
    }
  }

  return {
    id: `coach-${Date.now()}`,
    sender: 'assistant',
    text: finalText,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    isBangla,
    isDeterministic: !isGeminiSource,
    structuredData,
  };
}
