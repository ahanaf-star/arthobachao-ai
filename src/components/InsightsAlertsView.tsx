import React, { useState } from 'react';
import { NavScreen } from './Sidebar';

interface InsightsAlertsViewProps {
  onNavigate: (screen: NavScreen) => void;
  isBangla: boolean;
}

interface AlertItem {
  id: string;
  type: 'surge' | 'fee_leak' | 'milestone' | 'cashflow' | 'system';
  titleEn: string;
  titleBn: string;
  descEn: string;
  descBn: string;
  savingsHintEn?: string;
  savingsHintBn?: string;
  date: string;
  badgeEn: string;
  badgeBn: string;
  icon: string;
  isUnread: boolean;
  actionScreen: NavScreen;
  actionTextEn: string;
  actionTextBn: string;
}

export const InsightsAlertsView: React.FC<InsightsAlertsViewProps> = ({
  onNavigate,
  isBangla,
}) => {
  const [activeTab, setActiveTab] = useState<'alerts' | 'notifications'>('alerts');
  const [filter, setFilter] = useState<'all' | 'unread' | 'fee_leak' | 'surge' | 'milestone'>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [alerts, setAlerts] = useState<AlertItem[]>([
    {
      id: 'alt-1',
      type: 'surge',
      titleEn: 'Food & Late-Night Dining Surge (+14% vs Base)',
      titleBn: 'খাবার ও রেস্তোরাঁ খরচে অতিরিক্ত বৃদ্ধি (+১৪%)',
      descEn:
        'Food spending has hit ৳8,200 this month, primarily driven by weekend Pathao Food and late-night snacks in Gulshan/Banani.',
      descBn:
        'চলতি মাসে খাবার খরচ ৮,২০০ টাকায় পৌঁছেছে, যার প্রধান কারণ সপ্তাহান্তে পাঠাও ফুড ও গুলশান/বনানীতে দেরিতে খাবার অর্ডার।',
      savingsHintEn: 'Potential monthly savings: ৳900 by capping weekend delivery orders at ৳1,200/week.',
      savingsHintBn: 'সপ্তাহান্তে অর্ডারে সীমা নির্ধারণ করে মাসে ৯০০ টাকা পর্যন্ত সঞ্চয় সম্ভব।',
      date: 'Oct 14, 2024 • 10:15 AM',
      badgeEn: 'Surge Flagged',
      badgeBn: 'খরচের বৃদ্ধি',
      icon: 'trending_up',
      isUnread: true,
      actionScreen: 'spending-analysis',
      actionTextEn: 'Review & Set Cap',
      actionTextBn: 'পর্যালোচনা করুন',
    },
    {
      id: 'alt-2',
      type: 'fee_leak',
      titleEn: 'MFS Agent Cash-Out Charges (৳420 in Avoidable Fees)',
      titleBn: 'বিকাশ ও নগদ ক্যাশ-আউট ফি (৳৪২০ অপ্রয়োজনীয় খরচ)',
      descEn:
        'You made 3 micro cash-out withdrawals via bKash and Nagad agents, incurring a 1.85% tariff each time.',
      descBn:
        'আপনি এজেন্ট পয়েন্ট থেকে ৩টি ছোট ক্যাশ-আউট করেছেন, যাতে প্রতিবারে ১.৮৫% ফি দিতে হয়েছে।',
      savingsHintEn: 'Switch 3 withdrawals to City Bank free ATM debit cards to save ৳420/month.',
      savingsHintBn: 'সিটি ব্যাংকের বিনামূল্যে এটিএম কার্ড ব্যবহার করলে প্রতি মাসে ৪২০ টাকা বাঁচবে।',
      date: 'Oct 11, 2024 • 04:30 PM',
      badgeEn: 'Instant Fee Leak',
      badgeBn: 'ফি লিকেজ',
      icon: 'price_change',
      isUnread: true,
      actionScreen: 'ai-coach',
      actionTextEn: 'Ask Coach How',
      actionTextBn: 'কোচকে জিজ্ঞেস করুন',
    },
    {
      id: 'alt-3',
      type: 'cashflow',
      titleEn: 'Upcoming Cash-Flow Pressure Zone (Oct 24 - 28)',
      titleBn: 'আসন্ন ক্যাশ-ফ্লো প্রেশার জোন (২৪ - ২৮ অক্টোবর)',
      descEn:
        'House rent (৳16,000) and DESCO/WASA utility bills (৳1,200) cluster together on Day 26. Safe balance drops to ৳3,200.',
      descBn:
        '২৬ তারিখে বাসা ভাড়া (৳১৬,০০০) ও ইউটিলিটি বিল (৳১,২০০) মিলিয়ে ১৭,২০০ টাকা একসাথে খরচ হবে। বাফার আলাদা রাখুন।',
      savingsHintEn: 'Lock ৳5,000 liquidity buffer by Oct 20 to eliminate month-end stress.',
      savingsHintBn: '২০ অক্টোবরের মধ্যে ৫,০০০ টাকা বাফার আলাদা রাখলে মাসের শেষভাগে কোনো সংকট হবে না।',
      date: 'Oct 09, 2024 • 09:00 AM',
      badgeEn: 'Liquidity Pressure',
      badgeBn: 'তারল্য চাপ',
      icon: 'warning',
      isUnread: true,
      actionScreen: 'cash-flow-forecast',
      actionTextEn: 'View 30-Day Curve',
      actionTextBn: 'পূর্বাভাস দেখুন',
    },
    {
      id: 'alt-4',
      type: 'milestone',
      titleEn: 'Emergency Fund ৳10,000 Milestone Reached!',
      titleBn: 'জরুরি তহবিলের প্রথম মাইলফলক (১০,০০০ টাকা) সম্পন্ন!',
      descEn:
        'Your liquid reserve crossed 61.7% (৳18,500 / ৳30,000). Next milestone target is ৳20,000, projected for Nov 04.',
      descBn:
        'আপনার জরুরি তহবিলের অগ্রগতি ৬১.৭% (১৮,৫০০ টাকা)। পরবর্তী ২০,০০০ টাকার মাইলফলক ৪ নভেম্বরের মধ্যে অর্জিত হবে।',
      date: 'Oct 07, 2024 • 02:20 PM',
      badgeEn: 'Milestone Hit',
      badgeBn: 'মাইলফলক অর্জিত',
      icon: 'military_tech',
      isUnread: false,
      actionScreen: 'savings-goals',
      actionTextEn: 'View Goal Progress',
      actionTextBn: 'লক্ষ্য দেখুন',
    },
  ]);

  const [notifications, setNotifications] = useState([
    {
      id: 'notif-1',
      title: 'Salary & Inflow Credited',
      desc: '৳38,500 salary deposited into City Bank Priority Account.',
      time: 'Oct 01, 2024 • 10:00 AM',
      icon: 'account_balance',
      read: true,
    },
    {
      id: 'notif-2',
      title: 'Daily Auto-Sweep Vault Deposit',
      desc: '৳350 moved from bKash liquid to Emergency Fund Vault.',
      time: 'Yesterday at 09:00 PM',
      icon: 'sync_alt',
      read: true,
    },
    {
      id: 'notif-3',
      title: 'Monthly Statement Generated',
      desc: 'September 2024 financial summary is available for download.',
      time: 'Oct 02, 2024 • 11:30 AM',
      icon: 'description',
      read: true,
    },
    {
      id: 'notif-4',
      title: 'bKash Security Sync',
      desc: 'Account balance verified and encrypted locally on device.',
      time: 'Today at 08:15 AM',
      icon: 'verified_user',
      read: true,
    },
  ]);

  const handleMarkAllRead = () => {
    setAlerts((prev) => prev.map((a) => ({ ...a, isUnread: false })));
    setToastMessage(isBangla ? 'সব নোটিফিকেশন পড়া হয়েছে হিসেবে চিহ্নিত করা হয়েছে।' : 'All alerts marked as read.');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleDismissAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
    setToastMessage(isBangla ? 'সতর্কবার্তা মুছে ফেলা হয়েছে।' : 'Alert dismissed.');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const filteredAlerts = alerts.filter((a) => {
    if (filter === 'all') return true;
    if (filter === 'unread') return a.isUnread;
    return a.type === filter;
  });

  const unreadCount = alerts.filter((a) => a.isUnread).length;

  return (
    <div className="flex flex-col w-full gap-space-lg pb-space-xl">
      {/* Toast message */}
      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-secondary text-on-secondary flex items-center justify-between shadow-md animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            <span className="text-sm font-semibold">{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="p-1">
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-bold">
              PROACTIVE INTELLIGENCE
            </span>
            <span className="font-label-sm text-label-sm text-outline">Continuous Anomaly Scanner</span>
          </div>
          <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-bold">
            {isBangla ? 'সতর্কবার্তা এবং নোটিফিকেশন' : 'Insights & Actionable Alerts'}
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl mt-1">
            {isBangla
              ? 'বিকাশ, নগদ এবং ব্যাংক কার্ডের অপ্রয়োজনীয় ফি ও খরচের অস্বাভাবিকতা খুঁজে বের করে লক্ষ্য বজায় রাখুন।'
              : 'ArthoBachao AI scans transactions across bKash, Nagad, and City Bank to pinpoint hidden fee leaks and cash flow bottlenecks before they hurt your goals.'}
          </p>
        </div>

        {/* Action button */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="px-4 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-bold transition-colors border border-outline-variant/30 flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">done_all</span>
              <span>{isBangla ? 'সব পড়া হয়েছে' : 'Mark All Read'}</span>
            </button>
          )}
        </div>
      </div>

      {/* View Switcher Tabs */}
      <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('alerts')}
            className={`px-4 py-2 rounded-xl font-title-md text-sm transition-all flex items-center gap-2 ${
              activeTab === 'alerts'
                ? 'bg-primary-container text-on-primary font-bold shadow-xs'
                : 'text-on-surface-variant hover:bg-surface-container-low'
            }`}
          >
            <span>{isBangla ? 'আর্থিক সতর্কবার্তা' : 'Financial Alerts & Insights'}</span>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-error text-on-error text-[10px] font-bold">
                {unreadCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-4 py-2 rounded-xl font-title-md text-sm transition-all flex items-center gap-2 ${
              activeTab === 'notifications'
                ? 'bg-primary-container text-on-primary font-bold shadow-xs'
                : 'text-on-surface-variant hover:bg-surface-container-low'
            }`}
          >
            <span>{isBangla ? 'অ্যাকাউন্ট অ্যাক্টিভিটি' : 'Activity Log'}</span>
            <span className="px-1.5 py-0.2 rounded-full bg-surface-container-high text-on-surface text-[10px] font-bold">
              {notifications.length}
            </span>
          </button>
        </div>

        {/* Filter Pills for Alerts */}
        {activeTab === 'alerts' && (
          <div className="hidden md:flex items-center gap-1.5">
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'unread', label: 'Unread' },
                { id: 'surge', label: 'Surges' },
                { id: 'fee_leak', label: 'Fee Leaks' },
                { id: 'milestone', label: 'Milestones' },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  filter === f.id
                    ? 'bg-surface-container-highest text-on-surface font-bold border border-outline-variant/40'
                    : 'text-outline hover:text-on-surface'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tab 1: Financial Alerts */}
      {activeTab === 'alerts' && (
        <div className="flex flex-col gap-space-md">
          {filteredAlerts.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-surface-container-lowest border border-outline-variant/20 flex flex-col items-center">
              <span className="material-symbols-outlined text-secondary text-4xl mb-2">check_circle</span>
              <h3 className="font-title-lg font-bold text-on-surface">No alerts match your filter</h3>
              <p className="text-sm text-on-surface-variant mt-1">Your accounts are currently running in equilibrium.</p>
              <button
                onClick={() => setFilter('all')}
                className="mt-4 px-4 py-2 rounded-xl bg-surface-container text-xs font-bold text-on-surface"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            filteredAlerts.map((alt) => (
              <div
                key={alt.id}
                className={`p-space-lg rounded-2xl bg-surface-container-lowest shadow-sm border transition-all flex flex-col sm:flex-row items-start justify-between gap-space-md ${
                  alt.isUnread ? 'border-secondary/40 ring-1 ring-secondary/20' : 'border-outline-variant/20'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      alt.type === 'surge' || alt.type === 'fee_leak'
                        ? 'bg-error-container text-error'
                        : alt.type === 'cashflow'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-secondary-container text-on-secondary-container'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[24px]">{alt.icon}</span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          alt.type === 'surge' || alt.type === 'fee_leak'
                            ? 'bg-error-container text-on-error-container'
                            : alt.type === 'cashflow'
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-secondary-container text-on-secondary-container'
                        }`}
                      >
                        {isBangla ? alt.badgeBn : alt.badgeEn}
                      </span>
                      <span className="text-xs text-outline">{alt.date}</span>
                      {alt.isUnread && (
                        <span className="w-2 h-2 rounded-full bg-secondary"></span>
                      )}
                    </div>

                    <h3 className="font-title-lg text-title-lg text-on-surface font-bold">
                      {isBangla ? alt.titleBn : alt.titleEn}
                    </h3>

                    <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
                      {isBangla ? alt.descBn : alt.descEn}
                    </p>

                    {alt.savingsHintEn && (
                      <span className="text-xs font-semibold text-secondary mt-0.5">
                        {isBangla ? alt.savingsHintBn : alt.savingsHintEn}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-outline-variant/15">
                  <button
                    onClick={() => onNavigate(alt.actionScreen)}
                    className="px-space-md py-2 rounded-xl bg-primary text-on-primary font-title-md text-sm hover:opacity-95 active:scale-95 transition-all shadow-xs"
                  >
                    {isBangla ? alt.actionTextBn : alt.actionTextEn}
                  </button>

                  <button
                    onClick={() => handleDismissAlert(alt.id)}
                    className="text-xs text-outline hover:text-on-surface transition-colors p-1"
                    title="Dismiss alert"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Activity Notifications */}
      {activeTab === 'notifications' && (
        <div className="rounded-2xl bg-surface-container-lowest border border-outline-variant/20 divide-y divide-outline-variant/15 shadow-sm">
          {notifications.map((n) => (
            <div key={n.id} className="p-4 flex items-center justify-between gap-3 hover:bg-surface-container-low transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-on-surface">
                  <span className="material-symbols-outlined text-[20px]">{n.icon}</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-title-md text-sm text-on-surface font-bold">{n.title}</span>
                  <span className="text-xs text-on-surface-variant">{n.desc}</span>
                </div>
              </div>
              <span className="text-xs text-outline shrink-0 font-medium">{n.time}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
