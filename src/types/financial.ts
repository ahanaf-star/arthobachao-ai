// Domain Types for ArthoBachao AI
export type TransactionType = 'expense' | 'income' | 'transfer';

export type CategoryName =
  | 'Food & Groceries'
  | 'Shopping & Gadgets'
  | 'Utility & Fixed Costs'
  | 'Transportation'
  | 'Cash-out & Bank Fees'
  | 'Entertainment & Others'
  | 'Salary & Inflow'
  | 'Savings & Investment';

export type TransactionClassification = 'essential' | 'discretionary' | 'anomalies';

export interface Transaction {
  id: string;
  date: string; // ISO format: YYYY-MM-DD
  type: TransactionType;
  category: CategoryName;
  amount: number;
  description: string;
  merchant: string;
  account: 'bKash' | 'Nagad' | 'City Bank' | 'Dhaka Bank';
  paymentMethod: string; // e.g. "bKash QR Direct", "Visa Card (***4092)", "Debit Card POS"
  classification: TransactionClassification;
  isAnomaly?: boolean;
  anomalyReason?: string;
  fee?: number;
  location?: string;
  isRecurring?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  profileImage?: string;
  preferredLanguage: 'en' | 'bn';
  currency: string;
  createdAt: string;
  tagline?: string;
  memberStatus?: string;
  city?: string;
  monthlyIncome: number;
  riskTolerance: 'Low' | 'Moderate' | 'Aggressive';
  primaryGoalId: string;
  privacyStatus: string;
  linkedAccounts: Array<{
    name: 'bKash' | 'Nagad' | 'City Bank' | 'Dhaka Bank';
    balance: number;
    accountNumber: string;
    type: 'MFS' | 'Bank Account' | 'Credit Card';
  }>;
}

export type UserProfile = User; // Alias for backward-compatibility

export interface SavingsGoal {
  id: string;
  title: string;
  category: string;
  icon: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string; // YYYY-MM-DD
  monthlyPace: number;
  accountVault: string;
  status: 'On Track' | 'At Risk' | 'Completed';
  color?: string;
  notes?: string;
  milestones?: Array<{
    amount: number;
    hit: boolean;
    label: string;
  }>;
}

export interface SpendingCategory {
  category: CategoryName;
  amount: number;
  percentage: number;
  count: number;
  momChangePercentage: number;
  status: 'surging' | 'under_control' | 'stable' | 'efficient' | 'high_friction';
  topMerchants: string[];
}

export interface FinancialSummary {
  monthKey: string; // 'YYYY-MM'
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  savingsRate: number; // percentage (0-100)
  dailyAverageSpend: number;
  averageMonthlySpending: number;
  averageMonthlySavings: number;
  largestCategory: {
    category: CategoryName;
    amount: number;
    percentage: number;
  };
  expenseSplit: {
    essential: number;
    essentialPercentage: number;
    discretionary: number;
    discretionaryPercentage: number;
  };
  categories: SpendingCategory[];
  validation: {
    isIncomeExpenseBalanced: boolean;
    isCategoriesSumMatchingTotal: boolean;
    calculatedNetSavings: number;
  };
}

export interface FinancialHealthFactorBreakdown {
  savingConsistency: number; // 0-100
  spendingControl: number;    // 0-100
  cashFlowStability: number;  // 0-100
  goalProgress: number;       // 0-100
}

export interface FinancialHealth {
  score: number; // 0-100
  status: 'Optimal' | 'Very Good' | 'Good' | 'Needs Attention';
  percentile: number;
  factors: FinancialHealthFactorBreakdown;
  explanation: string;
}

export type FinancialHealthMetrics = FinancialHealth; // Alias for backward compatibility

export interface CashFlowPoint {
  day: number;
  dateLabel: string;
  projectedBalance: number;
  expectedIncome: number;
  expectedExpense: number;
  expectedOutflows?: number;
  isPressureZone?: boolean;
  notes?: string;
}

export interface CashFlowForecast {
  period: string; // e.g. "Oct 1 - Oct 31, 2024"
  startingBalance: number;
  projectedMonthEnd: number;
  upcomingBills: number;
  expectedInflows: number;
  riskLevel: 'Low' | 'Moderate' | 'High';
  pressureDays: number[];
  forecastCurve: CashFlowPoint[];
  aiAdvice: string;
  recommendedBuffer: number;
}

export interface FinancialInsight {
  id: string;
  type:
    | 'spending_increase'
    | 'spending_decrease'
    | 'unusual_transaction'
    | 'recurring_pattern'
    | 'savings_gap'
    | 'fee_leak';
  category?: CategoryName;
  changePercent?: number;
  impactAmount?: number;
  explanation: string;
  severity: 'low' | 'medium' | 'high';
  actionRecommendations: Array<{
    step: number;
    actionText: string;
    estimatedSavings?: number;
  }>;
  confidence: number;
  date: string;
}

export interface ScenarioPlan {
  planId: 'planA' | 'planB' | 'planC';
  name: string;
  monthlyAmount: number;
  durationMonths: number;
  targetCompletionDate: string;
  badge: string;
  adjustmentNote: string;
  isRecommended?: boolean;
}

export interface GoalCalculationResult {
  goalId: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  remainingAmount: number;
  progressPercentage: number;
  deadline: string;
  remainingMonths: number;
  requiredMonthlySavings: number;
  currentAverageMonthlySaving: number;
  monthlySavingsGap: number;
  projectedCompletionDate: string;
  scenarioPlans: ScenarioPlan[];
}

export interface AIRecommendation {
  category: string;
  currentMonthly: number;
  potentialSavings: number;
  why: string;
  actionLabel: string;
  badge: string;
  icon: string;
}

export interface CoachMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  isBangla?: boolean;
  isDeterministic?: boolean;
  source?: 'ai' | 'fallback';
  factsUsed?: string[];
  followUps?: string[];
  dataGaps?: string[];
  dataWindow?: {
    currentMonth: string;
    today: string;
    hasData: boolean;
  };
  structuredData?: {
    targetVelocity?: {
      current: number;
      needed: number;
      percentage: number;
      shortfall: number;
    };
    recommendations?: AIRecommendation[];
    simulation?: {
      target: number;
      currentMonths: number;
      optimizedMonths: number;
      currentEstDate: string;
      optimizedEstDate: string;
    };
    scenarioPlans?: ScenarioPlan[];
  };
}
