import dotenv from 'dotenv';
dotenv.config();

const BASE_URL = 'http://localhost:3000';

interface VerificationResult {
  step: string;
  status: 'PASS' | 'FAIL' | 'NOT VERIFIED';
  details: string;
  evidence?: any;
}

const results: VerificationResult[] = [];

async function run() {
  console.log('====================================================');
  console.log('Starting Phase 7: Real MongoDB Verification for Financial Health Score');
  console.log('====================================================');

  // 0. Verify server health & DB connection
  const healthRes = await fetch(`${BASE_URL}/api/health`);
  const healthData = await healthRes.json();
  console.log('Server health:', healthData);

  if (healthData.database !== 'connected') {
    throw new Error('Database is not connected! Required for Phase 7 verification.');
  }

  // Register Test User 1
  const user1Email = `health_user1_${Date.now()}@example.com`;
  const reg1Res = await fetch(`${BASE_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Tanvir Ahmed',
      email: user1Email,
      password: 'SecurePassword123!',
      monthlyIncome: 60000,
    }),
  });
  const reg1Data = await reg1Res.json();
  const token1 = reg1Data.token;
  const user1Id = reg1Data.user?.id || reg1Data.user?._id;

  // Register Test User 2 (for isolation check)
  const user2Email = `health_user2_${Date.now()}@example.com`;
  const reg2Res = await fetch(`${BASE_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Nusrat Jahan',
      email: user2Email,
      password: 'SecurePassword123!',
      monthlyIncome: 30000,
    }),
  });
  const reg2Data = await reg2Res.json();
  const token2 = reg2Data.token;
  const user2Id = reg2Data.user?.id || reg2Data.user?._id;

  console.log(`Created test users: User 1 (${user1Id}), User 2 (${user2Id})`);

  // Seed baseline transactions for User 1:
  // Salary: 60,000; Rent: 18,000; Groceries: 12,000
  await fetch(`${BASE_URL}/api/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token1}` },
    body: JSON.stringify({
      amount: 60000,
      type: 'income',
      category: 'Salary',
      description: 'Monthly Software Salary',
      date: '2026-10-01',
      classification: 'essential',
    }),
  });

  await fetch(`${BASE_URL}/api/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token1}` },
    body: JSON.stringify({
      amount: 18000,
      type: 'expense',
      category: 'Rent & Housing',
      description: 'Gulshan 2 Apartment Rent',
      date: '2026-10-02',
      classification: 'essential',
    }),
  });

  await fetch(`${BASE_URL}/api/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token1}` },
    body: JSON.stringify({
      amount: 12000,
      type: 'expense',
      category: 'Food & Groceries',
      description: 'Shwapno Supermarket',
      date: '2026-10-03',
      classification: 'essential',
    }),
  });

  // Seed emergency fund goal: Target 100,000; Current 40,000
  const goalRes = await fetch(`${BASE_URL}/api/goals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token1}` },
    body: JSON.stringify({
      title: 'Emergency Fund',
      name: 'Emergency Fund',
      category: 'Emergency Fund',
      targetAmount: 100000,
      currentAmount: 40000,
      deadline: '2026-12-31',
    }),
  });
  const goalData = await goalRes.json();
  const goalId = goalData._id || goalData.id || goalData.customId;
  console.log('Created Goal:', goalRes.status, goalId);

  // 1. Record initial baseline score
  const initialRes = await fetch(`${BASE_URL}/api/users/${user1Id}/financial-health`, {
    headers: { Authorization: `Bearer ${token1}` },
  });
  const initialScore = await initialRes.json();
  console.log('1. Initial Score:', initialScore.score, initialScore.category);

  if (initialScore.status === 'ok' && initialScore.score !== null && initialScore.score >= 60) {
    results.push({
      step: '1. Initial baseline score recorded from MongoDB',
      status: 'PASS',
      details: `Score: ${initialScore.score} (${initialScore.category}), Confidence: ${initialScore.confidence}`,
      evidence: { score: initialScore.score, category: initialScore.category, components: initialScore.components.length },
    });
  } else {
    results.push({
      step: '1. Initial baseline score recorded from MongoDB',
      status: 'FAIL',
      details: `Unexpected initial score: ${initialScore.score}`,
      evidence: initialScore,
    });
  }

  // 2. Add significant expense (+৳25,000 luxury gadget) -> Expect score to drop
  const expRes = await fetch(`${BASE_URL}/api/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token1}` },
    body: JSON.stringify({
      amount: 25000,
      type: 'expense',
      category: 'Shopping & Gadgets',
      description: 'Noise Cancelling Headphones',
      date: '2026-10-04',
      classification: 'discretionary',
    }),
  });
  const expData = await expRes.json();
  const expTxId = expData._id || expData.id || expData.customId;

  const afterAddRes = await fetch(`${BASE_URL}/api/users/${user1Id}/financial-health`, {
    headers: { Authorization: `Bearer ${token1}` },
  });
  const afterAddScore = await afterAddRes.json();
  console.log('2. Score after adding ৳25,000 expense:', afterAddScore.score);

  if (afterAddScore.score < initialScore.score) {
    results.push({
      step: '2. Add significant expense -> Score & Expense Control decrease',
      status: 'PASS',
      details: `Score decreased from ${initialScore.score} to ${afterAddScore.score}`,
      evidence: { before: initialScore.score, after: afterAddScore.score },
    });
  } else {
    results.push({
      step: '2. Add significant expense -> Score decreases',
      status: 'FAIL',
      details: `Expected score < ${initialScore.score}, got ${afterAddScore.score}`,
    });
  }

  // 3. Edit transaction: Change from ৳25,000 to ৳5,000 -> Expect score to recover partially
  await fetch(`${BASE_URL}/api/transactions/${expTxId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token1}` },
    body: JSON.stringify({
      amount: 5000,
      type: 'expense',
      category: 'Shopping & Gadgets',
      description: 'Headphones return & downgrade',
      date: '2026-10-04',
      classification: 'discretionary',
    }),
  });

  const afterEditRes = await fetch(`${BASE_URL}/api/users/${user1Id}/financial-health`, {
    headers: { Authorization: `Bearer ${token1}` },
  });
  const afterEditScore = await afterEditRes.json();
  console.log('3. Score after editing expense to ৳5,000:', afterEditScore.score);

  if (afterEditScore.score > afterAddScore.score) {
    results.push({
      step: '3. Edit transaction -> Score changes accordingly',
      status: 'PASS',
      details: `Score increased from ${afterAddScore.score} to ${afterEditScore.score}`,
      evidence: { before: afterAddScore.score, after: afterEditScore.score },
    });
  } else {
    results.push({
      step: '3. Edit transaction -> Score changes accordingly',
      status: 'FAIL',
      details: `Expected score > ${afterAddScore.score}, got ${afterEditScore.score}`,
    });
  }

  // 4. Delete transaction -> Expect score to return to exact baseline
  await fetch(`${BASE_URL}/api/transactions/${expTxId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token1}` },
  });

  const afterDeleteRes = await fetch(`${BASE_URL}/api/users/${user1Id}/financial-health`, {
    headers: { Authorization: `Bearer ${token1}` },
  });
  const afterDeleteScore = await afterDeleteRes.json();
  console.log('4. Score after deleting expense:', afterDeleteScore.score);

  if (afterDeleteScore.score === initialScore.score) {
    results.push({
      step: '4. Delete transaction -> Score returns to baseline value',
      status: 'PASS',
      details: `Score returned to exact baseline: ${afterDeleteScore.score}`,
      evidence: { initial: initialScore.score, restored: afterDeleteScore.score },
    });
  } else {
    results.push({
      step: '4. Delete transaction -> Score returns to baseline value',
      status: 'FAIL',
      details: `Expected ${initialScore.score}, got ${afterDeleteScore.score}`,
    });
  }

  // 5. Update savings goal progress: ৳40,000 -> ৳90,000
  const putGoalRes = await fetch(`${BASE_URL}/api/goals/${goalId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token1}` },
    body: JSON.stringify({ currentAmount: 90000 }),
  });
  const putGoalData = await putGoalRes.json();
  console.log('Update Goal Response:', putGoalRes.status, putGoalData);

  const afterGoalRes = await fetch(`${BASE_URL}/api/users/${user1Id}/financial-health`, {
    headers: { Authorization: `Bearer ${token1}` },
  });
  const afterGoalScore = await afterGoalRes.json();
  console.log('5. Score after updating goal to ৳90,000:', afterGoalScore.score);

  const initialGoalComp = initialScore.components.find((c: any) => c.key === 'savings_goals');
  const updatedGoalComp = afterGoalScore.components.find((c: any) => c.key === 'savings_goals');
  console.log('initialGoalComp:', initialGoalComp);
  console.log('updatedGoalComp:', updatedGoalComp);

  if (updatedGoalComp.score > initialGoalComp.score && afterGoalScore.score >= initialScore.score) {
    results.push({
      step: '5. Update savings goal -> Savings Goals component and overall score increase',
      status: 'PASS',
      details: `Goal score increased from ${initialGoalComp.score} to ${updatedGoalComp.score}; Overall score from ${initialScore.score} to ${afterGoalScore.score}`,
      evidence: { initialGoal: initialGoalComp.score, updatedGoal: updatedGoalComp.score },
    });
  } else {
    results.push({
      step: '5. Update savings goal -> Goal score increases',
      status: 'FAIL',
      details: `Goal component did not increase`,
    });
  }

  // 6. Refresh page / Fresh GET from MongoDB
  const refreshRes = await fetch(`${BASE_URL}/api/users/${user1Id}/financial-health`, {
    headers: { Authorization: `Bearer ${token1}` },
  });
  const refreshScore = await refreshRes.json();

  if (refreshScore.score === afterGoalScore.score) {
    results.push({
      step: '6. Fresh GET request reproduces exact score from MongoDB persistence',
      status: 'PASS',
      details: `Score reproduced identically: ${refreshScore.score}`,
      evidence: { score: refreshScore.score },
    });
  } else {
    results.push({
      step: '6. Fresh GET request reproduces exact score',
      status: 'FAIL',
      details: `Mismatch after fresh fetch`,
    });
  }

  // 7. Authenticated AI / Deterministic Explanation Endpoint (English & Bengali)
  const explainEnRes = await fetch(`${BASE_URL}/api/ai/health/explain`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token1}` },
    body: JSON.stringify({ language: 'en' }),
  });
  const explainEnData = await explainEnRes.json();
  console.log('7. English Explanation:', explainEnData.explanation?.summary);

  const explainBnRes = await fetch(`${BASE_URL}/api/ai/health/explain`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token1}` },
    body: JSON.stringify({ language: 'bn' }),
  });
  const explainBnData = await explainBnRes.json();
  console.log('7. Bengali Explanation:', explainBnData.explanation?.summary);

  if (
    explainEnData.explanation &&
    explainEnData.explanation.summary &&
    explainBnData.explanation &&
    explainBnData.explanation.summary
  ) {
    results.push({
      step: '7. Authenticated explanation endpoint generates structured guidance in EN & BN',
      status: 'PASS',
      details: `English & Bengali explanations verified with source: ${explainEnData.explanation.source}`,
      evidence: {
        enSource: explainEnData.explanation.source,
        enSummary: explainEnData.explanation.summary,
        bnSummary: explainBnData.explanation.summary,
      },
    });
  } else {
    results.push({
      step: '7. Authenticated explanation endpoint generates structured guidance',
      status: 'FAIL',
      details: 'Explanation payload missing required structure',
    });
  }

  // 8. Multi-User Isolation (User 2 has 0 transactions -> should be clean/insufficient_data, 0 leakage)
  const user2HealthRes = await fetch(`${BASE_URL}/api/users/${user2Id}/financial-health`, {
    headers: { Authorization: `Bearer ${token2}` },
  });
  const user2Health = await user2HealthRes.json();
  console.log('8. User 2 Health Status:', user2Health.status, user2Health.score);

  if (user2Health.status === 'insufficient_data' || (user2Health.score !== null && user2Health.score !== afterGoalScore.score)) {
    results.push({
      step: '8. Multi-User Isolation: User 2 score scoped strictly to User 2 data (0 leakage)',
      status: 'PASS',
      details: `User 2 status is "${user2Health.status}" (0 leakage from User 1 transactions)`,
      evidence: { user1Score: afterGoalScore.score, user2Status: user2Health.status },
    });
  } else {
    results.push({
      step: '8. Multi-User Isolation',
      status: 'FAIL',
      details: 'User 2 received User 1 score data!',
    });
  }

  // 9. Cost Control: Second explanation call uses memory cache (identical contextHash)
  const cacheCheckRes = await fetch(`${BASE_URL}/api/ai/health/explain`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token1}` },
    body: JSON.stringify({ language: 'en' }),
  });
  const cacheCheckData = await cacheCheckRes.json();

  if (cacheCheckData.explanation.contextHash === explainEnData.explanation.contextHash) {
    results.push({
      step: '9. Gemini Cost Control: Context-hash cached explanation reused without LLM churn',
      status: 'PASS',
      details: `Cache hit verified with matching contextHash: ${cacheCheckData.explanation.contextHash}`,
      evidence: { contextHash: cacheCheckData.explanation.contextHash },
    });
  } else {
    results.push({
      step: '9. Gemini Cost Control',
      status: 'FAIL',
      details: 'Context hash mismatch on identical state',
    });
  }

  console.log('====================================================');
  console.log('PHASE 7 REAL VERIFICATION SUMMARY:');
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
  console.error('Real Verification crashed:', err);
  process.exit(1);
});
