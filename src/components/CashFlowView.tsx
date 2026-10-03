import React, { useState } from 'react';
import { generateCashFlowForecast, formatBDT } from '../services/financialCalculations';
import { NavScreen } from './Sidebar';

interface CashFlowViewProps {
  onNavigate: (screen: NavScreen) => void;
  isBangla: boolean;
}

export const CashFlowView: React.FC<CashFlowViewProps> = ({ onNavigate, isBangla }) => {
  const [horizon, setHorizon] = useState<7 | 14 | 30>(30);
  const [isSimulated, setIsSimulated] = useState(false);
  const [lockedBuffer, setLockedBuffer] = useState(false);

  // Generate full 30-day forecast points
  const allForecastPoints = generateCashFlowForecast(24850, isSimulated);

  // Slice based on selected horizon
  const visiblePoints = allForecastPoints.slice(0, horizon);
  const endPoint = visiblePoints[visiblePoints.length - 1];
  const projectedEndBalance = endPoint ? endPoint.projectedBalance : 7450;

  // Key milestones filtered by horizon
  const scheduledEvents = [
    {
      day: 7,
      date: 'Oct 07',
      event: isBangla ? 'ফ্রিল্যান্স প্রজেক্ট বোনাস জমা' : 'Freelance Milestone Payout',
      impact: '+৳6,000',
      type: 'inflow',
      cushion: '৳28,100',
    },
    {
      day: 14,
      date: 'Oct 14',
      event: isBangla ? 'আজকের ব্যালেন্স ও স্বাভাবিক খরচ' : 'Today: Active Mid-month Baseline',
      impact: '-৳920',
      type: 'neutral',
      cushion: '৳24,850',
    },
    {
      day: 26,
      date: 'Oct 26',
      event: isBangla ? 'বাসা ভাড়া (৳১৬,০০০) ও ইউটিলিটি বিল (৳১,২০০)' : 'Apartment Rent & Utility Bills Due',
      impact: '-৳17,200',
      type: 'pressure',
      cushion: isSimulated ? '৳6,800' : '৳3,200',
    },
    {
      day: 30,
      date: 'Oct 31',
      event: isBangla ? 'মাস শেষের নিরাপদ ব্যালেন্স' : 'Projected Safe Month-End Close',
      impact: isSimulated ? '৳11,250' : '৳7,450',
      type: 'safe',
      cushion: isSimulated ? '৳11,250' : '৳7,450',
    },
  ].filter((ev) => ev.day <= horizon);

  return (
    <div className="flex flex-col w-full gap-space-lg pb-space-xl">
      {/* Header with Horizon Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-bold">
              AI-assisted forecast
            </span>
            <span className="font-label-sm text-label-sm text-outline">
              {isBangla ? 'ঢাকা মেট্রো মডেল • পরিবর্তনশীল অনুমান' : 'Dhaka Metro Heuristics • Indicative, not guaranteed'}
            </span>
          </div>
          <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-bold">
            {isBangla ? 'ক্যাশ-ফ্লো পূর্বাভাস ও তারল্য বাফার' : 'Cash Flow Forecast & Liquidity Buffer'}
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl mt-0.5">
            {isBangla
              ? 'আসন্ন নিয়মিত খরচ ও বিলের পূর্বাভাস দেখুন, মাসের শেষভাগের চাপ দূর করুন এবং খরচ কমানোর প্রভাব পরীক্ষা করুন।'
              : 'Understand upcoming obligations, eliminate month-end overdraft stress, and simulate expense cuts.'}
          </p>
        </div>

        {/* Controls: Horizon Tabs & Simulation Toggle */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Horizon Selection */}
          <div className="inline-flex p-1 rounded-xl bg-surface-container shadow-inner border border-outline-variant/20">
            {([7, 14, 30] as const).map((days) => (
              <button
                key={days}
                onClick={() => setHorizon(days)}
                className={`px-3 py-1.5 rounded-lg font-label-md text-label-md transition-all font-semibold ${
                  horizon === days
                    ? 'bg-surface-container-lowest shadow-sm text-on-surface font-bold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {days} {isBangla ? 'দিন' : 'Days'}
              </button>
            ))}
          </div>

          {/* Simulate Expense Cut Toggle */}
          <button
            onClick={() => setIsSimulated(!isSimulated)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-title-md text-sm transition-all shadow-sm ${
              isSimulated
                ? 'bg-secondary-container text-on-secondary-container font-bold ring-2 ring-secondary'
                : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container-low border border-outline-variant/30'
            }`}
          >
            <span className="material-symbols-outlined text-[18px] text-secondary">tune</span>
            <span>
              {isSimulated
                ? isBangla ? 'সিমুলেশন সক্রিয় (+৳৩০০/দিন)' : 'Simulation Active (+৳300/day)'
                : isBangla ? 'খরচ হ্রাস সিমুলেট করুন' : 'Simulate Expense Cut (+৳300/day)'}
            </span>
          </button>
        </div>
      </div>

      {/* Pressure Zone Alert Banner */}
      <div className="p-space-md rounded-2xl bg-error-container/20 border border-error/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-space-md">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-error-container text-error flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[24px]">warning</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-title-md text-title-md text-on-surface font-bold">
                {isBangla ? 'আসন্ন ক্যাশ-ফ্লো প্রেশার জোন (২৪ - ২৮ অক্টোবর)' : 'Upcoming Cash Flow Pressure Zone (Oct 24 - 28)'}
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-error-container text-on-error-container font-label-sm text-[10px] font-bold">
                {isBangla ? 'উচ্চ অগ্রাধিকার' : 'High Focus'}
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
              {isBangla
                ? '২৬ তারিখে বাসা ভাড়া (৳১৬,০০০) এবং বিদ্যুৎ/ইন্টারনেট বিল (৳১,২০০) মিলিয়ে ৳১৭,২০০ একসাথে দিতে হবে। ২০ অক্টোবরের মধ্যে বাফার আলাদা রাখুন।'
                : 'Rent payment (৳16,000) and DESCO/WASA utility bills (৳1,200) cluster together on Day 26 (totaling ৳17,200). Reserve a liquidity buffer by Oct 20.'}
            </p>
          </div>
        </div>
        <button
          onClick={() => setLockedBuffer(!lockedBuffer)}
          className={`px-4 py-2.5 rounded-xl font-title-md text-sm whitespace-nowrap transition-all shadow-sm ${
            lockedBuffer
              ? 'bg-secondary text-on-secondary font-bold'
              : 'bg-primary text-on-primary hover:opacity-90 active:scale-95'
          }`}
        >
          {lockedBuffer
            ? isBangla ? '✓ ৳৪,৫০০ বাফার সংরক্ষিত' : '✓ ৳4,500 Buffer Reserved'
            : isBangla ? 'এখনই ৳৪,৫০০ বাফার রাখুন' : 'Lock ৳4,500 Buffer Now'}
        </button>
      </div>

      {/* KPI Forecast Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
        <div className="p-4 rounded-xl bg-surface-container-lowest shadow-sm border border-outline-variant/20 flex flex-col justify-between">
          <span className="text-xs font-semibold text-outline uppercase tracking-wider">
            {isBangla ? 'শুরুর মোট ব্যালেন্স' : 'Starting Balance'}
          </span>
          <span className="font-headline-lg text-headline-lg text-on-surface font-bold mt-1">
            ৳24,850
          </span>
          <span className="text-xs text-on-surface-variant mt-1">
            3 {isBangla ? 'অ্যাকাউন্ট সংযুক্ত' : 'Linked Accounts'}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-surface-container-lowest shadow-sm border border-outline-variant/20 flex flex-col justify-between">
          <span className="text-xs font-semibold text-outline uppercase tracking-wider">
            {isBangla ? `${horizon} দিন শেষের সম্ভাব্য ব্যালেন্স` : `Projected Day ${horizon} Balance`}
          </span>
          <span className="font-headline-lg text-headline-lg text-secondary font-bold mt-1">
            {formatBDT(projectedEndBalance)}
          </span>
          <span className="text-xs text-secondary font-medium mt-1">
            {isSimulated
              ? isBangla ? 'সিমুলেশনে +৳৩,৮০০ উদ্বৃত্ত' : 'Surplus expanded by +৳3,800'
              : isBangla ? 'নিরাপদ উদ্বৃত্ত' : 'Safe positive close'}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-surface-container-lowest shadow-sm border border-outline-variant/20 flex flex-col justify-between">
          <span className="text-xs font-semibold text-outline uppercase tracking-wider">
            {isBangla ? 'আসন্ন নির্ধারিত দায় ও বিল' : 'Upcoming Obligations'}
          </span>
          <span className="font-headline-lg text-headline-lg text-error font-bold mt-1">
            {horizon === 30 ? '৳17,200' : '৳3,680'}
          </span>
          <span className="text-xs text-on-surface-variant mt-1">
            {horizon === 30 ? 'Rent (৳16k) + Bills (৳1.2k)' : 'Daily burn commitments'}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-surface-container-lowest shadow-sm border border-outline-variant/20 flex flex-col justify-between">
          <span className="text-xs font-semibold text-outline uppercase tracking-wider">
            {isBangla ? 'প্রস্তাবিত জরুরি বাফার' : 'Recommended Buffer'}
          </span>
          <span className="font-headline-lg text-headline-lg text-on-surface font-bold mt-1">
            ৳4,500
          </span>
          <span className="text-xs text-secondary font-medium mt-1">
            {lockedBuffer ? 'Reserved in bKash vault' : 'Due by Oct 20'}
          </span>
        </div>
      </div>

      {/* Main Forecast Line Chart Canvas Card */}
      <div className="p-space-lg rounded-2xl bg-surface-container-lowest shadow-sm border border-outline-variant/20 flex flex-col gap-space-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-outline-variant/15 gap-2">
          <div className="flex items-center gap-4 text-xs font-semibold flex-wrap">
            <span className="flex items-center gap-1.5 text-secondary">
              <span className="w-3 h-1 bg-secondary rounded-full"></span>{' '}
              {isBangla ? 'সম্ভাব্য ব্যালেন্সের গতিপথ' : 'Projected Balance Curve'}
            </span>
            <span className="flex items-center gap-1.5 text-outline">
              <span className="w-3 h-1 bg-outline-variant rounded-full"></span>{' '}
              {isBangla ? 'স্বাভাবিক দৈনিক ব্যয়' : 'Estimated Daily Burn'}
            </span>
            {horizon === 30 && (
              <span className="flex items-center gap-1.5 text-error">
                <span className="w-2 h-2 rounded-full bg-error"></span>{' '}
                {isBangla ? 'প্রেশার জোন (২৬ অক্টোবর)' : 'Pressure Zone (Day 26)'}
              </span>
            )}
          </div>
          <span className="text-xs text-outline font-medium">
            {horizon === 7
              ? 'Oct 1 - Oct 7, 2024'
              : horizon === 14
              ? 'Oct 1 - Oct 14, 2024'
              : 'Oct 1 - Oct 31, 2024'}
          </span>
        </div>

        {/* SVG Visualization Canvas */}
        <div className="w-full h-64 relative bg-surface-container-low/30 rounded-xl p-3 border border-outline-variant/15">
          <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 800 240">
            <defs>
              <linearGradient id="cfGradH" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#006c49" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#006c49" stopOpacity="0.02" />
              </linearGradient>
              <linearGradient id="cfPressureH" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#ba1a1a" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#ba1a1a" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            <line opacity="0.4" stroke="#d3e4fe" strokeDasharray="4 4" x1="0" x2="800" y1="40" y2="40" />
            <line opacity="0.4" stroke="#d3e4fe" strokeDasharray="4 4" x1="0" x2="800" y1="100" y2="100" />
            <line opacity="0.4" stroke="#d3e4fe" strokeDasharray="4 4" x1="0" x2="800" y1="160" y2="160" />
            <line opacity="0.4" stroke="#d3e4fe" strokeDasharray="4 4" x1="0" x2="800" y1="210" y2="210" />

            {/* Pressure Zone Highlight (only in 30-day view) */}
            {horizon === 30 && (
              <>
                <rect fill="url(#cfPressureH)" height="190" rx="8" width="120" x="590" y="20" />
                <line stroke="#ba1a1a" strokeDasharray="3 3" strokeWidth="1.5" x1="650" x2="650" y1="20" y2="210" />
              </>
            )}

            {/* Area Fill */}
            <path
              d={
                horizon === 7
                  ? 'M 0,110 Q 300,70 800,50 L 800,230 L 0,230 Z'
                  : horizon === 14
                  ? 'M 0,110 Q 200,60 500,90 T 800,105 L 800,230 L 0,230 Z'
                  : isSimulated
                  ? 'M 0,90 Q 150,55 300,68 T 500,85 T 640,125 T 800,100 L 800,230 L 0,230 Z'
                  : 'M 0,90 Q 150,60 300,75 T 500,110 T 640,175 T 800,140 L 800,230 L 0,230 Z'
              }
              fill="url(#cfGradH)"
              className="transition-all duration-700 ease-out"
            />

            {/* Projected Curve */}
            <path
              d={
                horizon === 7
                  ? 'M 0,110 Q 300,70 800,50'
                  : horizon === 14
                  ? 'M 0,110 Q 200,60 500,90 T 800,105'
                  : isSimulated
                  ? 'M 0,90 Q 150,55 300,68 T 500,85 T 640,125 T 800,100'
                  : 'M 0,90 Q 150,60 300,75 T 500,110 T 640,175 T 800,140'
              }
              fill="none"
              stroke={isSimulated ? '#00714d' : '#006c49'}
              strokeWidth="3.5"
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
            />

            {/* Key Marker Circles */}
            <circle cx="280" cy={horizon === 7 ? 70 : 75} fill="#006c49" r="5" stroke="#ffffff" strokeWidth="2" />
            {horizon === 30 && (
              <circle
                cx="650"
                cy={isSimulated ? 125 : 175}
                fill={isSimulated ? '#006c49' : '#ba1a1a'}
                r="6"
                stroke="#ffffff"
                strokeWidth="2.5"
              />
            )}
          </svg>

          {/* Timeline X Markers */}
          <div className="flex justify-between items-center text-outline font-label-sm text-[11px] pt-2 px-1">
            <span>Day 1 (Oct 1)</span>
            {horizon >= 7 && <span className="text-secondary font-semibold">Day 7 (+৳6k Payout)</span>}
            {horizon >= 14 && <span className="text-on-surface font-semibold">Day 14 (Mid-Month)</span>}
            {horizon >= 30 && <span className="text-error font-semibold">Day 26 (Rent Due)</span>}
            <span>Day {horizon} (End)</span>
          </div>
        </div>
      </div>

      {/* Explanation of Forecast Assumptions Card */}
      <div className="p-space-lg rounded-2xl bg-surface-container-lowest shadow-sm border border-outline-variant/20 flex flex-col gap-space-md">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary text-[22px]">info</span>
          <h3 className="font-title-lg text-title-lg text-on-surface font-bold">
            {isBangla ? 'পূর্বাভাসের মূল অনুমান ও কার্যপদ্ধতি' : 'Forecast Assumptions & Heuristics'}
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
          <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/15 flex flex-col gap-1">
            <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-secondary">speed</span>
              {isBangla ? 'দৈনিক খরচের হার' : 'Daily Burn Rate'}
            </span>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              {isSimulated
                ? isBangla
                  ? 'সিমুলেশন অনুযায়ী দৈনিক খরচ ৳৬২০ ধরা হয়েছে (৳৩০০/দিন সাশ্রয় অন্তর্ভুক্ত)।'
                  : 'Calibrated at ৳620/day with simulated ৳300/day discretionary cap.'
                : isBangla
                ? 'অক্টোবর মাসের স্বাভাবিক গড় অনুযায়ী দৈনিক ৳৯২০ খরচ ধরা হয়েছে।'
                : 'Calibrated at ৳920/day based on 30-day historical non-fixed spending.'}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/15 flex flex-col gap-1">
            <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-error">event</span>
              {isBangla ? '২৬ অক্টোবরের নির্ধারিত দায়' : 'Day 26 Obligation Cluster'}
            </span>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              {isBangla
                ? 'বাসা ভাড়া ৳১৬,০০০ এবং ইউটিলিটি বিল ৳১,২০০ একযোগে ২৬ অক্টোবর নির্ধারিত।'
                : 'Rent (৳16,000) and DESCO/WASA utility bills (৳1,200) hit simultaneously on Oct 26.'}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/15 flex flex-col gap-1">
            <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-secondary">payments</span>
              {isBangla ? 'নিশ্চিত ইনফ্লো' : 'Confirmed Inflows'}
            </span>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              {isBangla
                ? 'প্রাথমিক বেতন ৳৩২,৫০০ মাসের শুরুতে জমা হয়েছে এবং ফ্রিল্যান্স ৳৬,০০০ মাসের ৭ তারিখে যোগ হয়েছে।'
                : 'Primary salary ৳32,500 credited on Day 1; freelance milestone ৳6,000 credited on Day 7.'}
            </p>
          </div>
        </div>
      </div>

      {/* Scheduled Inflow/Outflow Timeline Table */}
      <div className="p-space-lg rounded-2xl bg-surface-container-lowest shadow-sm border border-outline-variant/20 flex flex-col gap-space-md">
        <div className="flex items-center justify-between">
          <h3 className="font-title-lg text-title-lg text-on-surface font-bold">
            {isBangla ? `${horizon}-দিনের প্রধান নগদ প্রবাহ ইভেন্টসমূহ` : `Key Events within ${horizon}-Day Window`}
          </h3>
          <button
            onClick={() => onNavigate('ai-coach')}
            className="text-xs font-semibold text-secondary hover:underline flex items-center gap-1"
          >
            <span>{isBangla ? 'কোচকে জিজ্ঞাসা করুন' : 'Ask AI Coach Details'}</span>
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </button>
        </div>

        <div className="divide-y divide-surface-container-low border border-outline-variant/15 rounded-xl overflow-hidden text-sm">
          <div className="p-3 bg-surface-container-low/50 font-bold text-xs text-outline uppercase tracking-wider flex justify-between">
            <span className="w-24">Date</span>
            <span className="flex-1">Event / Outflow</span>
            <span className="w-28 text-right">Cash Flow</span>
            <span className="w-28 text-right">Cushion</span>
          </div>
          {scheduledEvents.map((ev, i) => (
            <div
              key={i}
              className={`p-3.5 flex items-center justify-between ${
                ev.type === 'pressure'
                  ? 'bg-error-container/15'
                  : ev.type === 'inflow'
                  ? 'bg-secondary-container/15'
                  : ''
              }`}
            >
              <span className="w-24 font-semibold text-on-surface">{ev.date}</span>
              <span className="flex-1 text-on-surface truncate pr-2">{ev.event}</span>
              <span
                className={`w-28 text-right font-bold ${
                  ev.type === 'inflow'
                    ? 'text-secondary'
                    : ev.type === 'pressure'
                    ? 'text-error'
                    : 'text-on-surface'
                }`}
              >
                {ev.impact}
              </span>
              <span className="w-28 text-right font-semibold text-on-surface">{ev.cushion}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
