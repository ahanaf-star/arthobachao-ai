const ENDPOINT = 'http://localhost:3000/api/ai/coach';

const mockFinancialContext = {
  monthlyIncome: 38500,
  monthlySpending: 29200,
  netSavings: 9300,
  savingsRate: 24.2,
  healthScore: {
    score: 79,
    status: 'Very Good',
    percentile: 74,
    factors: {
      savingConsistency: 82,
      spendingControl: 71,
      cashFlowStability: 79,
      goalProgress: 84
    }
  },
  categories: [
    { category: 'Food & Groceries', amount: 8200, percentage: 28.1, momChangePercentage: 14, status: 'surging', topMerchants: ['Shwapno', 'Pathao Food', 'North End'] },
    { category: 'Shopping & Gadgets', amount: 5800, percentage: 19.9, momChangePercentage: -6, status: 'under_control', topMerchants: ['Daraz', 'Aarong'] },
    { category: 'Utility & Fixed Costs', amount: 4600, percentage: 15.8, momChangePercentage: 0, status: 'stable', topMerchants: ['DESCO', 'Dhaka WASA', 'Fiber Net'] },
    { category: 'Transportation', amount: 4400, percentage: 15.1, momChangePercentage: 6, status: 'stable', topMerchants: ['Dhaka Metro MRT', 'Uber', 'Pathao'] },
    { category: 'Cash-out & Bank Fees', amount: 2800, percentage: 9.6, momChangePercentage: 12, status: 'high_friction', topMerchants: ['bKash Agent', 'Nagad Agent'] },
    { category: 'Entertainment & Others', amount: 3400, percentage: 11.6, momChangePercentage: -5, status: 'efficient', topMerchants: ['Star Cineplex', 'Netflix', 'Spotify'] }
  ],
  goals: [
    {
      id: 'goal-emergency-fund',
      title: 'Emergency Fund',
      targetAmount: 30000,
      currentAmount: 18500,
      remainingAmount: 11500,
      progressPercentage: 61.7,
      requiredMonthlySavings: 5000,
      currentAverageMonthlySaving: 3200,
      monthlySavingsGap: 1800,
      deadline: '2024-12-14',
      projectedCompletionDate: 'Dec 2024'
    },
    {
      id: 'goal-macbook',
      title: 'New MacBook M3',
      targetAmount: 80000,
      currentAmount: 32000,
      remainingAmount: 48000,
      progressPercentage: 40.0,
      requiredMonthlySavings: 6000,
      currentAverageMonthlySaving: 3200,
      monthlySavingsGap: 2800,
      deadline: '2025-06-30',
      projectedCompletionDate: 'Jun 2025'
    }
  ],
  cashFlow: {
    startingBalance: 24850,
    projectedMonthEnd: 7450,
    upcomingBills: 17200,
    pressureDays: [24, 25, 26, 27, 28],
    recommendedBuffer: 18000
  }
};

const questions = [
  { id: 1, text: "Why do I run short before month-end?", isBangla: false },
  { id: 2, text: "How can I save ৳5,000 more each month?", isBangla: false },
  { id: 3, text: "Am I on track for my emergency fund?", isBangla: false },
  { id: 4, text: "Which category is increasing my spending the most?", isBangla: false },
  { id: 5, text: "What is affecting my financial health score?", isBangla: false },
  { id: 6, text: "আগামী মাসে আমার টাকা কত থাকতে পারে?", isBangla: true },
  { id: 7, text: "আমি কীভাবে প্রতি মাসে আরও টাকা save করতে পারি?", isBangla: true }
];

async function runTests() {
  console.log('=== STARTING GEMINI & ENGINE QUALITY VALIDATION ===\n');

  for (const q of questions) {
    console.log(`\n--------------------------------------------------`);
    console.log(`TEST QUESTION ${q.id}: "${q.text}" (${q.isBangla ? 'Bangla' : 'English'})`);
    console.log(`--------------------------------------------------`);
    const start = Date.now();
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: q.text,
          isBangla: q.isBangla,
          financialContext: mockFinancialContext
        })
      });
      const data = await res.json();
      const elapsed = Date.now() - start;
      console.log(`Status: ${res.status} | Source: ${data.source} | Response Time: ${elapsed}ms`);
      console.log(`Response Snippet:\n${data.text ? data.text.substring(0, 450) + '...' : JSON.stringify(data)}`);
    } catch (e) {
      console.error(`ERROR for Question ${q.id}:`, e.message);
    }
  }

  // Edge cases
  console.log(`\n==================================================`);
  console.log(`EDGE CASE TESTS`);
  console.log(`==================================================`);

  // Edge 1: Empty question
  console.log('\nEdge 1: Empty question');
  const resEmpty = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: "   ", isBangla: false })
  });
  console.log(`Empty question status: ${resEmpty.status}`);

  // Edge 2: Very long question
  console.log('\nEdge 2: Very long question');
  const longPrompt = "Please help me plan my finances. ".repeat(60);
  const resLong = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: longPrompt, isBangla: false, financialContext: mockFinancialContext })
  });
  const dataLong = await resLong.json();
  console.log(`Long question status: ${resLong.status} | Source: ${dataLong.source}`);

  // Edge 3: Unrelated question
  console.log('\nEdge 3: Unrelated question');
  const resUnrelated = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: "What is the capital of France and how does photosynthesis work?", isBangla: false, financialContext: mockFinancialContext })
  });
  const dataUnrelated = await resUnrelated.json();
  console.log(`Unrelated question status: ${resUnrelated.status} | Source: ${dataUnrelated.source}`);
  console.log(`Snippet: ${dataUnrelated.text ? dataUnrelated.text.substring(0, 250) : ''}`);

  // Edge 4: Missing financial context
  console.log('\nEdge 4: Missing financial context');
  const resMissing = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: "How much did I spend this month?", isBangla: false })
  });
  const dataMissing = await resMissing.json();
  console.log(`Missing context status: ${resMissing.status} | Source: ${dataMissing.source}`);
  console.log(`Snippet: ${dataMissing.text ? dataMissing.text.substring(0, 250) : ''}`);
}

runTests();
