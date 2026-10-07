import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateFinancialHealthScore,
  DEFAULT_FINANCIAL_HEALTH_CONFIG,
  interpolatePiecewiseLinear,
} from '../../src/services/financialCalculations';
import {
  generateDeterministicHealthExplanation,
  generateHealthContextHash,
} from '../services/healthScoreService';
import { Transaction, SavingsGoal } from '../../src/types/financial';

test('Financial Health Score High-Value Test Suite', async (t) => {
  // Base test data fixtures
  const baseTxs: Transaction[] = [
    {
      id: 'tx-1',
      userId: 'user-healthy',
      type: 'income',
      amount: 50000,
      category: 'Salary & Inflow',
      description: 'Monthly Salary',
      date: '2026-10-01',
      merchant: 'Employer',
      account: 'City Bank',
      paymentMethod: 'Bank Transfer',
      classification: 'essential',
    },
    {
      id: 'tx-2',
      userId: 'user-healthy',
      type: 'expense',
      amount: 15000,
      category: 'Utility & Fixed Costs',
      description: 'Apartment Rent',
      date: '2026-10-02',
      merchant: 'Landlord',
      account: 'City Bank',
      paymentMethod: 'Bank Transfer',
      classification: 'essential',
    },
    {
      id: 'tx-3',
      userId: 'user-healthy',
      type: 'expense',
      amount: 10000,
      category: 'Food & Groceries',
      description: 'Grocery Shopping',
      date: '2026-10-03',
      merchant: 'Shwapno',
      account: 'bKash',
      paymentMethod: 'Direct Payment',
      classification: 'essential',
    },
    // Past months to satisfy 3-month stability
    {
      id: 'tx-inc-prev1',
      userId: 'user-healthy',
      type: 'income',
      amount: 50000,
      category: 'Salary & Inflow',
      description: 'Monthly Salary Sept',
      date: '2026-09-01',
      merchant: 'Employer',
      account: 'City Bank',
      paymentMethod: 'Bank Transfer',
      classification: 'essential',
    },
    {
      id: 'tx-prev1',
      userId: 'user-healthy',
      type: 'expense',
      amount: 24000,
      category: 'Utility & Fixed Costs',
      description: 'Prev month rent',
      date: '2026-09-02',
      merchant: 'Landlord',
      account: 'City Bank',
      paymentMethod: 'Bank Transfer',
      classification: 'essential',
    },
    {
      id: 'tx-inc-prev2',
      userId: 'user-healthy',
      type: 'income',
      amount: 50000,
      category: 'Salary & Inflow',
      description: 'Monthly Salary Aug',
      date: '2026-08-01',
      merchant: 'Employer',
      account: 'City Bank',
      paymentMethod: 'Bank Transfer',
      classification: 'essential',
    },
    {
      id: 'tx-prev2',
      userId: 'user-healthy',
      type: 'expense',
      amount: 26000,
      category: 'Utility & Fixed Costs',
      description: '2 months ago rent',
      date: '2026-08-02',
      merchant: 'Landlord',
      account: 'City Bank',
      paymentMethod: 'Bank Transfer',
      classification: 'essential',
    },
  ];

  const baseGoals: SavingsGoal[] = [
    {
      id: 'goal-emg',
      userId: 'user-healthy',
      title: 'Emergency Fund',
      name: 'Emergency Fund',
      category: 'Emergency Fund',
      targetAmount: 100000,
      currentAmount: 80000,
      deadline: '2026-12-31',
      monthlyPace: 5000,
      icon: '🎯',
      accountVault: 'bKash',
      status: 'On Track',
    },
    {
      id: 'goal-laptop',
      userId: 'user-healthy',
      title: 'New Laptop',
      name: 'New Laptop',
      category: 'General Savings',
      targetAmount: 50000,
      currentAmount: 35000,
      deadline: '2026-12-31',
      monthlyPace: 3000,
      icon: '💻',
      accountVault: 'City Bank',
      status: 'On Track',
    },
  ];

  // Test 1: Healthy profile -> correct score/category
  await t.test('1. Healthy profile produces strong score in Good or Excellent band', () => {
    const res = calculateFinancialHealthScore({
      transactions: baseTxs,
      goals: baseGoals,
      monthlyIncome: 50000,
      asOfDate: '2026-10-05',
    });

    assert.equal(res.status, 'ok');
    assert(res.score !== null && res.score >= 70, `Expected score >= 70, got ${res.score}`);
    assert(
      res.category === 'Good' || res.category === 'Excellent',
      `Expected Good or Excellent, got ${res.category}`
    );
    assert.equal(res.confidence, 'high');
  });

  // Test 2: Increase expenses -> Expense Control decreases and final score decreases
  await t.test('2. Increasing expenses lowers Expense Control score and overall score', () => {
    const baseline = calculateFinancialHealthScore({
      transactions: baseTxs,
      goals: baseGoals,
      monthlyIncome: 50000,
      asOfDate: '2026-10-05',
    });

    const highExpenseTxs: Transaction[] = [
      ...baseTxs,
      {
        id: 'tx-surge',
        userId: 'user-healthy',
        type: 'expense',
        amount: 20000,
        category: 'Shopping & Gadgets',
        description: 'Luxury Watch',
        date: '2026-10-04',
        merchant: 'Gadget Store',
        account: 'bKash',
        paymentMethod: 'Direct Payment',
        classification: 'discretionary',
      },
    ];

    const afterSurge = calculateFinancialHealthScore({
      transactions: highExpenseTxs,
      goals: baseGoals,
      monthlyIncome: 50000,
      asOfDate: '2026-10-05',
    });

    const baseExpComp = baseline.components.find((c) => c.key === 'expense_control')!;
    const surgeExpComp = afterSurge.components.find((c) => c.key === 'expense_control')!;

    assert(
      surgeExpComp.score! < baseExpComp.score!,
      `Expected surgeExpComp (${surgeExpComp.score}) < baseExpComp (${baseExpComp.score})`
    );
    assert(
      afterSurge.score! < baseline.score!,
      `Expected afterSurge score (${afterSurge.score}) < baseline (${baseline.score})`
    );
  });

  // Test 3: Negative cash flow -> Cash-Flow Health decreases
  await t.test('3. Negative cash flow significantly reduces Cash-Flow Health component', () => {
    const normal = calculateFinancialHealthScore({
      transactions: baseTxs,
      goals: baseGoals,
      monthlyIncome: 50000,
      startingBalance: 30000,
      asOfDate: '2026-10-05',
    });

    const starved = calculateFinancialHealthScore({
      transactions: [
        ...baseTxs,
        {
          id: 'tx-drain',
          userId: 'user-healthy',
          type: 'expense',
          amount: 60000,
          category: 'Shopping & Gadgets',
          description: 'Emergency payment',
          date: '2026-10-04',
          merchant: 'Vendor',
          account: 'bKash',
          paymentMethod: 'Direct Payment',
          classification: 'discretionary',
        },
      ],
      goals: baseGoals,
      monthlyIncome: 50000,
      startingBalance: 500, // Very low starting liquidity
      asOfDate: '2026-10-05',
    });

    const normalCash = normal.components.find((c) => c.key === 'cash_flow_health')!;
    const starvedCash = starved.components.find((c) => c.key === 'cash_flow_health')!;

    assert(
      starvedCash.score! < normalCash.score!,
      `Expected starvedCash (${starvedCash.score}) < normalCash (${normalCash.score})`
    );
  });

  // Test 4: Increase goal progress -> Savings Goals score increases
  await t.test('4. Increased goal funding directly boosts Savings Goals component', () => {
    const lowGoal: SavingsGoal[] = [
      {
        id: 'goal-1',
        userId: 'u',
        title: 'Emergency Fund',
        name: 'Emergency Fund',
        category: 'Emergency Fund',
        targetAmount: 100000,
        currentAmount: 10000, // 10%
        deadline: '2026-12-31',
        monthlyPace: 5000,
        icon: '🎯',
        accountVault: 'bKash',
        status: 'On Track',
      },
    ];

    const highGoal: SavingsGoal[] = [
      {
        id: 'goal-1',
        userId: 'u',
        title: 'Emergency Fund',
        name: 'Emergency Fund',
        category: 'Emergency Fund',
        targetAmount: 100000,
        currentAmount: 90000, // 90%
        deadline: '2026-12-31',
        monthlyPace: 5000,
        icon: '🎯',
        accountVault: 'bKash',
        status: 'On Track',
      },
    ];

    const resLow = calculateFinancialHealthScore({
      transactions: baseTxs,
      goals: lowGoal,
      monthlyIncome: 50000,
      asOfDate: '2026-10-05',
    });

    const resHigh = calculateFinancialHealthScore({
      transactions: baseTxs,
      goals: highGoal,
      monthlyIncome: 50000,
      asOfDate: '2026-10-05',
    });

    const goalScoreLow = resLow.components.find((c) => c.key === 'savings_goals')!.score!;
    const goalScoreHigh = resHigh.components.find((c) => c.key === 'savings_goals')!.score!;

    assert(
      goalScoreHigh > goalScoreLow,
      `Expected goalScoreHigh (${goalScoreHigh}) > goalScoreLow (${goalScoreLow})`
    );
  });

  // Test 5: Zero income -> income-dependent components unavailable
  await t.test('5. Zero income marks Savings Rate and Expense Control as unavailable', () => {
    const zeroIncomeTxs: Transaction[] = [
      {
        id: 'tx-exp-only',
        userId: 'u-zero',
        type: 'expense',
        amount: 5000,
        category: 'Food & Groceries',
        description: 'Snacks',
        date: '2026-10-02',
        merchant: 'Store',
        account: 'bKash',
        paymentMethod: 'Direct Payment',
        classification: 'essential',
      },
    ];

    const res = calculateFinancialHealthScore({
      transactions: zeroIncomeTxs,
      goals: baseGoals,
      monthlyIncome: 0,
      asOfDate: '2026-10-05',
    });

    const savingsRateComp = res.components.find((c) => c.key === 'savings_rate')!;
    const expenseControlComp = res.components.find((c) => c.key === 'expense_control')!;

    assert.equal(savingsRateComp.available, false);
    assert.equal(savingsRateComp.score, null);
    assert.equal(savingsRateComp.status, 'zero_income');

    assert.equal(expenseControlComp.available, false);
    assert.equal(expenseControlComp.score, null);
    assert.equal(expenseControlComp.status, 'zero_income');
  });

  // Test 6: Missing emergency fund/goals -> components unavailable
  await t.test('6. Missing emergency fund or goals sets components to unavailable', () => {
    const resNoGoals = calculateFinancialHealthScore({
      transactions: baseTxs,
      goals: [], // No goals
      monthlyIncome: 50000,
      asOfDate: '2026-10-05',
    });

    const emgComp = resNoGoals.components.find((c) => c.key === 'emergency_fund')!;
    const goalComp = resNoGoals.components.find((c) => c.key === 'savings_goals')!;

    assert.equal(emgComp.available, false);
    assert.equal(emgComp.score, null);
    assert.equal(goalComp.available, false);
    assert.equal(goalComp.score, null);
  });

  // Test 7: Only one component available (<0.50 weight) -> insufficient_data
  await t.test('7. Available weight < 0.50 triggers insufficient_data status', () => {
    // Only cash_flow_health available (10% weight)
    const res = calculateFinancialHealthScore({
      transactions: [],
      goals: [],
      monthlyIncome: 0,
      startingBalance: 1000,
    });

    assert.equal(res.status, 'insufficient_data');
    assert.equal(res.score, null);
    assert.equal(res.category, null);
    assert.equal(res.confidence, 'low');
  });

  // Test 8: Same input twice -> identical result (pure & deterministic)
  await t.test('8. Same input produces 100% identical outputs (purity check)', () => {
    const run1 = calculateFinancialHealthScore({
      transactions: baseTxs,
      goals: baseGoals,
      monthlyIncome: 50000,
      asOfDate: '2026-10-05',
    });

    const run2 = calculateFinancialHealthScore({
      transactions: baseTxs,
      goals: baseGoals,
      monthlyIncome: 50000,
      asOfDate: '2026-10-05',
    });

    assert.deepEqual(run1, run2);
    assert.equal(generateHealthContextHash(run1), generateHealthContextHash(run2));
  });

  // Test 9: Piecewise linear interpolation continuity (no cliffs)
  await t.test('9. Piecewise linear interpolation yields smooth continuous shifts', () => {
    const score1 = interpolatePiecewiseLinear(0.19, DEFAULT_FINANCIAL_HEALTH_CONFIG.anchors.savingsRate);
    const score2 = interpolatePiecewiseLinear(0.20, DEFAULT_FINANCIAL_HEALTH_CONFIG.anchors.savingsRate);
    const score3 = interpolatePiecewiseLinear(0.21, DEFAULT_FINANCIAL_HEALTH_CONFIG.anchors.savingsRate);

    assert(score1 <= score2 && score2 <= score3);
    assert.equal(score2, 80); // exact anchor
  });

  // Test 10: Deterministic fallback explanation works in EN & BN
  await t.test('10. Deterministic fallback produces rich structured explanation in EN & BN', () => {
    const health = calculateFinancialHealthScore({
      transactions: baseTxs,
      goals: baseGoals,
      monthlyIncome: 50000,
      asOfDate: '2026-10-05',
    });

    const hash = generateHealthContextHash(health);
    const explEn = generateDeterministicHealthExplanation(health, 'en', hash);
    const explBn = generateDeterministicHealthExplanation(health, 'bn', hash);

    assert.equal(explEn.source, 'fallback');
    assert.equal(explBn.source, 'fallback');
    assert(explEn.summary.includes(String(health.score)));
    assert(explBn.summary.includes(String(health.score)));
    assert(explEn.strengths.length > 0);
    assert(explBn.strengths.length > 0);
    assert(explEn.suggestions.length > 0);
    assert(explBn.suggestions.length > 0);
  });
});
