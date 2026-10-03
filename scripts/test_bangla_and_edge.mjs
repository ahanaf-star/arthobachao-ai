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

async function testBangla() {
  console.log('=== TESTING BANGLA QUESTIONS ===\n');

  // Question 6
  console.log('--- TEST QUESTION 6: "আগামী মাসে আমার টাকা কত থাকতে পারে?" ---');
  let res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: "আগামী মাসে আমার টাকা কত থাকতে পারে?",
      isBangla: true,
      financialContext: mockFinancialContext
    })
  });
  let data = await res.json();
  console.log('Q6 Source:', data.source);
  console.log('Q6 Output:\n', data.text);

  // Question 7
  console.log('\n--- TEST QUESTION 7: "আমি কীভাবে প্রতি মাসে আরও টাকা save করতে পারি?" ---');
  res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: "আমি কীভাবে প্রতি মাসে আরও টাকা save করতে পারি?",
      isBangla: true,
      financialContext: mockFinancialContext
    })
  });
  data = await res.json();
  console.log('Q7 Source:', data.source);
  console.log('Q7 Output:\n', data.text);

  // Edge cases
  console.log('\n=== TESTING EDGE CASES ===\n');

  // 1. Empty Prompt
  console.log('1. Empty Prompt:');
  res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: "", isBangla: false })
  });
  console.log('Empty Prompt Status (expected 400):', res.status);

  // 2. Unrelated inquiry
  console.log('\n2. Unrelated Inquiry ("What is the capital of Australia?"):');
  res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: "What is the capital of Australia?",
      isBangla: false,
      financialContext: mockFinancialContext
    })
  });
  data = await res.json();
  console.log('Unrelated Source:', data.source);
  console.log('Unrelated Output:\n', data.text);

  // 3. Very long input
  console.log('\n3. Very Long Prompt (1,500 chars):');
  const longPrompt = "I am curious about my spending habits and why my grocery bills are high. ".repeat(20);
  res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: longPrompt,
      isBangla: false,
      financialContext: mockFinancialContext
    })
  });
  data = await res.json();
  console.log('Long Prompt Source:', data.source);
  console.log('Long Prompt Status:', res.status);

  // 4. Missing financialContext (graceful fallback/defaults)
  console.log('\n4. Missing financialContext:');
  res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: "What is my largest expense category?",
      isBangla: false
    })
  });
  data = await res.json();
  console.log('Missing Context Status:', res.status, '| Source:', data.source);
  console.log('Missing Context Output:\n', data.text?.slice(0, 200));
}

testBangla();
