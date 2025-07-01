# Payment Gateway System

A production-ready payment gateway system with enterprise-grade features including rate limiting, idempotency, intelligent retries, and extensible provider architecture.

## 🚀 Features

- **Secure Payment Processing**: RESTful API for payment order submission
- **2 TPS Rate Limiting**: Token bucket algorithm with global rate limiting
- **Idempotent Operations**: Duplicate detection across service restarts
- **Intelligent Retries**: Exponential backoff with configurable retry limits
- **Real-time Monitoring**: WebSocket-based status updates and metrics
- **Provider Extensibility**: Adapter pattern for multiple payment providers
- **Domain Events**: Reliable event emission for payment lifecycle
- **Durability**: At-least-once delivery guarantee
- **User Authentication**: Role-based access control (Customer/Admin)
- **Real-time Dashboard**: Live payment monitoring and system metrics
- **Product Catalog**: Browse and purchase products with quantity-based pricing
- **Shopping Cart**: Add products to cart and submit orders
- **Product Management**: Admin interface for managing products and inventory
- **Cart Integration**: Automatic payment amount calculation from cart total

## 🐳 Docker Deployment (Recommended)

The easiest way to run the payment gateway is using Docker. The application supports both development and production modes.

### Prerequisites
- Docker Desktop installed
- Docker Compose installed

### Quick Start with Docker

1. **Clone and navigate to the project:**
   ```bash
   cd paymentgateway/project
   ```

2. **Choose your mode:**

   **Development Mode (Frontend + Backend):**
   ```bash
   # Using Docker Compose
   docker-compose --profile dev up --build
   
   # Or using the provided script
   ./docker-run.sh dev          # Linux/Mac
   .\docker-run.ps1 dev         # Windows PowerShell
   ```

   **Production Mode (Optimized):**
   ```bash
   # Using Docker Compose
   docker-compose --profile prod up --build -d
   
   # Or using the provided script
   ./docker-run.sh prod         # Linux/Mac
   .\docker-run.ps1 prod        # Windows PowerShell
   ```

3. **Access the application:**

   **Development Mode:**
   - **Frontend**: http://localhost:5173
   - **Backend API**: http://localhost:3001
   - **Health Check**: http://localhost:3001/health

   **Production Mode:**
   - **Application**: http://localhost:3001
   - **Health Check**: http://localhost:3001/health

### Docker Management Scripts

For easier management, use the provided scripts:

**Linux/Mac:**
```bash
# Make script executable
chmod +x docker-run.sh

# Development mode (frontend + backend)
./docker-run.sh dev

# Production mode (optimized)
./docker-run.sh prod

# Stop containers
./docker-run.sh stop

# Clean up everything
./docker-run.sh clean
```

**Windows PowerShell:**
```powershell
# Development mode (frontend + backend)
.\docker-run.ps1 dev

# Production mode (optimized)
.\docker-run.ps1 prod

# Stop containers
.\docker-run.ps1 stop

# Clean up everything
.\docker-run.ps1 clean
```

**Available Commands:**
- `dev` - Start in development mode (frontend + backend with hot reload)
- `prod` - Start in production mode (optimized single container)
- `stop` - Stop all containers
- `clean` - Stop and remove all containers and images

### Docker Configuration

The application includes:
- **Multi-stage Dockerfile**: Optimized for both development and production
- **Development Mode**: Hot reload for both frontend and backend
- **Production Mode**: Optimized single container with built frontend
- **Health checks**: Automatic container health monitoring
- **Volume mounting**: Persistent logs and hot reload support
- **Environment variables**: Configurable settings
- **Network isolation**: Secure container networking

### Development vs Production

**Development Mode:**
- Runs both frontend (Vite dev server) and backend
- Hot reload enabled for both frontend and backend
- Source code mounted as volumes for live updates
- Separate ports: Frontend (5173), Backend (3001)
- Full development tooling available

**Production Mode:**
- Single optimized container
- Frontend built and served by backend
- No development dependencies
- Single port (3001) serving everything
- Optimized for performance and security

## 🏗️ Architecture

### Core Components

1. **PaymentGateway**: Main orchestrator handling payment processing
2. **TokenBucketRateLimiter**: Enforces global 2 TPS rate limit
3. **InMemoryStorage**: Durable storage with idempotency key management
4. **EventEmitter**: Domain event emission system
5. **MockPaymentProvider**: Extensible provider interface
6. **User Management**: Authentication and role-based access control
7. **Product Management**: Product catalog and inventory management
8. **Order Processing**: Product-based order validation and processing

### Design Patterns

- **Adapter Pattern**: Payment provider abstraction
- **Strategy Pattern**: Rate limiting algorithms
- **Observer Pattern**: Event-driven architecture
- **Queue Pattern**: Asynchronous payment processing
- **Factory Pattern**: Product creation and management

## 🔧 Technical Implementation

### Rate Limiting & Concurrency

The system uses a **Token Bucket Rate Limiter** to enforce the global 2 TPS limit:

```javascript
export class TokenBucketRateLimiter {
  constructor(capacity, refillRate) {
    this.capacity = capacity; // 2 tokens max
    this.refillRate = refillRate; // 2 tokens per second
  }
  
  tryConsume(tokensRequested = 1) {
    this.refill();
    if (this.tokens >= tokensRequested) {
      this.tokens -= tokensRequested;
      return true;
    }
    return false;
  }
}
```

**Benefits:**
- Smooth rate limiting without bursts
- Thread-safe token consumption
- Real-time token availability tracking
- Horizontal scaling support

### State Management & Durability

Payment state is managed through a robust storage layer:

```javascript
export class InMemoryStorage {
  constructor() {
    this.payments = new Map();
    this.idempotencyKeys = new Map();
  }
  
  async storePayment(payment) {
    this.payments.set(payment.id, { ...payment });
    this.idempotencyKeys.set(payment.idempotencyKey, payment.id);
  }
}
```

**Key Features:**
- Atomic operations for consistency
- Idempotency key mapping survives restarts
- Payment lifecycle state tracking
- Concurrent access protection

### Intelligent Retry Logic

The system implements sophisticated retry mechanisms:

```javascript
async handlePaymentError(paymentId, errorMessage) {
  const payment = await this.storage.getPayment(paymentId);
  payment.retryCount = (payment.retryCount || 0) + 1;
  
  const maxRetries = 3;
  const shouldRetry = payment.retryCount < maxRetries && 
                     this.isRetryableError(errorMessage);
  
  if (shouldRetry) {
    // Exponential backoff: 1s, 2s, 4s, max 30s
    const backoffDelay = Math.min(1000 * Math.pow(2, payment.retryCount - 1), 30000);
    
    setTimeout(() => {
      this.processingQueue.push(paymentId);
    }, backoffDelay);
  }
}
```

**Features:**
- Exponential backoff strategy
- Retryable vs permanent error classification
- Rate limit compliance during retries
- Configurable retry limits

### Provider Extensibility

The payment provider interface enables easy integration:

```javascript
export class MockPaymentProvider {
  async processPayment(paymentRequest) {
    // Provider-specific implementation
    return {
      success: true,
      transactionId: `txn_${Date.now()}`,
      providerName: this.name
    };
  }
}
```

**Benefits:**
- Clean separation of concerns
- Easy provider switching
- Multiple provider support
- Provider-specific error handling

## 📊 Monitoring & Observability

### Real-time Metrics

The system provides comprehensive metrics:

- **Rate Limiting**: Token availability, refill rate
- **Processing**: Queue length, success rates
- **System**: Uptime, resource usage
- **Errors**: Recent errors with context

### Domain Events

Reliable event emission for payment lifecycle:

```javascript
// Payment completed
this.eventEmitter.emit('payment.completed', payment);

// Payment failed
this.eventEmitter.emit('payment.failed', payment);

// Payment retrying
this.eventEmitter.emit('payment.retry', payment);
```

## 🚀 Getting Started

### Option 1: Docker Deployment (Recommended)

1. **Navigate to the project directory:**
   ```bash
   cd paymentgateway/project
   ```

2. **Build and run with Docker Compose:**
   ```bash
   docker-compose up --build
   ```

3. **Access the application:**
   - **Frontend**: http://localhost:3001
   - **Backend API**: http://localhost:3001/api
   - **Health Check**: http://localhost:3001/health

### Option 2: Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the backend server:**
   ```bash
   node backend/server.js
   ```

3. **Start the frontend (in a new terminal):**
   ```bash
   npm run dev:frontend
   ```

4. **Access the application:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001
   - WebSocket: ws://localhost:3001

### 🔐 User Authentication

The system includes role-based access control with two user types:

#### Test Users
- **Customer Account:**
  - Email: `customer@example.com`
  - Password: `password123`
  - Access: Payment form, payment history

- **Admin Account:**
  - Email: `admin@example.com`
  - Password: `admin123`
  - Access: All features + user management, system metrics

#### Features by Role
- **Customers**: Submit payments, view payment history, real-time status
- **Admins**: All customer features + user management, system metrics, payment analytics

## 🔗 API Endpoints

### Authentication
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "customer@example.com",
  "password": "password123"
}
```

### Submit Payment
```http
POST /api/payments
Content-Type: application/json
Authorization: Bearer <token>

{
  "amount": 10000,
  "currency": "USD",
  "customerId": "customer_123",
  "description": "Order payment",
  "paymentMethod": "credit_card",
  "idempotencyKey": "unique_key_123"
}
```

### Get Payment Status
```http
GET /api/payments/{paymentId}
Authorization: Bearer <token>
```

### Get All Payments
```http
GET /api/payments
Authorization: Bearer <token>
```

### System Metrics (Admin Only)
```http
GET /api/metrics
Authorization: Bearer <token>
```

### User Management (Admin Only)
```http
GET /api/users
POST /api/users
PUT /api/users/{userId}
DELETE /api/users/{userId}
Authorization: Bearer <token>
```

### Product Management

#### Get All Products
```http
GET /api/products?category=electronics&search=headphones&minPrice=1000&maxPrice=50000&sortBy=price
```

#### Get Product by ID
```http
GET /api/products/{productId}
```

#### Get Product Categories
```http
GET /api/products/categories
```

#### Create Product (Admin Only)
```http
POST /api/products
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Premium Headphones",
  "description": "High-quality wireless headphones",
  "unitPrice": 299.99,
  "currency": "USD",
  "category": "electronics",
  "imageUrl": "https://example.com/image.jpg",
  "metadata": {
    "brand": "AudioTech",
    "color": "Black",
    "warranty": "2 years"
  }
}
```

#### Update Product (Admin Only)
```http
PUT /api/products/{productId}
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Product Name",
  "unitPrice": 349.99
}
```

#### Delete Product (Admin Only)
```http
DELETE /api/products/{productId}
Authorization: Bearer <token>
```

### Product Orders

#### Submit Product Order
```http
POST /api/orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "items": [
    {
      "productId": "prod_001",
      "quantity": 2
    },
    {
      "productId": "prod_002",
      "quantity": 1
    }
  ],
  "description": "Customer order",
  "paymentMethod": "credit_card",
  "idempotencyKey": "order_123456"
}
```

#### Get Order Details
```http
GET /api/orders/{orderId}
Authorization: Bearer <token>
```

## 🧪 Testing the Application

### Quick Start (Local Development)

1. **Start the application:**
   ```bash
   # Using the provided script (Windows)
   .\run-local.ps1
   
   # Or manually
   cd project
   node backend/server.js          # Terminal 1
   npm run dev:frontend           # Terminal 2
   ```

2. **Access the application:**
   - **Frontend**: http://localhost:5173
   - **Backend API**: http://localhost:3001
   - **Health Check**: http://localhost:3001/health

### Test User Credentials

**Customer Account:**
- Email: `customer@example.com`
- Password: `password123`
- Permissions: View products, place orders, make payments

**Admin Account:**
- Email: `admin@example.com`
- Password: `password123`
- Permissions: All customer permissions + user management, product management

### Testing the Cart Integration

1. **Login as Customer:**
   - Go to http://localhost:5173
   - Login with: `customer@example.com` / `password123`

2. **Add Products to Cart:**
   - Click on "Product Orders" tab
   - Browse products by category (Electronics, Clothing, Books, etc.)
   - Click "Add to Cart" on different products
   - Use +/- buttons to adjust quantities
   - Watch the cart total update in real-time

3. **Test Automatic Payment Integration:**
   - Click on "New Payment" tab
   - Notice the green cart integration box appears
   - Payment amount is automatically set to cart total
   - Green checkmark shows "✓ Amount automatically set to cart total"
   - Description is auto-filled with "Payment for X item(s) from cart"

4. **Test Payment Processing:**
   - Fill in payment details (customer ID auto-filled for customers)
   - Click "Submit Payment"
   - Watch real-time status updates
   - Check payment appears in Dashboard

### Testing Admin Features

1. **Login as Admin:**
   - Use: `admin@example.com` / `password123`

2. **User Management:**
   - Click "User Management" tab
   - View all users and their roles
   - Create new users with different roles

3. **Product Management:**
   - Click "Product Management" tab
   - Add, edit, or remove products
   - Update prices and inventory

4. **System Metrics:**
   - Click "System Metrics" tab
   - View payment performance analytics
   - Monitor system health and trends

## 🛠️ Future Enhancements

### Database Integration
- PostgreSQL with proper schema design
- Connection pooling and transaction management
- Database-level constraints for data integrity

### Message Queue Integration
- RabbitMQ or Kafka for reliable event delivery
- Dead letter queues for failed events
- Event sourcing for audit trails

### Advanced Features
- **Circuit Breaker**: Protect against provider failures
- **Bulkhead Pattern**: Isolate different payment types
- **Saga Pattern**: Distributed transaction management
- **Observability**: Structured logging, metrics, tracing

### Security Enhancements
- API authentication and authorization
- Payment data encryption
- PCI DSS compliance measures
- Rate limiting per customer

## 🔐 Security Considerations

- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CORS configuration
- Secure error handling (no sensitive data leakage)

## 📈 Scalability

The architecture supports horizontal scaling through:
- Stateless application design
- Distributed rate limiting
- Database sharding strategies
- Load balancer configuration
- Container orchestration ready

## 📱 Application Flow

The application follows this logical flow:

1. **Login Page** - User authentication and role-based access
2. **Dashboard** - Overview of payment activities and system status
3. **Product Orders** - Browse products and add items to shopping cart
4. **New Payment** - Process payments with automatic cart total integration
5. **System Metrics** - Monitor payment performance and system health

### Cart Integration Feature

The payment form automatically integrates with the shopping cart:
- **Automatic Amount Setting**: Payment amount is automatically set to cart total
- **Visual Confirmation**: Green checkmark shows when amount matches cart total
- **Real-time Updates**: Amount updates automatically when cart changes
- **Smart Button**: "Use Cart Total" button changes to "Update Cart Total" when already set

---

This payment gateway system demonstrates enterprise-grade software architecture with proper separation of concerns, robust error handling, and extensible design patterns suitable for production deployment.