import React from 'react';
import { FinancialHealthMetrics } from '../types/financial';
import { NavScreen } from './Sidebar';

interface FinancialHealthViewProps {
  metrics: FinancialHealthMetrics;
  onNavigate: (screen: NavScreen) => void;
  isBangla: boolean;
}

export const FinancialHealthView: React.FC<FinancialHealthViewProps> = ({
  metrics,
  onNavigate,
  isBangla: _isBangla,
}) => {
  return (
    <div className="flex flex-col w-full gap-space-lg pb-space-xl">
      {/* Header */}
      <div className="flex flex-col">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-bold">
            TRANSPARENT PROTOTYPE SCORING
          </span>
          <span className="font-label-sm text-label-sm text-outline">Dhaka Digital Wallet Model</span>
        </div>
        <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-bold">
          ArthoBachao AI Financial Health Score Breakdown
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl mt-1">
          Unlike traditional black-box credit scores, ArthoBachao AI's score is 100% explainable, deterministic, and under your control.
        </p>
      </div>

      {/* Main Score Hero Card */}
      <div className="p-space-lg rounded-2xl bg-surface-container-lowest shadow-sm border border-outline-variant/20 flex flex-col md:flex-row items-center justify-between gap-space-lg">
        <div className="flex items-center gap-space-lg">
          <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" fill="transparent" r="48" stroke="#eff4ff" strokeWidth="10" />
              <circle
                cx="60"
                cy="60"
                fill="transparent"
                r="48"
                stroke="#006c49"
                strokeDasharray={`${(metrics.score / 100) * 301.6} 301.6`}
                strokeLinecap="round"
                strokeWidth="10"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="font-headline-xl text-headline-xl text-on-surface font-bold">
                {metrics.score}
              </span>
              <span className="text-xs text-outline uppercase font-semibold">/ 100</span>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h2 className="font-headline-md text-headline-md text-on-surface font-bold">
                Overall Financial Health: {metrics.status}
              </h2>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-xl">
              {metrics.explanation}
            </p>
            <span className="text-xs font-semibold text-secondary mt-1">
              Top 26th percentile among tech professionals in Gulshan, Banani, &amp; Uttara.
            </span>
          </div>
        </div>

        <button
          onClick={() => onNavigate('ai-coach')}
          className="px-space-lg py-3 rounded-xl bg-primary-container text-on-primary font-title-md hover:opacity-95 shadow-md flex items-center gap-2 shrink-0 active:scale-95"
        >
          <span className="material-symbols-outlined text-[18px] text-secondary-container">
            auto_awesome
          </span>
          <span>Ask Coach How to Reach 85+</span>
        </button>
      </div>

      {/* 4 Factor Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
        {/* Factor 1 */}
        <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm border border-outline-variant/20 flex flex-col justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-title-md text-title-md text-on-surface font-bold">
                1. Saving Consistency
              </span>
              <span className="font-headline-md text-headline-md text-secondary font-bold">
                {metrics.factors.savingConsistency}%
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Measures regular transfers to your Emergency Fund and liquid vaults. You achieved a 24.1% savings rate this month, outpacing the 20% national benchmark.
            </p>
          </div>
          <div className="w-full bg-surface-container-low h-2 rounded-full mt-4 overflow-hidden">
            <div
              className="bg-secondary h-full rounded-full"
              style={{ width: `${metrics.factors.savingConsistency}%` }}
            ></div>
          </div>
        </div>

        {/* Factor 2 */}
        <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm border border-outline-variant/20 flex flex-col justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-title-md text-title-md text-on-surface font-bold">
                2. Spending Control
              </span>
              <span className="font-headline-md text-headline-md text-on-surface font-bold">
                {metrics.factors.spendingControl}%
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Evaluates discretionary burn vs essential commitments. Slight friction detected from late-night weekend deliveries (৳8,200) and avoidable MFS fees.
            </p>
          </div>
          <div className="w-full bg-surface-container-low h-2 rounded-full mt-4 overflow-hidden">
            <div
              className="bg-secondary-fixed-dim h-full rounded-full"
              style={{ width: `${metrics.factors.spendingControl}%` }}
            ></div>
          </div>
        </div>

        {/* Factor 3 */}
        <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm border border-outline-variant/20 flex flex-col justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-title-md text-title-md text-on-surface font-bold">
                3. Cash Flow Stability
              </span>
              <span className="font-headline-md text-headline-md text-on-surface font-bold">
                {metrics.factors.cashFlowStability}%
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Monitors projected month-end cushion. Your minimum margin before Rent on Oct 27 is ৳3,200, which qualifies as moderate risk.
            </p>
          </div>
          <div className="w-full bg-surface-container-low h-2 rounded-full mt-4 overflow-hidden">
            <div
              className="bg-secondary h-full rounded-full"
              style={{ width: `${metrics.factors.cashFlowStability}%` }}
            ></div>
          </div>
        </div>

        {/* Factor 4 */}
        <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm border border-outline-variant/20 flex flex-col justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-title-md text-title-md text-on-surface font-bold">
                4. Goal Progress
              </span>
              <span className="font-headline-md text-headline-md text-secondary font-bold">
                {metrics.factors.goalProgress}%
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Average milestone attainment across your Emergency Fund (61.7%), MacBook (40%), and Sajek trip (50%). You are on track for Dec 2024 completion.
            </p>
          </div>
          <div className="w-full bg-surface-container-low h-2 rounded-full mt-4 overflow-hidden">
            <div
              className="bg-secondary h-full rounded-full"
              style={{ width: `${metrics.factors.goalProgress}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};
