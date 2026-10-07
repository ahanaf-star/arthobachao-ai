import { CoachContext, FactItem } from './coachContextBuilder';

export type CoachIntent =
  | 'spending_total'
  | 'top_category'
  | 'month_end_balance'
  | 'savings_goal_progress'
  | 'savings_plan'
  | 'unusual_spending'
  | 'reduce_cash_outs'
  | 'financial_health'
  | 'budget_help'
  | 'transaction_lookup'
  | 'general_education'
  | 'out_of_scope';

export interface ParsedSavingsPlan {
  targetAmount: number;
  monthsDuration: number;
  requiredMonthly: number;
  currentMonthlySurplus: number;
  isFeasible: boolean;
  monthlyGap: number;
}

export interface IntentResult {
  intent: CoachIntent;
  confidence: number;
  parsedPlan?: ParsedSavingsPlan;
  matchedKeywords: string[];
}

export interface SlicedContext {
  intent: CoachIntent;
  dataWindow: {
    currentMonth: string;
    today: string;
    hasData: boolean;
  };
  facts: Record<string, any>;
  factKeys: string[];
  disclaimer: string;
}

/**
 * Normalizes text for keyword matching in English and Bengali
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[৳$,?!.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extracts target amount and months duration from queries like:
 * "save ৳30,000 in 6 months", "save 50000 in 10 months", "৬ মাসে ৩০,০০০ টাকা সঞ্চয়"
 */
export function parseSavingsTarget(
  query: string,
  currentNetSavings: number = 0
): ParsedSavingsPlan | undefined {
  // Convert Bengali numerals to Western digits for unified parsing
  const bnToEnDigits: Record<string, string> = {
    '০': '0',
    '১': '1',
    '২': '2',
    '৩': '3',
    '৪': '4',
    '৫': '5',
    '৬': '6',
    '৭': '7',
    '৮': '8',
    '৯': '9',
  };
  const normalizedDigits = query.replace(/[০-৯]/g, (d) => bnToEnDigits[d] || d);

  // Pattern 1: "save [amount] in [months] months" or "save [amount] within [months] months"
  const enMatch = normalizedDigits.match(
    /(?:save|target|reach)\s*(?:bdt|tk|taka|৳|\$)?\s*([0-9,]+)\s*(?:in|within|over|for)?\s*([0-9]+)\s*(?:months?|mas)/i
  );
  if (enMatch) {
    const targetAmount = parseInt(enMatch[1].replace(/,/g, ''), 10);
    const monthsDuration = parseInt(enMatch[2], 10);
    if (targetAmount > 0 && monthsDuration > 0) {
      const requiredMonthly = Math.round(targetAmount / monthsDuration);
      const isFeasible = currentNetSavings >= requiredMonthly;
      const monthlyGap = Math.max(0, requiredMonthly - currentNetSavings);
      return {
        targetAmount,
        monthsDuration,
        requiredMonthly,
        currentMonthlySurplus: currentNetSavings,
        isFeasible,
        monthlyGap,
      };
    }
  }

  // Pattern 2: "[months] মাসে [amount] টাকা" or "[amount] টাকা [months] মাসে"
  const bnMatch1 = normalizedDigits.match(/([0-9]+)\s*মাসে\s*([0-9,]+)\s*(?:টাকা)?/);
  if (bnMatch1) {
    const monthsDuration = parseInt(bnMatch1[1], 10);
    const targetAmount = parseInt(bnMatch1[2].replace(/,/g, ''), 10);
    if (targetAmount > 0 && monthsDuration > 0) {
      const requiredMonthly = Math.round(targetAmount / monthsDuration);
      const isFeasible = currentNetSavings >= requiredMonthly;
      const monthlyGap = Math.max(0, requiredMonthly - currentNetSavings);
      return {
        targetAmount,
        monthsDuration,
        requiredMonthly,
        currentMonthlySurplus: currentNetSavings,
        isFeasible,
        monthlyGap,
      };
    }
  }

  const bnMatch2 = normalizedDigits.match(/([0-9,]+)\s*(?:টাকা)?\s*([0-9]+)\s*মাসে/);
  if (bnMatch2) {
    const targetAmount = parseInt(bnMatch2[1].replace(/,/g, ''), 10);
    const monthsDuration = parseInt(bnMatch2[2], 10);
    if (targetAmount > 0 && monthsDuration > 0) {
      const requiredMonthly = Math.round(targetAmount / monthsDuration);
      const isFeasible = currentNetSavings >= requiredMonthly;
      const monthlyGap = Math.max(0, requiredMonthly - currentNetSavings);
      return {
        targetAmount,
        monthsDuration,
        requiredMonthly,
        currentMonthlySurplus: currentNetSavings,
        isFeasible,
        monthlyGap,
      };
    }
  }

  return undefined;
}

/**
 * Deterministic rule-based intent classifier (Zero LLM calls)
 */
export function classifyIntent(query: string, currentNetSavings: number = 0): IntentResult {
  const norm = normalizeText(query);

  // Check for out-of-scope / unauthorized domains first
  // Investments / Stocks / Crypto / Medical / Code / Credit Approval
  const outOfScopePatterns = [
    'buy stock',
    'stock pick',
    'crypto',
    'bitcoin',
    'ethereum',
    'invest in shares',
    'share market tip',
    'শেয়ার বাজার',
    'স্টক কিনব',
    'ক্রিপ্টো',
    'approve loan',
    'loan guarantee',
    'credit decision',
    'medical advice',
    'doctor',
    'write code',
    'recipe',
  ];
  for (const p of outOfScopePatterns) {
    if (norm.includes(p)) {
      return {
        intent: 'out_of_scope',
        confidence: 0.95,
        matchedKeywords: [p],
      };
    }
  }

  // Check for savings plan with parsed parameters ("save 30,000 in 6 months")
  const parsedPlan = parseSavingsTarget(query, currentNetSavings);
  if (parsedPlan) {
    return {
      intent: 'savings_plan',
      confidence: 0.99,
      parsedPlan,
      matchedKeywords: ['parsed_target_plan'],
    };
  }

  // 1. Cash-out & MFS Fee reduction
  const cashOutPatterns = [
    'cash out',
    'cash-out',
    'mfs fee',
    'bkash charge',
    'nagad charge',
    'atm fee',
    'withdrawal fee',
    'bank fee',
    'tariff',
    'fee leak',
    'ক্যাশ আউট',
    'ক্যাশআউট',
    'উইথড্র ফি',
    'চার্জ কমাব',
    'ফি সাশ্রয়',
  ];
  for (const p of cashOutPatterns) {
    if (norm.includes(p)) {
      return { intent: 'reduce_cash_outs', confidence: 0.9, matchedKeywords: [p] };
    }
  }

  // 2. Month-End Balance & Cash Flow Forecast
  const monthEndPatterns = [
    'month end',
    'month-end',
    'end of month',
    'run short',
    'short before',
    'left over',
    'projected balance',
    'forecast balance',
    'balance next month',
    'cash flow',
    'ক্যাশ ফ্লো',
    'মাস শেষ',
    'মাস শেষে',
    'টাকা শেষ',
    'কত টাকা থাকতে পারে',
    'টানাপোড়েন',
  ];
  for (const p of monthEndPatterns) {
    if (norm.includes(p)) {
      return { intent: 'month_end_balance', confidence: 0.9, matchedKeywords: [p] };
    }
  }

  // 3. Top Spending Category
  const topCatPatterns = [
    'top category',
    'top spending',
    'highest category',
    'highest expense',
    'where do i spend most',
    'spend the most',
    'biggest outflow',
    'শীর্ষ খাত',
    'সবচেয়ে বেশি খরচ',
    'কোন খাতে বেশি',
    'কোথায় বেশি খরচ',
    'সর্বোচ্চ খরচ',
  ];
  for (const p of topCatPatterns) {
    if (norm.includes(p)) {
      return { intent: 'top_category', confidence: 0.92, matchedKeywords: [p] };
    }
  }

  // 4. Unusual Spending & Anomalies
  const anomalyPatterns = [
    'unusual',
    'anomaly',
    'surge',
    'unexpected expense',
    'higher than usual',
    'food surge',
    'spike',
    'অস্বাভাবিক',
    'হঠাৎ বৃদ্ধি',
    'অপ্রত্যাশিত',
    'সার্জ',
    'বেশি লেগেছে',
  ];
  for (const p of anomalyPatterns) {
    if (norm.includes(p)) {
      return { intent: 'unusual_spending', confidence: 0.88, matchedKeywords: [p] };
    }
  }

  // 5. Savings Goals Progress & On-Track Status
  const goalPatterns = [
    'goal',
    'on track',
    'emergency fund',
    'target amount',
    'progress on goal',
    'goal deadline',
    'লক্ষ্য',
    'টার্গেট',
    'ইমার্জেন্সি ফান্ড',
    'লক্ষ্যমাত্রা',
    'অন ট্র্যাক',
  ];
  for (const p of goalPatterns) {
    if (norm.includes(p)) {
      return { intent: 'savings_goal_progress', confidence: 0.9, matchedKeywords: [p] };
    }
  }

  // 6. Savings Plan & Saving More
  const savingsPlanPatterns = [
    'save more',
    'how can i save',
    'savings rate',
    'reach 30%',
    'increase savings',
    'savings plan',
    'বেশি সঞ্চয়',
    'সঞ্চয় বাড়াব',
    'কীভাবে সঞ্চয়',
    'সঞ্চয়ের হার',
  ];
  for (const p of savingsPlanPatterns) {
    if (norm.includes(p)) {
      return { intent: 'savings_plan', confidence: 0.88, matchedKeywords: [p] };
    }
  }

  // 7. Financial Health Score
  const healthPatterns = [
    'health score',
    'financial health',
    'how healthy',
    'health status',
    'my score',
    'আর্থিক স্বাস্থ্য',
    'হেলথ স্কোর',
    'স্কোর কত',
    'আর্থিক অবস্থা',
  ];
  for (const p of healthPatterns) {
    if (norm.includes(p)) {
      return { intent: 'financial_health', confidence: 0.92, matchedKeywords: [p] };
    }
  }

  // 8. Total Spending Inquiries
  const totalSpendingPatterns = [
    'how much did i spend',
    'total spending',
    'total expense',
    'how much i spent',
    'spending this month',
    'কত টাকা খরচ',
    'মোট খরচ',
    'এ মাসের খরচ',
    'কত খরচ করেছি',
  ];
  for (const p of totalSpendingPatterns) {
    if (norm.includes(p)) {
      return { intent: 'spending_total', confidence: 0.9, matchedKeywords: [p] };
    }
  }

  // 9. Budget & Spending Reduction Advice
  const budgetPatterns = [
    'budget',
    'reduce spending',
    'cut spending',
    'which category should i cut',
    'where should i reduce',
    'trim expense',
    'বাজেট',
    'খরচ কমাব',
    'খরচ কাটব',
    'কোন খাত কমাব',
  ];
  for (const p of budgetPatterns) {
    if (norm.includes(p)) {
      return { intent: 'budget_help', confidence: 0.85, matchedKeywords: [p] };
    }
  }

  // 10. Transaction Lookup
  const txLookupPatterns = [
    'last transaction',
    'recent transaction',
    'recent spending',
    'latest purchase',
    'what was my last',
    'শেষ লেনদেন',
    'সাম্প্রতিক লেনদেন',
    'সাম্প্রতিক খরচ',
  ];
  for (const p of txLookupPatterns) {
    if (norm.includes(p)) {
      return { intent: 'transaction_lookup', confidence: 0.88, matchedKeywords: [p] };
    }
  }

  // 11. General Education
  const generalEduPatterns = [
    'what is',
    'explain',
    '50/30/20',
    'rule',
    'কীভাবে কাজ করে',
    'কাকে বলে',
  ];
  for (const p of generalEduPatterns) {
    if (norm.includes(p)) {
      return { intent: 'general_education', confidence: 0.75, matchedKeywords: [p] };
    }
  }

  // Default fallback intent for general inquiries
  return {
    intent: 'spending_total',
    confidence: 0.6,
    matchedKeywords: ['default_fallback'],
  };
}

/**
 * Context Slicing: Returns only the exact fact subset needed for the classified intent
 */
export function sliceContext(fullContext: CoachContext, intentResult: IntentResult): SlicedContext {
  const { intent, parsedPlan } = intentResult;
  const facts: Record<string, any> = {};
  const factKeys: string[] = [];

  const addFact = (key: string, value: any) => {
    facts[key] = value;
    factKeys.push(key);
  };

  // Base snapshot facts included in most slices
  const includeSnapshot = (includeIncomeExpenses = true) => {
    addFact('snapshot.currentBalance', fullContext.snapshot.currentBalance);
    if (includeIncomeExpenses) {
      addFact('snapshot.monthlyIncome', fullContext.snapshot.monthlyIncome);
      addFact('snapshot.monthlySpending', fullContext.snapshot.monthlySpending);
      addFact('snapshot.netSavings', fullContext.snapshot.netSavings);
      addFact('snapshot.savingsRate', fullContext.snapshot.savingsRate);
    }
  };

  switch (intent) {
    case 'top_category':
      includeSnapshot(true);
      if (fullContext.spending.topCategory) {
        addFact('spending.topCategory', fullContext.spending.topCategory.category);
        addFact('spending.topCategoryAmount', fullContext.spending.topCategory.amount);
        addFact('spending.topCategoryPercentage', fullContext.spending.topCategory.percentage);
        addFact('spending.topCategoryMomChange', fullContext.spending.topCategory.momChangePercentage);
      }
      addFact('spending.totalSpending', fullContext.spending.totalSpending);
      break;

    case 'spending_total':
      includeSnapshot(true);
      addFact('spending.totalSpending', fullContext.spending.totalSpending);
      if (fullContext.spending.topCategory) {
        addFact('spending.topCategory', fullContext.spending.topCategory.category);
        addFact('spending.topCategoryAmount', fullContext.spending.topCategory.amount);
      }
      break;

    case 'month_end_balance':
      includeSnapshot(true);
      addFact('cashFlow.startingBalance', fullContext.cashFlow.startingBalance);
      addFact('cashFlow.forecastMonthEndBalance', fullContext.cashFlow.forecastMonthEndBalance);
      addFact('cashFlow.recommendedBuffer', fullContext.cashFlow.recommendedBuffer);
      addFact('cashFlow.shortfall', fullContext.cashFlow.shortfall);
      addFact('cashFlow.recommendedWeeklyReduction', fullContext.cashFlow.recommendedWeeklyReduction);
      break;

    case 'savings_goal_progress':
      includeSnapshot(false);
      addFact('snapshot.netSavings', fullContext.snapshot.netSavings);
      addFact('goals.totalGoals', fullContext.goals.totalGoals);
      fullContext.goals.items.forEach((g, idx) => {
        const p = `goals.goal${idx + 1}`;
        addFact(`${p}.title`, g.title);
        addFact(`${p}.targetAmount`, g.targetAmount);
        addFact(`${p}.currentAmount`, g.currentAmount);
        addFact(`${p}.progressPercentage`, g.progressPercentage);
        addFact(`${p}.remainingAmount`, g.remainingAmount);
        addFact(`${p}.deadline`, g.deadline);
        addFact(`${p}.requiredMonthlyContribution`, g.requiredMonthlyContribution);
      });
      break;

    case 'savings_plan':
      includeSnapshot(true);
      addFact('goals.totalGoals', fullContext.goals.totalGoals);
      if (fullContext.goals.items.length > 0) {
        const g1 = fullContext.goals.items[0];
        addFact('goals.primaryGoal.title', g1.title);
        addFact('goals.primaryGoal.targetAmount', g1.targetAmount);
        addFact('goals.primaryGoal.currentAmount', g1.currentAmount);
        addFact('goals.primaryGoal.progressPercentage', g1.progressPercentage);
        addFact('goals.primaryGoal.requiredMonthlyContribution', g1.requiredMonthlyContribution);
      }
      if (parsedPlan) {
        addFact('savingsPlan.parsedTargetAmount', parsedPlan.targetAmount);
        addFact('savingsPlan.parsedMonthsDuration', parsedPlan.monthsDuration);
        addFact('savingsPlan.requiredMonthly', parsedPlan.requiredMonthly);
        addFact('savingsPlan.currentMonthlySurplus', parsedPlan.currentMonthlySurplus);
        addFact('savingsPlan.isFeasible', parsedPlan.isFeasible);
        addFact('savingsPlan.monthlyGap', parsedPlan.monthlyGap);
      }
      addFact('cashFlow.recommendedWeeklyReduction', fullContext.cashFlow.recommendedWeeklyReduction);
      break;

    case 'unusual_spending':
      includeSnapshot(true);
      addFact('spending.anomaliesCount', fullContext.spending.anomaliesCount);
      if (fullContext.spending.topCategory) {
        addFact('spending.topCategory', fullContext.spending.topCategory.category);
        addFact('spending.topCategoryAmount', fullContext.spending.topCategory.amount);
      }
      fullContext.spending.anomalies.slice(0, 3).forEach((a, idx) => {
        addFact(`spending.anomaly${idx + 1}.category`, a.category);
        addFact(`spending.anomaly${idx + 1}.amount`, a.amount);
      });
      break;

    case 'reduce_cash_outs':
      includeSnapshot(false);
      addFact('cashOut.totalAmount', fullContext.cashOut.totalAmount);
      addFact('cashOut.count', fullContext.cashOut.count);
      addFact('cashOut.shareOfSpending', fullContext.cashOut.shareOfSpending);
      addFact('cashOut.feeCost', fullContext.cashOut.feeCost);
      addFact('cashOut.feeRate', fullContext.cashOut.feeRate);
      break;

    case 'financial_health':
      includeSnapshot(true);
      addFact('health.score', fullContext.health.score);
      addFact('health.band', fullContext.health.band);
      addFact('health.percentile', fullContext.health.percentile);
      addFact('health.savingConsistency', fullContext.health.savingConsistency);
      addFact('health.spendingControl', fullContext.health.spendingControl);
      addFact('health.cashFlowStability', fullContext.health.cashFlowStability);
      addFact('health.goalProgress', fullContext.health.goalProgress);
      break;

    case 'budget_help':
      includeSnapshot(true);
      if (fullContext.spending.topCategory) {
        addFact('spending.topCategory', fullContext.spending.topCategory.category);
        addFact('spending.topCategoryAmount', fullContext.spending.topCategory.amount);
        addFact('spending.topCategoryPercentage', fullContext.spending.topCategory.percentage);
      }
      addFact('cashFlow.recommendedWeeklyReduction', fullContext.cashFlow.recommendedWeeklyReduction);
      break;

    case 'transaction_lookup':
      addFact('snapshot.currentBalance', fullContext.snapshot.currentBalance);
      fullContext.recentTransactions.slice(0, 5).forEach((t, idx) => {
        addFact(`recentTx${idx + 1}.type`, t.type);
        addFact(`recentTx${idx + 1}.amount`, t.amount);
        addFact(`recentTx${idx + 1}.category`, t.category);
        addFact(`recentTx${idx + 1}.date`, t.date);
        if (t.description) {
          addFact(`recentTx${idx + 1}.description`, t.description);
        }
      });
      break;

    case 'general_education':
      addFact('snapshot.currentBalance', fullContext.snapshot.currentBalance);
      addFact('snapshot.savingsRate', fullContext.snapshot.savingsRate);
      break;

    case 'out_of_scope':
      // Empty financial facts to prevent leakage on non-financial queries
      break;

    default:
      includeSnapshot(true);
      if (fullContext.spending.topCategory) {
        addFact('spending.topCategory', fullContext.spending.topCategory.category);
        addFact('spending.topCategoryAmount', fullContext.spending.topCategory.amount);
      }
      break;
  }

  return {
    intent,
    dataWindow: {
      currentMonth: fullContext.metadata.dataWindow.currentMonth,
      today: fullContext.metadata.today,
      hasData: fullContext.metadata.dataWindow.hasData,
    },
    facts,
    factKeys,
    disclaimer:
      'All figures are precomputed deterministically from the user’s authentic ledger. Do not derive or calculate any new numbers.',
  };
}
