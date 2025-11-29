/**
 * Rate Limiter Example Script
 * 
 * This script demonstrates how to use the rate limiter API.
 * Run with: node examples/example.js
 */

const API_BASE_URL = 'http://localhost:3001';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function makeRequest(userId, requestNumber) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/data`, {
      headers: {
        'X-User-ID': userId
      }
    });

    const data = await response.json();

    if (response.ok) {
      console.log(`✅ Request ${requestNumber} (${userId}): Success - ${data.rateLimitInfo.remaining} requests remaining`);
      return true;
    } else {
      console.log(`❌ Request ${requestNumber} (${userId}): Rate Limited - ${data.message}`);
      console.log(`   Retry after: ${data.retryAfter} seconds`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Request ${requestNumber} (${userId}): Error -`, error.message);
    return false;
  }
}

async function checkStatus(userId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/rate-limit-status?userId=${userId}`);
    const data = await response.json();
    console.log(`\n📊 Rate Limit Status for ${userId}:`);
    console.log(`   Remaining: ${data.remaining}/${data.limit}`);
    console.log(`   Reset in: ${data.resetInSeconds} seconds`);
    console.log(`   Reset time: ${data.resetTime}\n`);
  } catch (error) {
    console.error('Error checking status:', error.message);
  }
}

async function resetLimit(userId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/reset-rate-limit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-ID': userId
      },
      body: JSON.stringify({ userId })
    });
    const data = await response.json();
    console.log(`🔄 ${data.message}\n`);
  } catch (error) {
    console.error('Error resetting limit:', error.message);
  }
}

async function main() {
  console.log('🚀 Rate Limiter Example\n');
  console.log('='.repeat(50));

  const userId = 'example-user';

  // Example 1: Make 6 requests (5 should succeed, 1 should fail)
  console.log('\n📝 Example 1: Making 6 requests (limit is 5 per 60s)\n');
  
  for (let i = 1; i <= 6; i++) {
    await makeRequest(userId, i);
    await sleep(200); // Small delay between requests
  }

  // Check status
  await checkStatus(userId);

  // Example 2: Reset and try again
  console.log('📝 Example 2: Resetting limit and making requests again\n');
  await resetLimit(userId);

  for (let i = 1; i <= 3; i++) {
    await makeRequest(userId, i);
    await sleep(200);
  }

  await checkStatus(userId);

  // Example 3: Multiple users (each has separate limit)
  console.log('📝 Example 3: Testing with multiple users (separate limits)\n');
  
  const users = ['user-a', 'user-b', 'user-c'];
  
  for (const user of users) {
    console.log(`\nMaking requests as ${user}:`);
    for (let i = 1; i <= 3; i++) {
      await makeRequest(user, i);
      await sleep(100);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('✨ Example completed!');
}

// Run the example
if (typeof fetch === 'undefined') {
  console.error('This script requires Node.js 18+ with native fetch support, or install node-fetch');
  console.error('Alternatively, use the examples in the README.md');
} else {
  main().catch(console.error);
}

