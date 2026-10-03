import { Transaction, SavingsGoal } from '../types/financial';
import { INITIAL_TRANSACTIONS } from '../data/mockTransactions';
import { INITIAL_SAVINGS_GOALS } from '../data/mockGoals';
import { apiService } from './apiService';

const PREFIX = 'finmate_v2';

function getTxKey(userId: string): string {
  return `${PREFIX}_${userId}_transactions`;
}

function getGoalsKey(userId: string): string {
  return `${PREFIX}_${userId}_goals`;
}

/**
 * Creates starter goals for a freshly registered user
 */
function createStarterGoals(): SavingsGoal[] {
  return [
    {
      id: `goal-emergency-${Date.now()}`,
      title: 'Emergency Fund',
      category: 'Core Liquidity Buffer',
      icon: '🛡️',
      targetAmount: 30000,
      currentAmount: 5000,
      deadline: '2025-06-30',
      monthlyPace: 3500,
      accountVault: 'bKash Liquid Vault',
      status: 'On Track',
      color: '#006c49',
      notes: 'Initial emergency buffer',
      milestones: [
        { amount: 10000, hit: false, label: '৳10k Next' },
        { amount: 20000, hit: false, label: '৳20k Target' },
      ],
    },
  ];
}

/**
 * Creates starter transactions for a freshly registered user
 */
function createStarterTransactions(): Transaction[] {
  const today = new Date().toISOString().split('T')[0];
  return [
    {
      id: `tx-starter-in-01`,
      date: today,
      type: 'income',
      category: 'Salary & Inflow',
      amount: 35000,
      description: 'Monthly Inflow / Salary',
      merchant: 'Company Direct Credit',
      account: 'City Bank',
      paymentMethod: 'BEFTN Transfer',
      classification: 'essential',
      location: 'Dhaka',
      isRecurring: true,
    },
    {
      id: `tx-starter-ex-01`,
      date: today,
      type: 'expense',
      category: 'Food & Groceries',
      amount: 4500,
      description: 'Weekly Essentials & Groceries',
      merchant: 'Shwapno Superstore',
      account: 'bKash',
      paymentMethod: 'bKash QR Direct',
      classification: 'essential',
      location: 'Dhaka',
    },
    {
      id: `tx-starter-ex-02`,
      date: today,
      type: 'expense',
      category: 'Utility & Fixed Costs',
      amount: 3200,
      description: 'Broadband & Electric Utility',
      merchant: 'DESCO & AmberIT',
      account: 'bKash',
      paymentMethod: 'bKash Pay Bill',
      classification: 'essential',
      location: 'Dhaka',
      isRecurring: true,
    },
  ];
}

export const financialDataService = {
  /**
   * Retrieve user-scoped transactions
   */
  getTransactions(userId: string): Transaction[] {
    if (!userId) return [];
    try {
      const key = getTxKey(userId);
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw);

      // If demo user Ahmed Rahman, initialize with full synthetic dataset
      if (userId === 'usr-ahmed-01') {
        localStorage.setItem(key, JSON.stringify(INITIAL_TRANSACTIONS));
        return INITIAL_TRANSACTIONS;
      }

      // If new registered user, provide isolated starter transactions
      const starter = createStarterTransactions();
      localStorage.setItem(key, JSON.stringify(starter));
      return starter;
    } catch (err) {
      console.error(`Failed reading transactions for user ${userId}:`, err);
      return userId === 'usr-ahmed-01' ? INITIAL_TRANSACTIONS : [];
    }
  },

  /**
   * Save user-scoped transactions
   */
  saveTransactions(userId: string, transactions: Transaction[]): void {
    if (!userId) return;
    try {
      const key = getTxKey(userId);
      localStorage.setItem(key, JSON.stringify(transactions));
    } catch (err) {
      console.error(`Failed saving transactions for user ${userId}:`, err);
    }
  },

  /**
   * Retrieve user-scoped savings goals
   */
  getGoals(userId: string): SavingsGoal[] {
    if (!userId) return [];
    try {
      const key = getGoalsKey(userId);
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw);

      // If demo user Ahmed Rahman, initialize with full synthetic goals
      if (userId === 'usr-ahmed-01') {
        localStorage.setItem(key, JSON.stringify(INITIAL_SAVINGS_GOALS));
        return INITIAL_SAVINGS_GOALS;
      }

      // If new user, provide starter goals
      const starter = createStarterGoals();
      localStorage.setItem(key, JSON.stringify(starter));
      return starter;
    } catch (err) {
      console.error(`Failed reading goals for user ${userId}:`, err);
      return userId === 'usr-ahmed-01' ? INITIAL_SAVINGS_GOALS : [];
    }
  },

  /**
   * Save user-scoped savings goals
   */
  saveGoals(userId: string, goals: SavingsGoal[]): void {
    if (!userId) return;
    try {
      const key = getGoalsKey(userId);
      localStorage.setItem(key, JSON.stringify(goals));
    } catch (err) {
      console.error(`Failed saving goals for user ${userId}:`, err);
    }
  },

  /**
   * Reset data for a specific user only
   */
  resetUserData(userId: string): void {
    if (!userId) return;
    try {
      localStorage.removeItem(getTxKey(userId));
      localStorage.removeItem(getGoalsKey(userId));
    } catch (err) {
      console.error(`Failed resetting data for user ${userId}:`, err);
    }
  },

  /**
   * Fetch latest transactions from MongoDB backend and sync to local cache
   */
  async syncTransactionsFromBackend(userId: string): Promise<Transaction[] | null> {
    if (!userId) return null;
    try {
      const remote = await apiService.getTransactions(userId);
      if (remote && Array.isArray(remote) && remote.length > 0) {
        this.saveTransactions(userId, remote);
        return remote;
      }
    } catch (err) {
      console.warn('[financialDataService] Backend transactions sync skipped:', err);
    }
    return null;
  },

  /**
   * Fetch latest goals from MongoDB backend and sync to local cache
   */
  async syncGoalsFromBackend(userId: string): Promise<SavingsGoal[] | null> {
    if (!userId) return null;
    try {
      const remote = await apiService.getGoals(userId);
      if (remote && Array.isArray(remote) && remote.length > 0) {
        this.saveGoals(userId, remote);
        return remote;
      }
    } catch (err) {
      console.warn('[financialDataService] Backend goals sync skipped:', err);
    }
    return null;
  },
};
