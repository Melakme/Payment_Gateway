const axios = require('axios');

// Test configuration
const TEST_CONFIG = {
  baseURL: 'http://localhost:4000',
  totalRequests: 100,
  concurrentRequests: 10,
  delayBetweenBatches: 1000, // 1 second
  testScenarios: [
    {
      name: 'Normal Load Test',
      description: 'Test normal operation with moderate load',
      requests: 50,
      concurrent: 5,
      delay: 200
    },
    {
      name: 'High Load Test',
      description: 'Test rate limiting under high load',
      requests: 100,
      concurrent: 20,
      delay: 50
    },
    {
      name: 'Burst Test',
      description: 'Test burst handling',
      requests: 30,
      concurrent: 30,
      delay: 0
    },
    {
      name: 'Resilience Test',
      description: 'Test system recovery after failures',
      requests: 200,
      concurrent: 15,
      delay: 100
    }
  ]
};

// Statistics tracking
let stats = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  rateLimitedRequests: 0,
  timeoutRequests: 0,
  circuitBreakerTrips: 0,
  averageLatency: 0,
  startTime: Date.now(),
  scenarios: []
};

// Helper function to make a payment request
async function makePaymentRequest(amount = 100) {
  const startTime = Date.now();
  try {
    const response = await axios.post(`${TEST_CONFIG.baseURL}/pay`, {
      amount: amount
    }, {
      timeout: 15000 // 15 second timeout
    });
    
    const latency = Date.now() - startTime;
    return {
      success: true,
      status: response.status,
      data: response.data,
      latency: latency
    };
  } catch (error) {
    const latency = Date.now() - startTime;
    return {
      success: false,
      status: error.response?.status || 'TIMEOUT',
      error: error.response?.data?.error || error.message,
      latency: latency
    };
  }
}

// Helper function to get provider metrics
async function getMetrics() {
  try {
    const response = await axios.get(`${TEST_CONFIG.baseURL}/metrics`);
    return response.data;
  } catch (error) {
    console.error('Failed to get metrics:', error.message);
    return null;
  }
}

// Helper function to reset provider state
async function resetProvider() {
  try {
    await axios.post(`${TEST_CONFIG.baseURL}/reset`);
    console.log('✅ Provider state reset');
  } catch (error) {
    console.error('Failed to reset provider:', error.message);
  }
}

// Helper function to get provider health
async function getHealth() {
  try {
    const response = await axios.get(`${TEST_CONFIG.baseURL}/health`);
    return response.data;
  } catch (error) {
    console.error('Failed to get health:', error.message);
    return null;
  }
}

// Test scenario runner
async function runScenario(scenario) {
  console.log(`\n🧪 Running: ${scenario.name}`);
  console.log(`📝 ${scenario.description}`);
  console.log(`📊 Requests: ${scenario.requests}, Concurrent: ${scenario.concurrent}, Delay: ${scenario.delay}ms`);
  
  const scenarioStats = {
    name: scenario.name,
    requests: scenario.requests,
    successful: 0,
    failed: 0,
    rateLimited: 0,
    timeouts: 0,
    averageLatency: 0,
    startTime: Date.now()
  };
  
  const batches = Math.ceil(scenario.requests / scenario.concurrent);
  
  for (let batch = 0; batch < batches; batch++) {
    const batchSize = Math.min(scenario.concurrent, scenario.requests - batch * scenario.concurrent);
    const promises = [];
    
    for (let i = 0; i < batchSize; i++) {
      promises.push(makePaymentRequest(100 + Math.random() * 900));
    }
    
    const results = await Promise.all(promises);
    
    results.forEach(result => {
      scenarioStats.successful += result.success ? 1 : 0;
      scenarioStats.failed += !result.success ? 1 : 0;
      
      if (!result.success) {
        if (result.status === 429) scenarioStats.rateLimited++;
        else if (result.status === 408) scenarioStats.timeouts++;
      }
      
      if (result.latency) {
        scenarioStats.averageLatency = (scenarioStats.averageLatency * (scenarioStats.successful + scenarioStats.failed - 1) + result.latency) / (scenarioStats.successful + scenarioStats.failed);
      }
    });
    
    // Update global stats
    stats.totalRequests += batchSize;
    stats.successfulRequests += results.filter(r => r.success).length;
    stats.failedRequests += results.filter(r => !r.success).length;
    stats.rateLimitedRequests += results.filter(r => !r.success && r.status === 429).length;
    stats.timeoutRequests += results.filter(r => !r.success && r.status === 408).length;
    
    if (scenario.delay > 0) {
      await new Promise(resolve => setTimeout(resolve, scenario.delay));
    }
  }
  
  scenarioStats.duration = Date.now() - scenarioStats.startTime;
  scenarioStats.successRate = (scenarioStats.successful / scenarioStats.requests * 100).toFixed(2);
  
  console.log(`✅ ${scenario.name} completed:`);
  console.log(`   Success Rate: ${scenarioStats.successRate}%`);
  console.log(`   Average Latency: ${Math.round(scenarioStats.averageLatency)}ms`);
  console.log(`   Rate Limited: ${scenarioStats.rateLimited}`);
  console.log(`   Timeouts: ${scenarioStats.timeouts}`);
  console.log(`   Duration: ${scenarioStats.duration}ms`);
  
  stats.scenarios.push(scenarioStats);
  
  return scenarioStats;
}

// Main test runner
async function runResilienceTests() {
  console.log('🚀 Starting Payment Gateway Resilience Tests');
  console.log('=' .repeat(60));
  
  // Check if provider is running
  const health = await getHealth();
  if (!health) {
    console.error('❌ Mock provider is not running. Please start it first.');
    return;
  }
  
  console.log('✅ Mock provider is running');
  console.log(`📊 Provider Configuration:`);
  console.log(`   TPS: ${health.config.tps}`);
  console.log(`   Transient Failure Rate: ${health.config.transientFailureRate * 100}%`);
  console.log(`   Permanent Failure Rate: ${health.config.permanentFailureRate * 100}%`);
  console.log(`   Timeout Rate: ${health.config.timeoutRate * 100}%`);
  
  // Reset provider state before testing
  await resetProvider();
  
  // Run all test scenarios
  for (const scenario of TEST_CONFIG.testScenarios) {
    await runScenario(scenario);
    
    // Get provider metrics after each scenario
    const metrics = await getMetrics();
    if (metrics) {
      console.log(`📈 Provider Metrics:`);
      console.log(`   Circuit Breaker State: ${metrics.circuitBreaker.state}`);
      console.log(`   Circuit Breaker Trips: ${metrics.circuitBreakerTrips}`);
      console.log(`   Available Tokens: ${metrics.rateLimiter.availableTokens}`);
    }
    
    // Wait between scenarios
    if (scenario !== TEST_CONFIG.testScenarios[TEST_CONFIG.testScenarios.length - 1]) {
      console.log('\n⏳ Waiting 3 seconds before next scenario...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  // Final summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 FINAL TEST SUMMARY');
  console.log('='.repeat(60));
  
  const totalDuration = Date.now() - stats.startTime;
  const overallSuccessRate = (stats.successfulRequests / stats.totalRequests * 100).toFixed(2);
  
  console.log(`Total Requests: ${stats.totalRequests}`);
  console.log(`Successful: ${stats.successfulRequests} (${overallSuccessRate}%)`);
  console.log(`Failed: ${stats.failedRequests}`);
  console.log(`Rate Limited: ${stats.rateLimitedRequests}`);
  console.log(`Timeouts: ${stats.timeoutRequests}`);
  console.log(`Circuit Breaker Trips: ${stats.circuitBreakerTrips}`);
  console.log(`Total Duration: ${totalDuration}ms`);
  console.log(`Average RPS: ${(stats.totalRequests / (totalDuration / 1000)).toFixed(2)}`);
  
  console.log('\n📋 Scenario Breakdown:');
  stats.scenarios.forEach(scenario => {
    console.log(`   ${scenario.name}: ${scenario.successRate}% success, ${Math.round(scenario.averageLatency)}ms avg latency`);
  });
  
  // Recommendations
  console.log('\n💡 Recommendations:');
  if (stats.rateLimitedRequests > stats.totalRequests * 0.1) {
    console.log('   ⚠️  High rate limiting detected - consider increasing TPS or implementing better rate limiting');
  }
  if (stats.timeoutRequests > stats.totalRequests * 0.05) {
    console.log('   ⚠️  High timeout rate detected - consider increasing timeout thresholds');
  }
  if (stats.circuitBreakerTrips > 0) {
    console.log('   ⚠️  Circuit breaker trips detected - system is experiencing failures');
  }
  if (overallSuccessRate > 80) {
    console.log('   ✅ Good resilience - system handles failures well');
  } else {
    console.log('   ❌ Poor resilience - system needs improvement');
  }
}

// Run the tests
if (require.main === module) {
  runResilienceTests().catch(console.error);
}

module.exports = {
  runResilienceTests,
  makePaymentRequest,
  getMetrics,
  resetProvider,
  getHealth
}; 