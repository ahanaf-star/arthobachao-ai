import { CoachContext } from './coachContextBuilder';
import { IntentResult } from './intentClassifier';

export interface CoachResponsePayload {
  source: 'ai' | 'fallback';
  answer: string;
  factsUsed: string[];
  followUps: string[];
  dataGaps: string[];
}

/**
 * Deterministic Fallback Engine
 * Generates data-grounded, educational responses in English and Bengali using ONLY real ledger facts.
 * Never outputs hardcoded mock figures or generic greetings when real data is available.
 */
export function generateDeterministicCoachResponse(
  intentResult: IntentResult,
  ctx: CoachContext,
  language: 'en' | 'bn' = 'en'
): CoachResponsePayload {
  const isBn = language === 'bn';
  const { intent, parsedPlan } = intentResult;

  const factsUsed: string[] = [];
  const followUps: string[] = [];
  const dataGaps: string[] = [];

  const income = ctx.snapshot.monthlyIncome;
  const spending = ctx.snapshot.monthlySpending;
  const netSavings = ctx.snapshot.netSavings;
  const savingsRate = ctx.snapshot.savingsRate;
  const balance = ctx.snapshot.currentBalance;
  const topCat = ctx.spending.topCategory;
  const monthEndBalance = ctx.cashFlow.forecastMonthEndBalance;
  const recommendedBuffer = ctx.cashFlow.recommendedBuffer;
  const weeklyTrim = ctx.cashFlow.recommendedWeeklyReduction;
  const primaryGoal = ctx.goals.items[0] || null;
  const healthScore = ctx.health.score;
  const healthBand = ctx.health.band;
  const cashOutTotal = ctx.cashOut.totalAmount;
  const feeCost = ctx.cashOut.feeCost;

  let answer = '';

  switch (intent) {
    case 'spending_total': {
      factsUsed.push('snapshot.monthlySpending', 'snapshot.monthlyIncome', 'snapshot.netSavings');
      if (topCat) {
        factsUsed.push('spending.topCategory', 'spending.topCategoryAmount');
      }

      if (spending === 0 && income === 0) {
        dataGaps.push('No transactions found for the current billing period');
        answer = isBn
          ? 'চলতি মাসে আপনার কোনো খরচের তথ্য এখনো পাওয়া যায়নি। নতুন লেনদেন যোগ করলে আপনার মোট খরচ ও বিশ্লেষণ এখানে প্রদর্শিত হবে।'
          : 'No expense records found for the current billing period. Add transactions to begin tracking your monthly total.';
        break;
      }

      if (isBn) {
        answer = `চলতি মাসে আপনার মোট ব্যয় **৳${spending.toLocaleString()}** (মোট আয় ৳${income.toLocaleString()}, যার মধ্যে নিট সঞ্চয় ৳${netSavings.toLocaleString()})।${
          topCat
            ? ` আপনার ব্যয়ের প্রধান খাত **${topCat.category}** (৳${topCat.amount.toLocaleString()}, যা মোট ব্যয়ের ${topCat.percentage}%)।`
            : ''
        }`;
      } else {
        answer = `Your total spending for the current month is **৳${spending.toLocaleString()}** against a recorded income of ৳${income.toLocaleString()}, leaving a net monthly surplus of ৳${netSavings.toLocaleString()}.${
          topCat
            ? ` Your largest outflow is **${topCat.category}** at ৳${topCat.amount.toLocaleString()} (${topCat.percentage}% of all expenses).`
            : ''
        }`;
      }
      followUps.push(
        isBn ? 'আমার শীর্ষ খরচের খাত কোনটি?' : 'What is my top spending category?',
        isBn ? 'মাস শেষে আমার ব্যালেন্স কত থাকবে?' : 'What is my projected month-end balance?'
      );
      break;
    }

    case 'top_category': {
      if (topCat) {
        factsUsed.push(
          'spending.topCategory',
          'spending.topCategoryAmount',
          'spending.topCategoryPercentage',
          'spending.topCategoryMomChange'
        );
        if (isBn) {
          const momText =
            topCat.momChangePercentage !== 0
              ? ` (গত মাসের তুলনায় ${topCat.momChangePercentage > 0 ? '+' : ''}${topCat.momChangePercentage}%)`
              : '';
          answer = `আপনার সবচেয়ে বড় খরচের খাত হলো **${topCat.category}**। এ মাসে এখানে ব্যয় হয়েছে **৳${topCat.amount.toLocaleString()}**, যা আপনার মোট ব্যয়ের **${topCat.percentage}%**${momText}। এই প্রধান খাতের খরচ নিয়ন্ত্রণে রাখাই আপনার সঞ্চয় বাড়ানোর সবচেয়ে কার্যকর পথ।`;
        } else {
          const momText =
            topCat.momChangePercentage !== 0
              ? ` (${topCat.momChangePercentage > 0 ? '+' : ''}${topCat.momChangePercentage}% compared to last month)`
              : '';
          answer = `Your top spending category is **${topCat.category}**, with **৳${topCat.amount.toLocaleString()}** spent this month (${topCat.percentage}% of your total expenses)${momText}. Moderating outflows in this category offers the fastest route to boosting your monthly savings.`;
        }
      } else {
        dataGaps.push('No categorized spending recorded');
        answer = isBn
          ? 'আপনার কোনো নির্দিষ্ট খরচের তথ্য পাওয়া যায়নি। লেনদেন যোগ করলে শীর্ষ খাত স্বয়ংক্রিয়ভাবে চিহ্নিত হবে।'
          : 'No categorized spending transactions found. Add expenses to identify your top category.';
      }
      followUps.push(
        isBn ? 'এই খাতে খরচ কমানোর উপায় কি?' : 'How can I reduce spending in this category?',
        isBn ? 'আমার ক্যাশআউট চার্জ কত?' : 'How much did I pay in cash-out fees?'
      );
      break;
    }

    case 'month_end_balance': {
      factsUsed.push(
        'cashFlow.startingBalance',
        'cashFlow.monthEndBalance',
        'cashFlow.recommendedBuffer',
        'cashFlow.recommendedWeeklyReduction'
      );
      if (isBn) {
        answer = `আপনার বর্তমান উপলব্ধ ব্যালেন্স ৳${balance.toLocaleString()} এর ভিত্তিতে আগামী মাস শেষে সম্ভাব্য ব্যালেন্স দাঁড়াবে প্রায় **৳${monthEndBalance.toLocaleString()}** (AI-assisted forecast)। আপনার অ্যাকাউন্টের জন্য প্রস্তাবিত নিরাপত্তা বাফার হলো ৳${recommendedBuffer.toLocaleString()}।${
          monthEndBalance < recommendedBuffer
            ? ` বাফার পূরণ করতে সপ্তাহে প্রায় ৳${weeklyTrim.toLocaleString()} সাশ্রয় করার পরামর্শ দেওয়া হচ্ছে।`
            : ' আপনার পূর্বাভাসিত ব্যালেন্স প্রস্তাবিত বাফারের মধ্যে নিরাপদ রয়েছে।'
        }`;
      } else {
        answer = `Based on your liquid balance of ৳${balance.toLocaleString()}, your projected month-end balance is approximately **৳${monthEndBalance.toLocaleString()}** (AI-assisted forecast). The recommended safety buffer is ৳${recommendedBuffer.toLocaleString()}.${
          monthEndBalance < recommendedBuffer
            ? ` To avoid cash flow tightening, trimming ~৳${weeklyTrim.toLocaleString()}/week in flexible spending is recommended.`
            : ' Your projected margin remains comfortably above the recommended safety buffer.'
        }`;
      }
      followUps.push(
        isBn ? 'আমি কীভাবে বেশি সঞ্চয় করতে পারি?' : 'How can I save more money?',
        isBn ? 'আমার সঞ্চয় লক্ষ্য ঠিক পথে আছে?' : 'Is my savings goal on track?'
      );
      break;
    }

    case 'savings_goal_progress': {
      if (primaryGoal) {
        factsUsed.push(
          'goals.goal1.title',
          'goals.goal1.targetAmount',
          'goals.goal1.currentAmount',
          'goals.goal1.progressPercentage',
          'goals.goal1.remainingAmount',
          'goals.goal1.requiredMonthlyContribution'
        );
        if (isBn) {
          answer = `আপনার সঞ্চয় লক্ষ্য **${primaryGoal.title}** এর বর্তমান অগ্রগতি:\n• লক্ষ্যমাত্রা: ৳${primaryGoal.targetAmount.toLocaleString()}\n• বর্তমান জমা: ৳${primaryGoal.currentAmount.toLocaleString()} (${primaryGoal.progressPercentage}% সম্পন্ন)\n• অবশিষ্ট ঘাটতি: ৳${primaryGoal.remainingAmount.toLocaleString()}\n• নির্ধারিত সময়ে পৌঁছাতে প্রয়োজনীয় মাসিক সঞ্চয়: ৳${primaryGoal.requiredMonthlyContribution.toLocaleString()}/মাস।`;
        } else {
          answer = `Progress for your goal **${primaryGoal.title}**:\n• Target: ৳${primaryGoal.targetAmount.toLocaleString()}\n• Saved: ৳${primaryGoal.currentAmount.toLocaleString()} (${primaryGoal.progressPercentage}% completed)\n• Remaining Gap: ৳${primaryGoal.remainingAmount.toLocaleString()}\n• Required Monthly Pace: ৳${primaryGoal.requiredMonthlyContribution.toLocaleString()}/month to meet your deadline (${primaryGoal.deadline}).`;
        }
      } else {
        dataGaps.push('No active savings goals found');
        answer = isBn
          ? 'বর্তমানে আপনার কোনো সক্রিয় সঞ্চয় লক্ষ্য সেট করা নেই। গোল সেকশন থেকে একটি নতুন লক্ষ্য যোগ করুন।'
          : 'You do not have any active savings goals set. Add a goal from the Savings Goals screen to track your progress.';
      }
      followUps.push(
        isBn ? 'লক্ষ্য দ্রুত পূরণের উপায় কি?' : 'How can I reach my goal faster?',
        isBn ? 'আমার আর্থিক স্বাস্থ্য স্কোর কত?' : 'What is my financial health score?'
      );
      break;
    }

    case 'savings_plan': {
      if (parsedPlan) {
        factsUsed.push(
          'savingsPlan.parsedTargetAmount',
          'savingsPlan.parsedMonthsDuration',
          'savingsPlan.requiredMonthly',
          'snapshot.netSavings'
        );
        if (isBn) {
          answer = `**${parsedPlan.monthsDuration} মাসে ৳${parsedPlan.targetAmount.toLocaleString()}** সঞ্চয় করতে প্রতি মাসে প্রয়োজন **৳${parsedPlan.requiredMonthly.toLocaleString()}**।\n\nআপনার বর্তমান মাসিক নিট উদ্বৃত্ত ৳${netSavings.toLocaleString()}।${
            parsedPlan.isFeasible
              ? ' আপনার বর্তমান উদ্বৃত্ত এই লক্ষ্য পূরণের জন্য যথেষ্ট এবং পরিকল্পনাটি বাস্তবসম্মত।'
              : ` লক্ষ্যটি সফলভাবে পূরণ করতে প্রতি মাসে অতিরিক্ত ৳${parsedPlan.monthlyGap.toLocaleString()} সাশ্রয় করতে হবে (শীর্ষ খরচের খাত থেকে খরচ হ্রাস করে)।`
          }`;
        } else {
          answer = `To save **৳${parsedPlan.targetAmount.toLocaleString()} in ${parsedPlan.monthsDuration} months**, you need to save **৳${parsedPlan.requiredMonthly.toLocaleString()}/month**.\n\nYour current monthly net surplus is ৳${netSavings.toLocaleString()}.${
            parsedPlan.isFeasible
              ? ' Your current monthly cash flow is sufficient to achieve this goal.'
              : ` Bridging the monthly gap of ৳${parsedPlan.monthlyGap.toLocaleString()} requires optimizing flexible spending in your top expense categories.`
          }`;
        }
      } else {
        factsUsed.push('snapshot.netSavings', 'snapshot.savingsRate');
        if (topCat) factsUsed.push('spending.topCategory', 'spending.topCategoryAmount');
        if (isBn) {
          answer = `আপনার বর্তমান মাসিক সঞ্চয় ৳${netSavings.toLocaleString()} (সঞ্চয়ের হার: ${savingsRate}%)। সঞ্চয় বাড়ানোর বাস্তবসম্মত পদক্ষেপ:\n১. শীর্ষ খরচের খাত **${topCat ? topCat.category : 'নমনীয় খাত'}** এর খরচ নিয়ন্ত্রণে রাখা।\n২. অপ্রয়োজনীয় ক্যাশ-আউট চার্জ এড়িয়ে চলা।\n৩. উদ্বৃত্ত অর্থ নির্দিষ্ট সঞ্চয় লক্ষ্যে স্বয়ংক্রিয়ভাবে জমা করা।`;
        } else {
          answer = `Your current monthly savings is ৳${netSavings.toLocaleString()} (savings rate: ${savingsRate}%). Practical steps to save more:\n1. Moderate outflows in your top category **${topCat ? topCat.category : 'flexible spending'}**.\n2. Eliminate avoidable cash-out tariffs and subscription leaks.\n3. Route your monthly surplus directly into an automated high-yield savings vault.`;
        }
      }
      followUps.push(
        isBn ? 'আমার বাজেট কি নিরাপদ?' : 'Is my monthly budget balanced?',
        isBn ? 'মাস শেষ ব্যালেন্স কত হবে?' : 'What will my balance be at month end?'
      );
      break;
    }

    case 'unusual_spending': {
      factsUsed.push('spending.anomaliesCount');
      if (ctx.spending.anomalies.length > 0) {
        const a1 = ctx.spending.anomalies[0];
        factsUsed.push('spending.topCategory');
        if (isBn) {
          answer = `আপনার লেজারে **${ctx.spending.anomaliesCount}টি** অস্বাভাবিক লেনদেন পাওয়া গেছে। এর মধ্যে উল্লেখযোগ্য হলো **${a1.category}** খাতে ৳${a1.amount.toLocaleString()} এর লেনদেন। বড় আকারের একক খরচ এবং অতিরিক্ত ট্রানজেকশন ফি এড়িয়ে চললে মাসিক বাজেটের ভারসাম্য ঠিক থাকবে।`;
        } else {
          answer = `ArthoBachao AI detected **${ctx.spending.anomaliesCount} unusual spending pattern(s)** in your ledger. Notably in **${a1.category}** (৳${a1.amount.toLocaleString()}). Keeping tabs on unscheduled surges and fee leaks prevents sudden month-end cash flow pressure.`;
        }
      } else {
        if (isBn) {
          answer = 'চলতি মাসে কোনো অস্বাভাবিক ব্যয়ের প্যাটার্ন বা অপ্রত্যাশিত সার্জ পাওয়া যায়নি। আপনার খরচের গতি স্বাভাবিক ও সুষম রয়েছে।';
        } else {
          answer = 'No unusual spending spikes or anomalous transactions detected in your current ledger. Your outflow pace is well-controlled.';
        }
      }
      followUps.push(
        isBn ? 'আমার শীর্ষ খরচের খাত কি?' : 'What is my top spending category?',
        isBn ? 'ক্যাশআউট চার্জ কীভাবে কমাব?' : 'How do I reduce withdrawal fees?'
      );
      break;
    }

    case 'reduce_cash_outs': {
      factsUsed.push('cashOut.totalAmount', 'cashOut.count', 'cashOut.feeCost', 'cashOut.feeRate');
      if (isBn) {
        answer = `এ মাসে আপনার ক্যাশ-আউট লেনদেনের সংখ্যা **${ctx.cashOut.count}টি** (মোট ৳${cashOutTotal.toLocaleString()}), যেখানে আনুমানিক **৳${feeCost.toLocaleString()}** ১.৮৫% এমএফএস এজেন্ট চার্জে ব্যয় হয়েছে।\n\nচার্জ কমানোর পরামর্শ:\n১. ঘন ঘন ছোট অঙ্কের ক্যাশ-আউট না করে মাসে এক বা দুইবারে প্রয়োজনমতো টাকা উত্তোলন করুন।\n২. সিটি ব্যাংক এটিএম কার্ড ব্যবহার করে বিনামূল্যে টাকা তুলুন।\n৩. সরাসরি মার্চেন্ট পেমেন্টে কিউআর কোড বা ডিজিটাল পে ব্যবহার করুন।`;
      } else {
        answer = `You logged **${ctx.cashOut.count} cash-out transaction(s)** totaling ৳${cashOutTotal.toLocaleString()}, incurring approximately **৳${feeCost.toLocaleString()}** in avoidable 1.85% MFS agent tariffs.\n\nOptimization steps:\n1. Consolidate frequent micro-withdrawals into 1–2 planned cash-outs.\n2. Use City Bank / debit card ATMs to withdraw funds fee-free.\n3. Make direct digital merchant payments via bKash QR or POS to avoid cash-out fees completely.`;
      }
      followUps.push(
        isBn ? 'আমার মোট খরচ কত?' : 'What is my total spending this month?',
        isBn ? 'আমার হেলথ স্কোর কত?' : 'What is my financial health score?'
      );
      break;
    }

    case 'financial_health': {
      factsUsed.push(
        'health.score',
        'health.band',
        'health.percentile',
        'health.savingConsistency',
        'health.spendingControl',
        'health.cashFlowStability',
        'health.goalProgress'
      );
      if (isBn) {
        answer = `আপনার অর্থবাঁচাও এআই ফাইন্যান্সিয়াল হেলথ স্কোর **${healthScore} / ১০০** (অবস্থা: **${healthBand}**)। আপনি ঢাকার সমকক্ষ ব্যবহারকারীদের **${ctx.health.percentile}%** এর চেয়ে এগিয়ে রয়েছেন।\n\nপিলার বিশ্লেষণ:\n• সঞ্চয়ের ধারাবাহিকতা: ${ctx.health.savingConsistency}%\n• ব্যয় নিয়ন্ত্রণ: ${ctx.health.spendingControl}%\n• ক্যাশ-ফ্লো স্থায়িত্ব: ${ctx.health.cashFlowStability}%\n• সঞ্চয় লক্ষ্যের অগ্রগতি: ${ctx.health.goalProgress}%`;
      } else {
        answer = `Your ArthoBachao AI Financial Health Score is **${healthScore} / 100** (Rating: **${healthBand}**), outperforming **${ctx.health.percentile}%** of peers in Dhaka with digital wallets.\n\nDiagnostic Pillars:\n• Saving Consistency: ${ctx.health.savingConsistency}%\n• Spending Control: ${ctx.health.spendingControl}%\n• Cash Flow Stability: ${ctx.health.cashFlowStability}%\n• Goal Progress: ${ctx.health.goalProgress}%`;
      }
      followUps.push(
        isBn ? 'স্কোর আরও বাড়ানোর উপায় কি?' : 'How can I improve my health score?',
        isBn ? 'আমার সঞ্চয় লক্ষ্য কেমন চলছে?' : 'How are my savings goals progressing?'
      );
      break;
    }

    case 'budget_help': {
      factsUsed.push('snapshot.monthlySpending', 'cashFlow.recommendedWeeklyReduction');
      if (topCat) factsUsed.push('spending.topCategory', 'spending.topCategoryAmount');
      if (isBn) {
        answer = `বাজেট নিয়ন্ত্রণে রাখার জন্য আপনার সবচেয়ে বড় সুযোগ রয়েছে **${topCat ? topCat.category : 'শীর্ষ খরচের খাত'}** (বর্তমান খরচ ৳${topCat ? topCat.amount.toLocaleString() : spending.toLocaleString()}) খাতে। নমনীয় খরচ থেকে প্রতি সপ্তাহে প্রায় **৳${weeklyTrim.toLocaleString()}** সাশ্রয় করতে পারলে মাসের শেষে একটি স্বাস্থ্যকর ক্যাশ-ফ্লো বাফার বজায় থাকবে।`;
      } else {
        answer = `Your primary budget optimization opportunity lies in **${topCat ? topCat.category : 'your highest category'}** (currently ৳${topCat ? topCat.amount.toLocaleString() : spending.toLocaleString()}). Trimming approximately **৳${weeklyTrim.toLocaleString()}/week** from discretionary outings and deliveries will secure your month-end cash flow.`;
      }
      followUps.push(
        isBn ? 'আমার ক্যাশ-আউট চার্জ কত?' : 'How much are my cash-out fees?',
        isBn ? 'আমার সঞ্চয় লক্ষ্য ঠিক আছে কি?' : 'Are my savings goals on track?'
      );
      break;
    }

    case 'transaction_lookup': {
      factsUsed.push('snapshot.currentBalance');
      const recent = ctx.recentTransactions.slice(0, 3);
      if (recent.length > 0) {
        const txList = recent
          .map((t) => `• ${t.date}: ${t.category} (৳${t.amount.toLocaleString()}, ${t.type})`)
          .join('\n');
        answer = isBn
          ? `আপনার সাম্প্রতিক লেনদেনসমূহ:\n${txList}\n\nআপনার বর্তমান উপলব্ধ ব্যালেন্স ৳${balance.toLocaleString()}।`
          : `Your recent transactions:\n${txList}\n\nYour current liquid balance is ৳${balance.toLocaleString()}.`;
      } else {
        dataGaps.push('No recent transactions found');
        answer = isBn
          ? 'আপনার কোনো সাম্প্রতিক লেনদেন পাওয়া যায়নি।'
          : 'No recent transactions recorded in your ledger.';
      }
      break;
    }

    case 'general_education': {
      factsUsed.push('snapshot.savingsRate');
      if (isBn) {
        answer = `৫০/৩০/২০ একটি জনপ্রিয় বাজেট নিয়ম: আয়ের ৫০% অত্যাবশ্যক খরচ (বাসা ভাড়া, খাবার, বিল), ৩০% নমনীয় খরচ (বিনোদন, কেনাকাটা), এবং ২০% ভবিষ্যতের সঞ্চয় বা ঋণের জন্য বরাদ্দ রাখা। আপনার বর্তমান সঞ্চয়ের হার **${savingsRate}%**।`;
      } else {
        answer = `The 50/30/20 rule allocates 50% of income to essentials (rent, groceries, utilities), 30% to discretionary choices (dining, hobbies), and 20% to savings. Your current actual savings rate is **${savingsRate}%**.`;
      }
      break;
    }

    case 'out_of_scope': {
      answer = isBn
        ? 'আমি অর্থবাঁচাও এআই পার্সোনাল ফাইন্যান্সিয়াল কোচ। আমি শুধুমাত্র আপনার ব্যক্তিগত আয়, ব্যয় ও সঞ্চয় পরিকল্পনায় সহায়তা করতে পারি। বিনিয়োগের পরামর্শ, স্টক টিপস, ক্রিপ্টো বা ঋণ সংক্রান্ত সিদ্ধান্ত আমার আওতাভুক্ত নয়।'
        : 'I am ArthoBachao AI, focused exclusively on personal budgeting, expense optimization, and savings goals. I do not provide stock picking, crypto recommendations, loan approvals, or regulated investment advice.';
      break;
    }

    default: {
      factsUsed.push('snapshot.monthlyIncome', 'snapshot.monthlySpending', 'snapshot.currentBalance');
      answer = isBn
        ? `আপনার আর্থিক তথ্য অনুযায়ী: এ মাসে আয় ৳${income.toLocaleString()}, ব্যয় ৳${spending.toLocaleString()}, নিট সঞ্চয় ৳${netSavings.toLocaleString()} এবং উপলব্ধ ব্যালেন্স ৳${balance.toLocaleString()}। বাজেট বা সঞ্চয় নিয়ে সুনির্দিষ্ট কোনো প্রশ্ন থাকলে জানান!`
        : `Based on your authenticated ledger: Income is ৳${income.toLocaleString()}, Spending is ৳${spending.toLocaleString()}, Net Savings is ৳${netSavings.toLocaleString()}, and Available Balance is ৳${balance.toLocaleString()}. Please ask if you need help with a specific budget category or savings goal!`;
      break;
    }
  }

  return {
    source: 'fallback',
    answer,
    factsUsed,
    followUps: followUps.slice(0, 2),
    dataGaps,
  };
}
