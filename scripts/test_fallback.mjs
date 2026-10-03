import { askFinancialCoach } from '../src/services/aiService.ts';
import { INITIAL_TRANSACTIONS } from '../src/data/mockTransactions.ts';
import { INITIAL_SAVINGS_GOALS } from '../src/data/mockGoals.ts';

// Test asking financial coach when network/server is unavailable
async function testFallbackSimulation() {
  console.log('=== TESTING DETERMINISTIC FALLBACK (GEMINI UNAVAILABLE) ===\n');

  // Question 1
  const q1 = "Why do I run short before month-end?";
  console.log(`Testing Q1: "${q1}"`);
  const res1 = await askFinancialCoach(q1, INITIAL_TRANSACTIONS, INITIAL_SAVINGS_GOALS, 38500, false);
  console.log('Source deterministic?:', res1.isDeterministic);
  console.log('Structured cards attached?:', !!res1.structuredData);
  console.log('Text snippet:\n', res1.text.substring(0, 200) + '...\n');

  // Question 2
  const q2 = "How can I save ৳5,000 more each month?";
  console.log(`Testing Q2: "${q2}"`);
  const res2 = await askFinancialCoach(q2, INITIAL_TRANSACTIONS, INITIAL_SAVINGS_GOALS, 38500, false);
  console.log('Source deterministic?:', res2.isDeterministic);
  console.log('Text snippet:\n', res2.text.substring(0, 200) + '...\n');

  // Question 6 (Bangla)
  const q6 = "আগামী মাসে আমার টাকা কত থাকতে পারে?";
  console.log(`Testing Q6 (Bangla): "${q6}"`);
  const res6 = await askFinancialCoach(q6, INITIAL_TRANSACTIONS, INITIAL_SAVINGS_GOALS, 38500, true);
  console.log('Source deterministic?:', res6.isDeterministic);
  console.log('Bangla Text snippet:\n', res6.text.substring(0, 200) + '...\n');
}

testFallbackSimulation().catch(console.error);
