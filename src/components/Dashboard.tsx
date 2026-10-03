import React, { useState } from 'react';
import { Transaction, SavingsGoal, UserProfile } from '../types/financial';
import {
  calculateMonthlyOverview,
  calculateFinancialHealthScore,
  formatBDT,
  getLatestTransactionMonth,
} from '../services/financialCalculations';
import { NavScreen } from './Sidebar';

interface DashboardProps {
  transactions: Transaction[];
  goals: SavingsGoal[];
  user: UserProfile;
  onNavigate: (screen: NavScreen) => void;
  onOpenAddTransaction: () => void;
  onOpenTransfer: () => void;
  onOpenMonthlyReport: () => void;
  onOpenCreateGoal: () => void;
  isBangla: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({
  transactions,
  goals,
  user,
  onNavigate,
  onOpenAddTransaction,
  onOpenTransfer,
  onOpenMonthlyReport,
  onOpenCreateGoal,
  isBangla,
}) => {
  const [isSimulated, setIsSimulated] = useState(false);
  const [budgetApplied, setBudgetApplied] = useState(false);
  const [bufferLocked, setBufferLocked] = useState(false);

  // Dynamic calculations based on live synthetic state
  const activeMonth = getLatestTransactionMonth(transactions);
  const overview = calculateMonthlyOverview(transactions, activeMonth);
  const healthMetrics = calculateFinancialHealthScore(transactions, goals, user.monthlyIncome, activeMonth);

  // Total balance sum
  const totalBalance = user.linkedAccounts.reduce((acc, a) => acc + a.balance, 0);

  // Primary goal (Hero)
  const heroGoal = goals[0];
  const heroProgress = heroGoal && heroGoal.targetAmount > 0
    ? Math.min(100, (heroGoal.currentAmount / heroGoal.targetAmount) * 100)
    : 0;

  // Secondary goal
  const subGoal = goals[1];
  const subProgress = subGoal && subGoal.targetAmount > 0
    ? Math.min(100, (subGoal.currentAmount / subGoal.targetAmount) * 100)
    : 0;

  const firstName = user?.name ? user.name.split(' ')[0] : 'Ahmed';

  // Handle Apply Suggested Budget
  const handleApplyBudget = () => {
    setBudgetApplied(true);
    setTimeout(() => {
      // Keep feedback active
    }, 4000);
  };

  return (
    <div className="flex flex-col w-full gap-space-lg pb-space-xl">
      {/* Welcome Header Strip */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
        <div className="flex flex-col">
          <div className="flex items-center gap-space-xs">
            <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-bold">
              {isBangla ? `শুভ সকাল, ${firstName}` : `Good morning, ${firstName} 👋`}
            </h1>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1 flex items-center gap-2">
            <span>
              {isBangla
                ? 'চলতি মাসে আপনার আর্থিক অবস্থার সামগ্রিক বিবরণ'
                : "Here's how your money is doing this month"}
            </span>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-outline-variant"></span>
            <span className="text-on-surface-variant/80">Updated today at 09:42 AM</span>
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-space-sm">
          <button
            onClick={onOpenAddTransaction}
            className="flex items-center gap-2 px-space-md py-2.5 rounded-xl bg-primary text-on-primary font-title-md text-title-md shadow-sm hover:opacity-95 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[20px] text-secondary-container">
              add_circle
            </span>
            <span>{isBangla ? '+ লেনদেন যুক্ত করুন' : 'Add Transaction'}</span>
          </button>
          <button
            onClick={onOpenTransfer}
            className="flex items-center gap-2 px-space-md py-2.5 rounded-xl bg-surface-container-lowest text-on-surface font-title-md text-title-md shadow-sm hover:bg-surface-container-low active:scale-95 transition-all border border-outline-variant/30"
          >
            <span className="material-symbols-outlined text-[20px] text-secondary">sync_alt</span>
            <span>{isBangla ? 'স্থানান্তর' : 'Transfer'}</span>
          </button>
          <button
            onClick={onOpenMonthlyReport}
            className="flex items-center gap-2 px-space-md py-2.5 rounded-xl bg-surface-container-lowest text-on-surface-variant font-title-md text-title-md shadow-sm hover:text-on-surface hover:bg-surface-container-low transition-all border border-outline-variant/30"
          >
            <span className="material-symbols-outlined text-[20px]">download</span>
            <span>{isBangla ? 'মাসিক রিপোর্ট (PDF)' : 'Monthly Report (PDF)'}</span>
          </button>
        </div>
      </div>

      {/* 4-Column KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-space-md">
        {/* KPI 1: Available Balance */}
        <div className="relative overflow-hidden rounded-xl bg-surface-container-lowest p-space-md shadow-sm flex flex-col justify-between group hover:shadow-md transition-shadow border border-outline-variant/20">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">
                Available Balance
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="font-headline-lg text-headline-lg text-on-surface font-bold">
                  {formatBDT(totalBalance)}
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-secondary-container/40 flex items-center justify-center text-on-secondary-container">
              <span className="material-symbols-outlined text-[22px]">account_balance_wallet</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-outline-variant/15 flex flex-col gap-2">
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold">
                <span className="material-symbols-outlined text-[14px]">trending_up</span>
                +৳4,200 this week
              </span>
            </div>
            {/* Linked MFS & Bank badges */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {user.linkedAccounts.map((acc) => (
                <span
                  key={acc.name}
                  className="px-2 py-0.5 rounded-md bg-surface-container-low text-on-surface-variant font-label-sm text-[10px] font-semibold"
                >
                  {acc.name} ({formatBDT(acc.balance)})
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* KPI 2: Total Income */}
        <div className="relative overflow-hidden rounded-xl bg-surface-container-lowest p-space-md shadow-sm flex flex-col justify-between group hover:shadow-md transition-shadow border border-outline-variant/20">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">
                Total Income (OCT)
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="font-headline-lg text-headline-lg text-on-surface font-bold">
                  {formatBDT(overview.totalIncome)}
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-on-surface">
              <span className="material-symbols-outlined text-[22px]">payments</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-outline-variant/15 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                Primary Salary + Freelance
              </span>
              <div className="flex items-center gap-1 text-secondary mt-0.5 font-label-sm text-label-sm font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                100% Deposited on time
              </div>
            </div>
          </div>
        </div>

        {/* KPI 3: Total Spending */}
        <div className="relative overflow-hidden rounded-xl bg-surface-container-lowest p-space-md shadow-sm flex flex-col justify-between group hover:shadow-md transition-shadow border border-outline-variant/20">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">
                Total Spending
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="font-headline-lg text-headline-lg text-on-surface font-bold">
                  {formatBDT(overview.totalExpenses)}
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-error-container/60 flex items-center justify-center text-on-error-container">
              <span className="material-symbols-outlined text-[22px]">shopping_bag</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-outline-variant/15 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-error-container text-on-error-container font-label-sm text-label-sm font-semibold">
                <span className="material-symbols-outlined text-[14px]">arrow_upward</span>
                8% higher
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">vs last month</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Total Saved */}
        <div className="relative overflow-hidden rounded-xl bg-surface-container-lowest p-space-md shadow-sm flex flex-col justify-between group hover:shadow-md transition-shadow border border-outline-variant/20">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">
                Total Saved
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="font-headline-lg text-headline-lg text-secondary font-bold">
                  {formatBDT(overview.netSavings)}
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-secondary-container/50 flex items-center justify-center text-on-secondary-container">
              <span className="material-symbols-outlined text-[22px]">savings</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-outline-variant/15 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold">
                <span className="material-symbols-outlined text-[14px]">check_circle</span>
                {overview.savingsRate}% savings rate
              </span>
            </div>
            <span className="font-body-sm text-body-sm text-on-surface-variant">Target: 20%</span>
          </div>
        </div>
      </div>

      {/* Bento Grid Row 1: Health Score (4 cols) & AI Spotlight (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-md">
        {/* Module 1: Financial Health Score (Span 4) */}
        <div className="lg:col-span-4 rounded-xl bg-surface-container-lowest p-space-md flex flex-col justify-between shadow-sm relative overflow-hidden border border-outline-variant/20">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[22px]">vital_signs</span>
                <h2 className="font-title-lg text-title-lg text-on-surface font-bold">
                  ArthoBachao AI Financial Health Score
                </h2>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold">
                {healthMetrics.status}
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
              Real-time composite diagnosis (Transparent Prototype Score)
            </p>

            {/* Radial Gauge Container */}
            <div className="flex flex-col items-center justify-center my-4 relative">
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                  <circle
                    cx="60"
                    cy="60"
                    fill="transparent"
                    r="48"
                    stroke="#eff4ff"
                    strokeWidth="10"
                  />
                  <circle
                    className="transition-all duration-1000"
                    cx="60"
                    cy="60"
                    fill="transparent"
                    r="48"
                    stroke="#006c49"
                    strokeDasharray={`${(healthMetrics.score / 100) * 301.6} 301.6`}
                    strokeLinecap="round"
                    strokeWidth="10"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="font-headline-xl text-headline-xl text-on-surface leading-none font-bold">
                    {healthMetrics.score}
                  </span>
                  <span className="font-label-sm text-label-sm text-outline mt-0.5 uppercase tracking-wider">
                    / 100
                  </span>
                </div>
              </div>
              <p className="font-body-sm text-body-sm text-center text-on-surface-variant max-w-[220px] mt-2">
                Consistently outperforming{' '}
                <span className="font-semibold text-secondary">{healthMetrics.percentile}%</span> of peers in
                Dhaka
              </p>
            </div>

            {/* 4 Sub-metrics Breakdown */}
            <div className="flex flex-col gap-2.5 mt-2">
              <div>
                <div className="flex justify-between font-label-sm text-label-sm mb-1">
                  <span className="text-on-surface-variant">Saving Consistency</span>
                  <span className="font-semibold text-on-surface">
                    {healthMetrics.factors.savingConsistency}%
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-surface-container-low overflow-hidden">
                  <div
                    className="h-full bg-secondary rounded-full transition-all duration-500"
                    style={{ width: `${healthMetrics.factors.savingConsistency}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between font-label-sm text-label-sm mb-1">
                  <span className="text-on-surface-variant">Spending Control</span>
                  <span className="font-semibold text-on-surface">
                    {healthMetrics.factors.spendingControl}%
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-surface-container-low overflow-hidden">
                  <div
                    className="h-full bg-secondary-fixed-dim rounded-full transition-all duration-500"
                    style={{ width: `${healthMetrics.factors.spendingControl}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between font-label-sm text-label-sm mb-1">
                  <span className="text-on-surface-variant">Cash Flow Stability</span>
                  <span className="font-semibold text-on-surface">
                    {healthMetrics.factors.cashFlowStability}%
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-surface-container-low overflow-hidden">
                  <div
                    className="h-full bg-secondary rounded-full transition-all duration-500"
                    style={{ width: `${healthMetrics.factors.cashFlowStability}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between font-label-sm text-label-sm mb-1">
                  <span className="text-on-surface-variant">Goal Progress</span>
                  <span className="font-semibold text-on-surface">
                    {healthMetrics.factors.goalProgress}%
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-surface-container-low overflow-hidden">
                  <div
                    className="h-full bg-secondary rounded-full transition-all duration-500"
                    style={{ width: `${healthMetrics.factors.goalProgress}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('financial-health')}
            className="mt-4 pt-3 flex items-center justify-between text-secondary hover:text-on-secondary-fixed-variant transition-colors font-title-md text-title-md border-t border-outline-variant/15 text-left"
          >
            <span>View Health Breakdown</span>
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </div>

        {/* Module 2: AI Financial Insight Spotlight (Span 8) */}
        <div className="lg:col-span-8 rounded-xl bg-surface-container-lowest p-space-md shadow-sm relative overflow-hidden flex flex-col justify-between border border-outline-variant/20">
          <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-gradient-to-br from-tertiary-fixed-dim/20 to-secondary-container/20 blur-3xl pointer-events-none"></div>

          <div>
            {/* AI Top Bar */}
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/15">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-tertiary-container text-tertiary-fixed flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm font-semibold text-on-surface uppercase tracking-wider">
                    ArthoBachao AI Intelligence
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    Personalized Algorithmic Insight • Gulshan &amp; Banani Zone
                  </span>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface font-label-sm text-label-sm font-medium flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                High Impact
              </span>
            </div>

            {/* Highlight Content Box */}
            <div className="mt-3 p-space-md rounded-xl bg-surface-container-low/70 backdrop-blur-sm border border-outline-variant/20">
              <p className="font-body-lg text-body-lg text-on-surface leading-relaxed">
                You are saving consistently, but your weekend dining and coffee spending has
                increased by <span className="font-semibold text-error">18%</span>. Reducing
                discretionary food spend by about{' '}
                <strong className="font-bold text-on-surface">৳900 per week</strong> would allow you
                to reach your <span className="text-secondary font-semibold">Emergency Fund</span>{' '}
                target <span className="underline decoration-secondary font-bold">18 days earlier</span>.
              </p>

              {/* Micro context chips */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-space-sm pt-2">
                <div className="p-2.5 rounded-lg bg-surface-container-lowest shadow-sm flex flex-col border border-outline-variant/20">
                  <span className="font-label-sm text-label-sm text-outline">Observed Surge</span>
                  <span className="font-title-md text-title-md text-error mt-0.5">৳3,600 / mo</span>
                </div>
                <div className="p-2.5 rounded-lg bg-surface-container-lowest shadow-sm flex flex-col border border-outline-variant/20">
                  <span className="font-label-sm text-label-sm text-outline">Suggested Cap</span>
                  <span className="font-title-md text-title-md text-secondary mt-0.5">
                    ৳2,700 / wk
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-surface-container-lowest shadow-sm flex flex-col border border-outline-variant/20">
                  <span className="font-label-sm text-label-sm text-outline">Speedup Horizon</span>
                  <span className="font-title-md text-title-md text-on-surface mt-0.5">
                    -18 Days Goal
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Strip */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-space-sm pt-2 border-t border-outline-variant/15">
            <div className="flex items-center gap-2">
              <button
                onClick={handleApplyBudget}
                className={`flex items-center gap-2 px-space-md py-2.5 rounded-xl font-title-md text-title-md transition-all shadow-sm ${budgetApplied
                    ? 'bg-secondary text-on-secondary'
                    : 'bg-primary text-on-primary hover:bg-inverse-surface active:scale-95'
                  }`}
              >
                <span className="material-symbols-outlined text-[18px] text-secondary-container">
                  {budgetApplied ? 'check_circle' : 'tune'}
                </span>
                <span>{budgetApplied ? 'Budget Rule Active (৳2,700/wk)' : 'Apply Suggested Budget'}</span>
              </button>
              <button
                onClick={() => onNavigate('ai-coach')}
                className="flex items-center gap-2 px-space-md py-2.5 rounded-xl bg-surface-container text-on-surface font-title-md text-title-md hover:bg-surface-container-high transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">chat</span>
                <span>Ask ArthoBachao AI Details</span>
              </button>
            </div>
            <span className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px] text-secondary">verified</span>
              Verified against 4 months history
            </span>
          </div>
        </div>
      </div>

      {/* Bento Grid Row 2: Savings Goals Snapshot (6 cols) & Spending Breakdown (6 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-md">
        {/* Module 3: Savings Goals Snapshot (Span 6) */}
        <div className="lg:col-span-6 rounded-xl bg-surface-container-lowest p-space-md shadow-sm flex flex-col justify-between border border-outline-variant/20">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-secondary-container/40 text-on-secondary-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">flag</span>
                </div>
                <div>
                  <h2 className="font-title-lg text-title-lg text-on-surface font-bold">
                    Savings Goals Snapshot
                  </h2>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    {goals.length} Active Targets in Progress
                  </p>
                </div>
              </div>
              <button
                onClick={onOpenCreateGoal}
                className="w-8 h-8 rounded-full bg-surface-container-low hover:bg-surface-container flex items-center justify-center text-on-surface transition-colors"
                title="Create new goal"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
              </button>
            </div>

            {/* Primary Highlight Goal */}
            {heroGoal && (
              <div className="mt-4 p-space-md rounded-xl bg-surface-container-low/50 border border-outline-variant/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-xl">
                      {heroGoal.icon || '🎯'}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-title-md text-title-md text-on-surface font-bold">
                        {heroGoal.title}
                      </span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">
                        Target: {formatBDT(heroGoal.targetAmount)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-title-md text-title-md text-secondary font-bold">
                      {formatBDT(heroGoal.currentAmount)}
                    </span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant block">
                      {heroProgress.toFixed(1)}% completed
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-3 rounded-full bg-surface-container mt-3 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-secondary-fixed-dim to-secondary rounded-full transition-all duration-700"
                    style={{ width: `${heroProgress}%` }}
                  ></div>
                </div>

                {/* Milestone Footnote */}
                <div className="flex items-center justify-between mt-3 font-body-sm text-body-sm">
                  <div className="flex items-center gap-1.5 text-on-surface-variant">
                    <span className="material-symbols-outlined text-[16px] text-secondary">
                      alarm_on
                    </span>
                    <span>
                      Deadline: <strong>{heroGoal.deadline}</strong>
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-secondary-container/40 text-on-secondary-container font-label-sm text-label-sm font-semibold">
                    {formatBDT(Math.max(0, heroGoal.targetAmount - heroGoal.currentAmount))}{' '}
                    remaining
                  </span>
                </div>
              </div>
            )}

            {/* Secondary Goal */}
            {subGoal && (
              <div className="mt-3 p-space-md rounded-xl bg-surface-container-low/30 border border-outline-variant/15">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-surface-container-high text-on-surface flex items-center justify-center text-lg">
                      {subGoal.icon || '🎯'}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-title-md text-title-md text-on-surface font-semibold">
                        {subGoal.title}
                      </span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">
                        Target: {formatBDT(subGoal.targetAmount)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-title-md text-title-md text-on-surface font-semibold">
                      {formatBDT(subGoal.currentAmount)}
                    </span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant block">
                      {subProgress.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="w-full h-2 rounded-full bg-surface-container mt-2.5 overflow-hidden">
                  <div
                    className="h-full bg-primary-container rounded-full transition-all duration-700"
                    style={{ width: `${subProgress}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => onNavigate('savings-goals')}
            className="mt-4 pt-3 flex items-center justify-between text-secondary hover:text-on-secondary-fixed-variant transition-colors font-title-md text-title-md border-t border-outline-variant/15 text-left"
          >
            <span>Manage All Goals</span>
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </div>

        {/* Module 4: Spending by Category Donut & Breakdown (Span 6) */}
        <div className="lg:col-span-6 rounded-xl bg-surface-container-lowest p-space-md shadow-sm flex flex-col justify-between border border-outline-variant/20">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-error-container/60 text-on-error-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">pie_chart</span>
                </div>
                <div>
                  <h2 className="font-title-lg text-title-lg text-on-surface font-bold">
                    Spending by Category
                  </h2>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Total: {formatBDT(overview.totalExpenses)} this billing cycle
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-md bg-surface-container-low font-label-sm text-label-sm text-on-surface">
                This Month
              </span>
            </div>

            {/* Alert Notification for Food Spending */}
            <div className="mt-3 p-2.5 rounded-lg bg-error-container/40 flex items-center gap-2 text-on-error-container">
              <span className="material-symbols-outlined text-[18px] text-error">warning</span>
              <span className="font-body-sm text-body-sm">
                <strong>Food &amp; Dining:</strong> increased by 14% vs last month.
              </span>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-12 gap-space-md items-center">
              {/* Donut SVG (5 cols) */}
              <div className="md:col-span-5 flex items-center justify-center relative">
                <div className="w-36 h-36 relative flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    {(() => {
                      const circumference = 251.2;
                      const colors = [
                        '#ba1a1a',
                        '#006c49',
                        '#07006c',
                        '#4edea3',
                        '#d3e4fe',
                        '#c6c6cd',
                      ];
                      let currentOffset = 0;
                      return overview.categories.map((c, i) => {
                        const dash = Math.max(0.5, (c.percentage / 100) * circumference);
                        const offset = -currentOffset;
                        currentOffset += dash;
                        return (
                          <circle
                            key={c.category}
                            cx="50"
                            cy="50"
                            fill="transparent"
                            r="40"
                            stroke={colors[i % colors.length]}
                            strokeDasharray={`${dash.toFixed(1)} ${circumference}`}
                            strokeDashoffset={offset}
                            strokeWidth="12"
                            className="transition-all duration-500"
                          />
                        );
                      });
                    })()}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="font-label-sm text-[10px] text-outline uppercase tracking-wider font-semibold">
                      Total
                    </span>
                    <span className="font-title-md text-title-md text-on-surface font-bold leading-tight">
                      ৳{(overview.totalExpenses / 1000).toFixed(1)}k
                    </span>
                  </div>
                </div>
              </div>

              {/* Category Legend Breakdown (7 cols) */}
              <div className="md:col-span-7 flex flex-col gap-2">
                {overview.categories.map((c, i) => {
                  const colors = [
                    '#ba1a1a',
                    '#006c49',
                    '#07006c',
                    '#4edea3',
                    '#d3e4fe',
                    '#c6c6cd',
                  ];
                  return (
                    <div
                      key={c.category}
                      className="flex items-center justify-between text-body-sm font-body-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: colors[i % colors.length] }}
                        ></span>
                        <span className="text-on-surface truncate max-w-[130px]">
                          {c.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-on-surface">{formatBDT(c.amount)}</span>
                        <span className="text-outline text-[11px]">{c.percentage}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 flex items-center justify-between border-t border-outline-variant/15">
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              Compared to last month (৳27,050)
            </span>
            <button
              onClick={() => onNavigate('spending-analysis')}
              className="font-title-md text-title-md text-secondary hover:text-on-secondary-fixed-variant"
            >
              Detailed Category Report →
            </button>
          </div>
        </div>
      </div>

      {/* Module 5: 30-Day Cash Flow Forecast Projection (Span 12 Full Width) */}
      <div className="rounded-xl bg-surface-container-lowest p-space-md lg:p-space-lg shadow-sm flex flex-col gap-space-md border border-outline-variant/20">
        {/* Forecast Header & Toggles */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-sm pb-2 border-b border-outline-variant/15">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-on-surface">
              <span className="material-symbols-outlined text-[24px]">trending_up</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h2 className="font-title-lg text-title-lg text-on-surface font-bold">
                  30-Day Cash Flow Forecast Projection
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-[10px] font-semibold">
                  AI-assisted forecast
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Continuous predictive balance curve based on recurring commitments &amp; daily burn (Not a guaranteed prediction)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-space-sm">
            <button
              onClick={() => setIsSimulated(!isSimulated)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-title-md text-body-sm transition-all shadow-xs ${isSimulated
                  ? 'bg-secondary-container text-on-secondary-container font-bold ring-2 ring-secondary'
                  : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                }`}
            >
              <span className="material-symbols-outlined text-[16px] text-secondary">tune</span>
              <span>{isSimulated ? 'Reset Baseline' : 'Simulate Expense Cut'}</span>
            </button>
            <button
              onClick={onOpenMonthlyReport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-low text-on-surface-variant font-title-md text-body-sm hover:text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">file_upload</span>
              <span>Export Projection</span>
            </button>
          </div>
        </div>

        {/* AI Advice Banner strip inside forecast */}
        <div className="p-3.5 rounded-xl bg-surface-container-high/50 flex flex-col md:flex-row md:items-center justify-between gap-space-sm border border-outline-variant/20">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-secondary-container bg-primary-container p-1 rounded-lg text-[18px]">
              bolt
            </span>
            <p className="font-body-md text-body-md text-on-surface">
              <strong>AI Advice:</strong> Your balance may become tight around the last week of the
              month based on current spending.{' '}
              <span className="text-on-surface-variant">
                Recommended buffer: reserve <strong>৳4,500</strong> by Oct 20.
              </span>
            </p>
          </div>
          <button
            onClick={() => setBufferLocked(!bufferLocked)}
            className={`px-3 py-1.5 rounded-full font-label-sm text-label-sm font-semibold whitespace-nowrap self-start md:self-auto transition-all ${bufferLocked
                ? 'bg-primary-container text-on-primary'
                : 'bg-secondary text-on-secondary hover:bg-on-secondary-fixed-variant'
              }`}
          >
            {bufferLocked ? '৳4,500 Buffer Reserved' : 'Lock Buffer Now'}
          </button>
        </div>

        {/* Interactive Line Chart Canvas Area */}
        <div className="w-full bg-surface-container-low/40 rounded-xl p-space-md relative overflow-hidden border border-outline-variant/15">
          {/* Grid Header Legends */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4 text-label-sm font-label-sm flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-1 bg-secondary rounded-full"></span>
                <span className="text-on-surface">Projected Balance</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-1 bg-outline-variant rounded-full"></span>
                <span className="text-on-surface-variant">Expected Recurring Outflows</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-error"></span>
                <span className="text-error font-semibold">Pressure Zone (Day 26)</span>
              </div>
              {isSimulated && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-secondary-container text-on-secondary-container text-xs font-bold">
                  <span>+৳300/day simulation active</span>
                </div>
              )}
            </div>
            <span className="font-label-sm text-label-sm text-outline">Oct 1 - Oct 31, 2024</span>
          </div>

          {/* Forecast SVG Visualization */}
          <div className="w-full h-64 relative">
            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 800 240">
              <defs>
                <linearGradient id="balanceGrad" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#006c49" stopOpacity="0.25"></stop>
                  <stop offset="100%" stopColor="#006c49" stopOpacity="0.0"></stop>
                </linearGradient>
                <linearGradient id="pressureGrad" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#ba1a1a" stopOpacity="0.2"></stop>
                  <stop offset="100%" stopColor="#ba1a1a" stopOpacity="0.0"></stop>
                </linearGradient>
              </defs>
              {/* Horizontal Grid Lines */}
              <line opacity="0.6" stroke="#d3e4fe" strokeDasharray="4 4" strokeWidth="1" x1="0" x2="800" y1="40" y2="40" />
              <line opacity="0.6" stroke="#d3e4fe" strokeDasharray="4 4" strokeWidth="1" x1="0" x2="800" y1="100" y2="100" />
              <line opacity="0.6" stroke="#d3e4fe" strokeDasharray="4 4" strokeWidth="1" x1="0" x2="800" y1="160" y2="160" />
              <line opacity="0.6" stroke="#d3e4fe" strokeDasharray="4 4" strokeWidth="1" x1="0" x2="800" y1="210" y2="210" />

              {/* Pressure Zone Area Fill (Day 24 - 28) */}
              <rect fill="url(#pressureGrad)" height="200" rx="8" width="120" x="580" y="20" />
              <line stroke="#ba1a1a" strokeDasharray="3 3" strokeWidth="1.5" x1="640" x2="640" y1="20" y2="220" />

              {/* Area fill under balance curve */}
              <path
                d={
                  isSimulated
                    ? 'M 0,90 Q 150,55 300,68 T 500,85 T 640,125 T 800,100 L 800,230 L 0,230 Z'
                    : 'M 0,90 Q 150,60 300,75 T 500,110 T 640,175 T 800,140 L 800,230 L 0,230 Z'
                }
                fill="url(#balanceGrad)"
                className="transition-all duration-700 ease-out"
              />

              {/* Outflows baseline curve */}
              <path
                d="M 0,180 Q 200,170 400,160 T 640,210 T 800,195"
                fill="none"
                stroke="#76777d"
                strokeDasharray="5 5"
                strokeWidth="2"
              />

              {/* Main Projected Balance Curve */}
              <path
                d={
                  isSimulated
                    ? 'M 0,90 Q 150,55 300,68 T 500,85 T 640,125 T 800,100'
                    : 'M 0,90 Q 150,60 300,75 T 500,110 T 640,175 T 800,140'
                }
                fill="none"
                stroke={isSimulated ? '#00714d' : '#006c49'}
                strokeLinecap="round"
                strokeWidth={isSimulated ? 4 : 3}
                className="transition-all duration-700 ease-out"
              />

              {/* Anchor Points */}
              <circle cx="280" cy={isSimulated ? 68 : 72} fill="#006c49" r="5" stroke="#ffffff" strokeWidth="2" />
              <circle cx="640" cy={isSimulated ? 125 : 175} fill={isSimulated ? '#006c49' : '#ba1a1a'} r="6" stroke="#ffffff" strokeWidth="2.5" />
            </svg>

            {/* Positioned Marker Tag at Day 26 */}
            <div className="absolute top-20 left-[75%] -translate-x-1/2 p-2.5 rounded-lg bg-surface-container-lowest shadow-md max-w-[210px] pointer-events-none border border-outline-variant/30">
              <div className="flex items-center gap-1 text-error font-label-sm text-label-sm font-bold">
                <span className="material-symbols-outlined text-[14px]">report</span>
                Cash Flow Pressure Zone
              </div>
              <p className="font-body-sm text-[11px] text-on-surface-variant leading-tight mt-1">
                <strong>Oct 27:</strong> Rent (৳16,000) &amp; utility dues.{' '}
                {isSimulated
                  ? 'Projected buffer improved to ৳6,800!'
                  : 'Minimum projected margin: ৳3,200.'}
              </p>
            </div>

            {/* Positioned Marker for Current Day */}
            <div className="absolute top-8 left-[35%] -translate-x-1/2 p-1.5 px-2.5 rounded-md bg-primary-container text-on-primary text-[11px] font-label-sm shadow-sm pointer-events-none">
              Today: {formatBDT(totalBalance)}
            </div>
          </div>

          {/* X-Axis Timeline Markers */}
          <div className="flex justify-between items-center text-outline font-label-sm text-[11px] pt-3">
            <span>Day 1 (Oct 1)</span>
            <span>Day 7 (Oct 7)</span>
            <span className="text-secondary font-semibold">Day 14 (Oct 14 • Today)</span>
            <span>Day 21 (Oct 21)</span>
            <span className="text-error font-semibold">Day 26 (Oct 27 • Rent)</span>
            <span>Day 30 (Oct 31)</span>
          </div>
        </div>

        {/* Projected Cash Flow Metrics Summary Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-space-sm pt-2">
          <div className="p-3 rounded-lg bg-surface-container-low flex flex-col border border-outline-variant/15">
            <span className="font-label-sm text-label-sm text-outline">Projected Month-End</span>
            <span className="font-title-lg text-title-lg text-on-surface font-bold mt-0.5">
              {isSimulated ? '৳11,250' : '৳7,450'}
            </span>
            <span className="font-body-sm text-body-sm text-secondary font-medium">
              {isSimulated ? 'Surplus expanded by ৳3,800' : 'Safe positive close'}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-surface-container-low flex flex-col border border-outline-variant/15">
            <span className="font-label-sm text-label-sm text-outline">Upcoming Bills</span>
            <span className="font-title-lg text-title-lg text-on-surface font-bold mt-0.5">
              ৳18,200
            </span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">Due within 16 days</span>
          </div>

          <div className="p-3 rounded-lg bg-surface-container-low flex flex-col border border-outline-variant/15">
            <span className="font-label-sm text-label-sm text-outline">Expected Inflow</span>
            <span className="font-title-lg text-title-lg text-secondary font-bold mt-0.5">
              ৳6,000
            </span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              Freelance settlement
            </span>
          </div>

          <div className="p-3 rounded-lg bg-surface-container-low flex flex-col border border-outline-variant/15">
            <span className="font-label-sm text-label-sm text-outline">Risk Level</span>
            <span className="font-title-lg text-title-lg text-on-surface font-bold mt-0.5 flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-secondary-container"></span>
              {isSimulated ? 'Low' : 'Moderate'}
            </span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              Auto-shield enabled
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
