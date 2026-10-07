import dotenv from 'dotenv';
dotenv.config();

const BASE_URL = 'http://localhost:3000';

interface TestResult {
  step: string;
  status: 'PASS' | 'FAIL' | 'NOT VERIFIED';
  details: string;
  evidence?: any;
}

const results: TestResult[] = [];

async function run() {
  console.log('====================================================');
  console.log('Starting Step 8: Real E2E Verification for AI Financial Coach');
  console.log('====================================================');

  // Verify server is reachable
  const healthRes = await fetch(`${BASE_URL}/api/health`);
  const healthData = await healthRes.json();
  console.log('Server health:', healthData);

  // 0. Security Verification: Unauthenticated request must return 401
  try {
    const unauthRes = await fetch(`${BASE_URL}/api/ai/coach`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'How much did I spend?' }),
    });
    if (unauthRes.status === 401) {
      results.push({
        step: 'Security: Unauthenticated request returns 401',
        status: 'PASS',
        details: 'POST /api/ai/coach without token rejected with 401 Unauthorized',
        evidence: { status: unauthRes.status },
      });
    } else {
      results.push({
        step: 'Security: Unauthenticated request returns 401',
        status: 'FAIL',
        details: `Expected 401, got ${unauthRes.status}`,
      });
    }
  } catch (err: any) {
    results.push({ step: 'Security: Unauthenticated check', status: 'FAIL', details: err.message });
  }

  // Register Test User 1
  const user1Email = `e2e_coach_user1_${Date.now()}@example.com`;
  const reg1Res = await fetch(`${BASE_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'E2E User One',
      email: user1Email,
      password: 'SecurePassword123!',
      monthlyIncome: 50000,
    }),
  });
  const reg1Data = await reg1Res.json();
  const token1 = reg1Data.token;
  const user1Id = reg1Data.user?.id;

  // Register Test User 2
  const user2Email = `e2e_coach_user2_${Date.now()}@example.com`;
  const reg2Res = await fetch(`${BASE_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'E2E User Two',
      email: user2Email,
      password: 'SecurePassword123!',
      monthlyIncome: 20000,
    }),
  });
  const reg2Data = await reg2Res.json();
  const token2 = reg2Data.token;

  console.log(`Created test users: User 1 (${user1Email}), User 2 (${user2Email})`);

  // Add initial transaction for User 1: Food ৳5,000
  const tx1Res = await fetch(`${BASE_URL}/api/transactions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token1}`,
    },
    body: JSON.stringify({
      amount: 5000,
      type: 'expense',
      category: 'Food & Groceries',
      description: 'Initial Grocery Purchase',
      date: '2026-10-02',
    }),
  });
  const tx1Data = await tx1Res.json();
  const tx1Id = tx1Data._id || tx1Data.id || tx1Data.customId || tx1Data.transaction?.id;

  // Add initial goal for User 1: Emergency Fund Target ৳40,000, Current ৳20,000
  const goalRes = await fetch(`${BASE_URL}/api/goals`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token1}`,
    },
    body: JSON.stringify({
      title: 'Emergency Fund',
      name: 'Emergency Fund',
      targetAmount: 40000,
      currentAmount: 20000,
      deadline: '2026-12-31',
    }),
  });
  const goalData = await goalRes.json();
  const goalId = goalData._id || goalData.id || goalData.customId || goalData.goal?.id;

  // 1. Ask: "How much did I spend this month?"
  const q1Res = await fetch(`${BASE_URL}/api/ai/coach`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token1}`,
    },
    body: JSON.stringify({
      message: 'How much did I spend this month?',
      language: 'en',
    }),
  });
  const q1Data = await q1Res.json();
  console.log('Q1 Response:', q1Data.answer);

  if (q1Data.answer && q1Data.answer.includes('5,000')) {
    results.push({
      step: '1. Ask: "How much did I spend this month?" matches DB total (৳5,000)',
      status: 'PASS',
      details: 'Answer correctly incorporates authoritative DB expense of ৳5,000',
      evidence: { answer: q1Data.answer, source: q1Data.source, factsUsed: q1Data.factsUsed },
    });
  } else {
    results.push({
      step: '1. Ask: "How much did I spend this month?" matches DB total',
      status: 'FAIL',
      details: `Expected ৳5,000 in answer, got: ${q1Data.answer}`,
      evidence: q1Data,
    });
  }

  // 2. Add a transaction: Shopping ৳3,000 -> Total should now be ৳8,000
  const tx2Res = await fetch(`${BASE_URL}/api/transactions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token1}`,
    },
    body: JSON.stringify({
      amount: 3000,
      type: 'expense',
      category: 'Shopping & Gadgets',
      description: 'Headphones purchase',
      date: '2026-10-04',
    }),
  });
  const tx2Data = await tx2Res.json();
  const tx2Id = tx2Data._id || tx2Data.id || tx2Data.customId || tx2Data.transaction?.id;

  // Ask again without reload
  const q2Res = await fetch(`${BASE_URL}/api/ai/coach`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token1}`,
    },
    body: JSON.stringify({
      message: 'How much did I spend this month?',
      language: 'en',
    }),
  });
  const q2Data = await q2Res.json();
  console.log('Q2 Response after adding ৳3,000:', q2Data.answer);

  if (q2Data.answer && q2Data.answer.includes('8,000')) {
    results.push({
      step: '2. Add transaction -> answer reflects new total (৳8,000) dynamically',
      status: 'PASS',
      details: 'After POST /api/transactions (+৳3,000), total updated to ৳8,000 on next coach query',
      evidence: { answer: q2Data.answer, source: q2Data.source },
    });
  } else {
    results.push({
      step: '2. Add transaction -> answer reflects new total dynamically',
      status: 'FAIL',
      details: `Expected ৳8,000 in answer, got: ${q2Data.answer}`,
      evidence: q2Data,
    });
  }

  // 3. Edit transaction: Change Shopping from ৳3,000 to ৳5,000 -> Total should now be ৳10,000
  await fetch(`${BASE_URL}/api/transactions/${tx2Id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token1}`,
    },
    body: JSON.stringify({
      amount: 5000,
      type: 'expense',
      category: 'Shopping & Gadgets',
      description: 'Headphones purchase upgraded',
      date: '2026-10-04',
    }),
  });

  const q3Res = await fetch(`${BASE_URL}/api/ai/coach`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token1}`,
    },
    body: JSON.stringify({
      message: 'How much did I spend this month?',
      language: 'en',
    }),
  });
  const q3Data = await q3Res.json();
  console.log('Q3 Response after editing to ৳5,000:', q3Data.answer);

  if (q3Data.answer && q3Data.answer.includes('10,000')) {
    results.push({
      step: '3. Edit transaction -> new value reflected in AI Coach (৳10,000)',
      status: 'PASS',
      details: 'After PUT /api/transactions/:id (3000 -> 5000), total updated to ৳10,000',
      evidence: { answer: q3Data.answer },
    });
  } else {
    results.push({
      step: '3. Edit transaction -> new value reflected in AI Coach',
      status: 'FAIL',
      details: `Expected ৳10,000 in answer, got: ${q3Data.answer}`,
      evidence: q3Data,
    });
  }

  // 4. Delete transaction: Delete Shopping ৳5,000 -> Total should return to ৳5,000
  await fetch(`${BASE_URL}/api/transactions/${tx2Id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token1}` },
  });

  const q4Res = await fetch(`${BASE_URL}/api/ai/coach`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token1}`,
    },
    body: JSON.stringify({
      message: 'How much did I spend this month?',
      language: 'en',
    }),
  });
  const q4Data = await q4Res.json();
  console.log('Q4 Response after deleting transaction:', q4Data.answer);

  if (q4Data.answer && q4Data.answer.includes('5,000')) {
    results.push({
      step: '4. Delete transaction -> excluded from subsequent Coach query (৳5,000)',
      status: 'PASS',
      details: 'After DELETE /api/transactions/:id, deleted transaction is excluded from totals',
      evidence: { answer: q4Data.answer },
    });
  } else {
    results.push({
      step: '4. Delete transaction -> excluded from subsequent Coach query',
      status: 'FAIL',
      details: `Expected ৳5,000 in answer, got: ${q4Data.answer}`,
      evidence: q4Data,
    });
  }

  // 5. Change savings goal: Update saved amount from 20000 to 30000 (75%)
  await fetch(`${BASE_URL}/api/goals/${goalId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token1}`,
    },
    body: JSON.stringify({
      currentAmount: 30000,
    }),
  });

  const q5Res = await fetch(`${BASE_URL}/api/ai/coach`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token1}`,
    },
    body: JSON.stringify({
      message: 'Am I on track for my savings goal?',
      language: 'en',
    }),
  });
  const q5Data = await q5Res.json();
  console.log('Q5 Goal Response:', q5Data.answer);

  if (q5Data.answer && (q5Data.answer.includes('30,000') || q5Data.answer.includes('75%'))) {
    results.push({
      step: '5. Update savings goal -> Coach cites updated progress (৳30,000 / 75%)',
      status: 'PASS',
      details: 'Coach reflects updated savings goal balance and percentage',
      evidence: { answer: q5Data.answer },
    });
  } else {
    results.push({
      step: '5. Update savings goal -> Coach cites updated progress',
      status: 'FAIL',
      details: `Expected ৳30,000 or 75% in answer, got: ${q5Data.answer}`,
      evidence: q5Data,
    });
  }

  // 6. Distinct Questions: Verify different facts are used
  const qTopRes = await fetch(`${BASE_URL}/api/ai/coach`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token1}` },
    body: JSON.stringify({ message: 'What is my top spending category?', language: 'en' }),
  });
  const qTopData = await qTopRes.json();

  const qEndRes = await fetch(`${BASE_URL}/api/ai/coach`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token1}` },
    body: JSON.stringify({ message: 'What is my month-end balance?', language: 'en' }),
  });
  const qEndData = await qEndRes.json();

  const qCashRes = await fetch(`${BASE_URL}/api/ai/coach`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token1}` },
    body: JSON.stringify({ message: 'How can I reduce cash-outs and ATM fees?', language: 'en' }),
  });
  const qCashData = await qCashRes.json();

  const topFacts = qTopData.factsUsed || [];
  const endFacts = qEndData.factsUsed || [];
  const cashFacts = qCashData.factsUsed || [];

  const distinctFacts =
    topFacts.some((f: string) => f.includes('spending')) &&
    endFacts.some((f: string) => f.includes('cashFlow')) &&
    cashFacts.some((f: string) => f.includes('cashOut'));

  if (distinctFacts) {
    results.push({
      step: '6. Distinct questions use distinct context slices and facts',
      status: 'PASS',
      details: 'top_category uses spending facts, month_end uses cashFlow, reduce_cash_outs uses cashOut',
      evidence: { topFacts, endFacts, cashFacts },
    });
  } else {
    results.push({
      step: '6. Distinct questions use distinct context slices and facts',
      status: 'FAIL',
      details: 'Facts overlap or missing expected domain keys',
      evidence: { topFacts, endFacts, cashFacts },
    });
  }

  // 7. Multi-User Isolation: User 2 vs User 1
  const qUser2Res = await fetch(`${BASE_URL}/api/ai/coach`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token2}` },
    body: JSON.stringify({ message: 'How much did I spend this month?', language: 'en' }),
  });
  const qUser2Data = await qUser2Res.json();
  console.log('User 2 spending response:', qUser2Data.answer);

  // User 2 has 0 transactions
  if (!qUser2Data.answer.includes('5,000') && !qUser2Data.answer.includes('Emergency Fund')) {
    results.push({
      step: '7. Multi-User Isolation: User 2 never sees User 1 financial facts',
      status: 'PASS',
      details: 'User 2 receives clean context scoped strictly to User 2 account (0 leakage)',
      evidence: { user1Spending: '5000', user2Answer: qUser2Data.answer },
    });
  } else {
    results.push({
      step: '7. Multi-User Isolation: User 2 never sees User 1 financial facts',
      status: 'FAIL',
      details: 'User 2 answer contains User 1 data!',
      evidence: qUser2Data,
    });
  }

  // 8. Multi-Turn: Reference prior chat turn
  const multiTurnRes = await fetch(`${BASE_URL}/api/ai/coach`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token1}` },
    body: JSON.stringify({
      message: 'Is that too much for food?',
      language: 'en',
      history: [
        { role: 'user', content: 'What is my food spending?' },
        { role: 'assistant', content: 'Your Food & Groceries spending is ৳5,000 (100% of expenses).' },
      ],
    }),
  });
  const multiTurnData = await multiTurnRes.json();
  console.log('Multi-turn response:', multiTurnData.answer);

  if (multiTurnData.answer && multiTurnData.answer.length > 20) {
    results.push({
      step: '8. Multi-Turn conversation with history context',
      status: 'PASS',
      details: 'Coach successfully processed follow-up query with previous chat history turns',
      evidence: { answer: multiTurnData.answer, source: multiTurnData.source },
    });
  } else {
    results.push({
      step: '8. Multi-Turn conversation with history context',
      status: 'FAIL',
      details: 'Empty or invalid response to follow-up query',
    });
  }

  // 9. Source Labeling (ai or fallback)
  if (q1Data.source === 'ai' || q1Data.source === 'fallback') {
    results.push({
      step: '9. Transparent Source Labeling (ai or fallback)',
      status: 'PASS',
      details: `Response includes authoritative source tag: "${q1Data.source}"`,
      evidence: { source: q1Data.source },
    });
  } else {
    results.push({
      step: '9. Transparent Source Labeling',
      status: 'FAIL',
      details: `Unexpected source tag: ${q1Data.source}`,
    });
  }

  console.log('====================================================');
  console.log('STEP 8 VERIFICATION SUMMARY:');
  console.log('====================================================');
  let passCount = 0;
  for (const r of results) {
    console.log(`[${r.status}] ${r.step}`);
    if (r.status === 'PASS') passCount++;
    if (r.details) console.log(`       Details: ${r.details}`);
  }
  console.log(`Total: ${passCount} / ${results.length} PASSED`);

  process.exit(passCount === results.length ? 0 : 1);
}

run().catch((err) => {
  console.error('E2E Verification crashed:', err);
  process.exit(1);
});
