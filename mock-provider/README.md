# Enhanced Mock Payment Provider

A sophisticated mock external payment provider designed to test the resilience of payment gateway systems. This provider simulates real-world conditions including rate limiting, latency, transient failures, timeouts, and circuit breaker patterns.

## 🚀 Features

### Rate Limiting
- **Configurable TPS**: Default 2 transactions per second
- **Token Bucket Algorithm**: Burst handling with configurable burst size
- **429 Rate Limit Responses**: Proper HTTP status codes and retry headers

### Latency Simulation
- **Configurable Range**: Default 200-800ms
- **Realistic Distribution**: Random latency within specified bounds
- **Performance Impact**: Tests system timeout handling

### Failure Modes
- **Transient Failures**: 503 errors (default 20% rate)
- **Permanent Failures**: 500 errors (default 5% rate)
- **Timeouts**: 408 errors (default 10% rate)
- **Circuit Breaker**: Automatic failure detection and recovery

### Monitoring & Metrics
- **Real-time Metrics**: Success rates, latency, failure counts
- **Health Checks**: `/health` endpoint with detailed status
- **Circuit Breaker State**: Current state and failure counts
- **Rate Limiter Status**: Available tokens and configuration

## 📋 API Endpoints

### POST `/pay`
Process a payment request.

**Request:**
```json
{
  "amount": 100
}
```

**Success Response (200):**
```json
{
  "status": "success",
  "providerId": "abc123",
  "transactionId": "txn_1703123456789_xyz789",
  "amount": 100,
  "processedAt": "2023-12-21T10:30:45.123Z",
  "latency": 450
}
```

**Error Responses:**
- `429` - Rate limit exceeded
- `408` - Request timeout
- `500` - Internal server error
- `503` - Transient error or circuit breaker open

### GET `/health`
Get provider health status and configuration.

**Response:**
```json
{
  "status": "healthy",
  "uptime": "120s",
  "circuitBreaker": {
    "state": "CLOSED",
    "failures": 0,
    "threshold": 5
  },
  "rateLimiter": {
    "availableTokens": 2,
    "tps": 2,
    "burstSize": 5
  },
  "metrics": {
    "totalRequests": 150,
    "successRate": "75.33%",
    "averageLatency": "450ms"
  },
  "config": {
    "tps": 2,
    "transientFailureRate": 0.2,
    "permanentFailureRate": 0.05,
    "timeoutRate": 0.1
  }
}
```

### GET `/metrics`
Get detailed metrics and statistics.

### GET `/config`
Get current configuration settings.

### POST `/reset`
Reset metrics and circuit breaker state (for testing).

## 🛠️ Installation & Usage

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the provider:**
   ```bash
   npm start
   ```

3. **Run resilience tests:**
   ```bash
   npm test
   ```

### Docker Usage

1. **Build the image:**
   ```bash
   docker build -t mock-payment-provider .
   ```

2. **Run with default settings:**
   ```bash
   docker run -d -p 4000:4000 --name mock-provider mock-payment-provider
   ```

3. **Run with custom configuration:**
   ```bash
   docker run -d -p 4000:4000 \
     -e TPS=5 \
     -e TRANSIENT_FAILURE_RATE=0.3 \
     -e CIRCUIT_BREAKER=true \
     --name mock-provider-custom \
     mock-payment-provider
   ```

### Docker Compose

1. **Start default provider:**
   ```bash
   docker-compose up -d
   ```

2. **Run stress testing:**
   ```bash
   docker-compose --profile stress-test up -d
   ```

3. **Run performance testing:**
   ```bash
   docker-compose --profile performance-test up -d
   ```

4. **Run chaos testing:**
   ```bash
   docker-compose --profile chaos-test up -d
   ```

## ⚙️ Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `TPS` | 2 | Transactions per second limit |
| `BURST_SIZE` | 5 | Maximum burst size for token bucket |
| `MIN_LATENCY` | 200 | Minimum latency in milliseconds |
| `MAX_LATENCY` | 800 | Maximum latency in milliseconds |
| `TRANSIENT_FAILURE_RATE` | 0.2 | Rate of transient failures (0-1) |
| `PERMANENT_FAILURE_RATE` | 0.05 | Rate of permanent failures (0-1) |
| `TIMEOUT_RATE` | 0.1 | Rate of timeouts (0-1) |
| `TIMEOUT_DURATION` | 10000 | Timeout duration in milliseconds |
| `CIRCUIT_BREAKER` | false | Enable circuit breaker |
| `CIRCUIT_BREAKER_THRESHOLD` | 5 | Failure threshold for circuit breaker |
| `CIRCUIT_BREAKER_TIMEOUT` | 30000 | Circuit breaker timeout in milliseconds |

### Configuration Examples

#### High Reliability Provider
```bash
TPS=10
TRANSIENT_FAILURE_RATE=0.05
PERMANENT_FAILURE_RATE=0.01
TIMEOUT_RATE=0.02
CIRCUIT_BREAKER=false
```

#### Unreliable Provider (Chaos Testing)
```bash
TPS=0.5
TRANSIENT_FAILURE_RATE=0.6
PERMANENT_FAILURE_RATE=0.2
TIMEOUT_RATE=0.3
CIRCUIT_BREAKER=true
CIRCUIT_BREAKER_THRESHOLD=2
```

#### High Latency Provider
```bash
MIN_LATENCY=1000
MAX_LATENCY=5000
TIMEOUT_DURATION=20000
```

## 🧪 Testing

### Manual Testing

1. **Basic payment test:**
   ```bash
   curl -X POST http://localhost:4000/pay \
     -H "Content-Type: application/json" \
     -d '{"amount": 100}'
   ```

2. **Health check:**
   ```bash
   curl http://localhost:4000/health
   ```

3. **Get metrics:**
   ```bash
   curl http://localhost:4000/metrics
   ```

### Automated Resilience Testing

Run the comprehensive test suite:

```bash
npm test
```

This will run multiple test scenarios:
- **Normal Load Test**: Moderate load testing
- **High Load Test**: Rate limiting under high load
- **Burst Test**: Burst handling capabilities
- **Resilience Test**: System recovery after failures

### Integration with Payment Gateway

Update your payment gateway configuration to point to the mock provider:

```javascript
const providerConfig = {
  url: 'http://localhost:4000/pay',
  timeout: 15000,
  retries: 3,
  backoff: 'exponential'
};
```

## 📊 Monitoring

### Real-time Metrics
Monitor the provider's behavior in real-time:

```bash
# Watch health status
watch -n 1 'curl -s http://localhost:4000/health | jq'

# Monitor metrics
watch -n 1 'curl -s http://localhost:4000/metrics | jq'
```

### Key Metrics to Watch
- **Success Rate**: Should be > 80% for reliable providers
- **Average Latency**: Should be within acceptable bounds
- **Circuit Breaker State**: Monitor for trips and recovery
- **Rate Limiting**: Track 429 responses
- **Timeout Rate**: Should be < 5%

## 🔧 Troubleshooting

### Common Issues

1. **Provider not responding:**
   - Check if the service is running: `docker ps` or `npm start`
   - Verify port 4000 is not in use: `netstat -an | grep 4000`

2. **High failure rates:**
   - Check configuration: `curl http://localhost:4000/config`
   - Reset metrics: `curl -X POST http://localhost:4000/reset`

3. **Circuit breaker trips:**
   - Monitor circuit breaker state: `curl http://localhost:4000/health`
   - Wait for timeout or reset manually

### Logs
```bash
# Docker logs
docker logs mock-provider

# Local logs
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details. 