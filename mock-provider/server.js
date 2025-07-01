const express = require('express');
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 4000;

// Configuration for different failure modes
const config = {
  // Rate limiting
  tps: parseInt(process.env.TPS) || 2,
  burstSize: parseInt(process.env.BURST_SIZE) || 5,
  
  // Latency simulation
  minLatency: parseInt(process.env.MIN_LATENCY) || 200,
  maxLatency: parseInt(process.env.MAX_LATENCY) || 800,
  
  // Failure simulation
  transientFailureRate: parseFloat(process.env.TRANSIENT_FAILURE_RATE) || 0.2,
  permanentFailureRate: parseFloat(process.env.PERMANENT_FAILURE_RATE) || 0.05,
  timeoutRate: parseFloat(process.env.TIMEOUT_RATE) || 0.1,
  
  // Timeout simulation
  timeoutDuration: parseInt(process.env.TIMEOUT_DURATION) || 10000,
  
  // Circuit breaker simulation
  circuitBreakerEnabled: process.env.CIRCUIT_BREAKER === 'true',
  circuitBreakerThreshold: parseInt(process.env.CIRCUIT_BREAKER_THRESHOLD) || 5,
  circuitBreakerTimeout: parseInt(process.env.CIRCUIT_BREAKER_TIMEOUT) || 30000
};

// Token bucket for rate limiting
let tokens = config.burstSize;
let lastRefill = Date.now();

// Circuit breaker state
let circuitBreaker = {
  failures: 0,
  lastFailure: 0,
  state: 'CLOSED' // CLOSED, OPEN, HALF_OPEN
};

// Metrics tracking
let metrics = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  rateLimitedRequests: 0,
  timeoutRequests: 0,
  circuitBreakerTrips: 0,
  averageLatency: 0,
  startTime: Date.now()
};

// Refill tokens based on TPS
setInterval(() => {
  const now = Date.now();
  const timePassed = (now - lastRefill) / 1000;
  const tokensToAdd = timePassed * config.tps;
  
  tokens = Math.min(tokens + tokensToAdd, config.burstSize);
  lastRefill = now;
}, 100);

// Circuit breaker logic
function checkCircuitBreaker() {
  const now = Date.now();
  
  if (circuitBreaker.state === 'OPEN') {
    if (now - circuitBreaker.lastFailure > config.circuitBreakerTimeout) {
      circuitBreaker.state = 'HALF_OPEN';
      console.log('Circuit breaker: HALF_OPEN');
    } else {
      return false; // Circuit is open, reject request
    }
  }
  
  return true;
}

function updateCircuitBreaker(success) {
  if (!config.circuitBreakerEnabled) return;
  
  if (success) {
    if (circuitBreaker.state === 'HALF_OPEN') {
      circuitBreaker.state = 'CLOSED';
      circuitBreaker.failures = 0;
      console.log('Circuit breaker: CLOSED');
    }
  } else {
    circuitBreaker.failures++;
    circuitBreaker.lastFailure = Date.now();
    
    if (circuitBreaker.failures >= config.circuitBreakerThreshold) {
      circuitBreaker.state = 'OPEN';
      metrics.circuitBreakerTrips++;
      console.log('Circuit breaker: OPEN');
    }
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  const uptime = Date.now() - metrics.startTime;
  const successRate = metrics.totalRequests > 0 ? 
    (metrics.successfulRequests / metrics.totalRequests * 100).toFixed(2) : 0;
  
  res.json({
    status: 'healthy',
    uptime: `${Math.floor(uptime / 1000)}s`,
    circuitBreaker: {
      state: circuitBreaker.state,
      failures: circuitBreaker.failures,
      threshold: config.circuitBreakerThreshold
    },
    rateLimiter: {
      availableTokens: Math.floor(tokens),
      tps: config.tps,
      burstSize: config.burstSize
    },
    metrics: {
      totalRequests: metrics.totalRequests,
      successRate: `${successRate}%`,
      averageLatency: `${Math.round(metrics.averageLatency)}ms`
    },
    config: {
      tps: config.tps,
      transientFailureRate: config.transientFailureRate,
      permanentFailureRate: config.permanentFailureRate,
      timeoutRate: config.timeoutRate
    }
  });
});

// Metrics endpoint
app.get('/metrics', (req, res) => {
  res.json({
    ...metrics,
    circuitBreaker,
    rateLimiter: {
      availableTokens: Math.floor(tokens),
      tps: config.tps
    }
  });
});

// Configuration endpoint
app.get('/config', (req, res) => {
  res.json(config);
});

// Main payment endpoint
app.post('/pay', async (req, res) => {
  const startTime = Date.now();
  metrics.totalRequests++;
  
  // Check circuit breaker
  if (!checkCircuitBreaker()) {
    metrics.failedRequests++;
    return res.status(503).json({ 
      error: 'Service temporarily unavailable (circuit breaker open)',
      circuitBreakerState: circuitBreaker.state
    });
  }
  
  // Enforce rate limiting
  if (tokens < 1) {
    metrics.rateLimitedRequests++;
    return res.status(429).json({ 
      error: `Rate limit exceeded (${config.tps} TPS)`,
      retryAfter: Math.ceil(1 / config.tps * 1000)
    });
  }
  
  tokens--;
  
  // Simulate latency
  const latency = config.minLatency + Math.random() * (config.maxLatency - config.minLatency);
  
  // Simulate timeout
  if (Math.random() < config.timeoutRate) {
    await new Promise(resolve => setTimeout(resolve, config.timeoutDuration));
    metrics.timeoutRequests++;
    updateCircuitBreaker(false);
    return res.status(408).json({ error: 'Request timeout' });
  }
  
  // Simulate permanent failure
  if (Math.random() < config.permanentFailureRate) {
    await new Promise(resolve => setTimeout(resolve, latency));
    metrics.failedRequests++;
    updateCircuitBreaker(false);
    return res.status(500).json({ error: 'Internal server error' });
  }
  
  // Simulate transient failure
  if (Math.random() < config.transientFailureRate) {
    await new Promise(resolve => setTimeout(resolve, latency));
    metrics.failedRequests++;
    updateCircuitBreaker(false);
    return res.status(503).json({ 
      error: 'Transient provider error',
      retryable: true
    });
  }
  
  // Successful response
  await new Promise(resolve => setTimeout(resolve, latency));
  
  const responseTime = Date.now() - startTime;
  metrics.averageLatency = (metrics.averageLatency * (metrics.successfulRequests) + responseTime) / (metrics.successfulRequests + 1);
  metrics.successfulRequests++;
  
  updateCircuitBreaker(true);
  
  res.json({
    status: 'success',
    providerId: Math.random().toString(36).slice(2),
    transactionId: `txn_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    amount: req.body.amount,
    processedAt: new Date().toISOString(),
    latency: responseTime
  });
});

// Reset metrics endpoint (for testing)
app.post('/reset', (req, res) => {
  metrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    rateLimitedRequests: 0,
    timeoutRequests: 0,
    circuitBreakerTrips: 0,
    averageLatency: 0,
    startTime: Date.now()
  };
  
  circuitBreaker = {
    failures: 0,
    lastFailure: 0,
    state: 'CLOSED'
  };
  
  tokens = config.burstSize;
  
  res.json({ message: 'Metrics and circuit breaker reset' });
});

app.listen(PORT, () => {
  console.log(`🚀 Enhanced Mock Payment Provider running on port ${PORT}`);
  console.log(`📊 Configuration:`);
  console.log(`   - TPS: ${config.tps}`);
  console.log(`   - Transient Failure Rate: ${config.transientFailureRate * 100}%`);
  console.log(`   - Permanent Failure Rate: ${config.permanentFailureRate * 100}%`);
  console.log(`   - Timeout Rate: ${config.timeoutRate * 100}%`);
  console.log(`   - Circuit Breaker: ${config.circuitBreakerEnabled ? 'Enabled' : 'Disabled'}`);
  console.log(`🔗 Endpoints:`);
  console.log(`   - POST /pay - Process payment`);
  console.log(`   - GET /health - Health check`);
  console.log(`   - GET /metrics - Detailed metrics`);
  console.log(`   - GET /config - Current configuration`);
  console.log(`   - POST /reset - Reset metrics and circuit breaker`);
}); 