import { Transaction, SavingsGoal, UserProfile } from '../types/financial';
import { INITIAL_USER } from '../data/mockUser';
import { INITIAL_SAVINGS_GOALS } from '../data/mockGoals';
import { INITIAL_TRANSACTIONS } from '../data/mockTransactions';

export { INITIAL_USER, INITIAL_SAVINGS_GOALS, INITIAL_TRANSACTIONS };

export function getSavedTransactions(): Transaction[] {
  try {
    const raw =
      localStorage.getItem('arthobachao_transactions') ||
      localStorage.getItem('finmate_transactions');
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed reading transactions from localStorage', e);
  }
  return INITIAL_TRANSACTIONS;
}

export function saveTransactions(transactions: Transaction[]): void {
  try {
    localStorage.setItem('arthobachao_transactions', JSON.stringify(transactions));
  } catch (e) {
    console.error('Failed saving transactions to localStorage', e);
  }
}

export function getSavedGoals(): SavingsGoal[] {
  try {
    const raw =
      localStorage.getItem('arthobachao_goals') ||
      localStorage.getItem('finmate_goals');
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed reading goals from localStorage', e);
  }
  return INITIAL_SAVINGS_GOALS;
}

export function saveGoals(goals: SavingsGoal[]): void {
  try {
    localStorage.setItem('arthobachao_goals', JSON.stringify(goals));
  } catch (e) {
    console.error('Failed saving goals to localStorage', e);
  }
}

export function getSavedUser(): UserProfile {
  try {
    const raw =
      localStorage.getItem('arthobachao_user') ||
      localStorage.getItem('finmate_user');
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed reading user from localStorage', e);
  }
  return INITIAL_USER;
}

export function saveUser(user: UserProfile): void {
  try {
    localStorage.setItem('arthobachao_user', JSON.stringify(user));
  } catch (e) {
    console.error('Failed saving user to localStorage', e);
  }
}

export function resetDemoData(): void {
  try {
    localStorage.removeItem('arthobachao_transactions');
    localStorage.removeItem('arthobachao_goals');
    localStorage.removeItem('arthobachao_user');
    localStorage.removeItem('finmate_transactions');
    localStorage.removeItem('finmate_goals');
    localStorage.removeItem('finmate_user');
  } catch (e) {
    console.error('Failed resetting demo data', e);
  }
}
