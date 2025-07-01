# Multi-stage Dockerfile for Payment Gateway with Frontend and Backend
FROM node:18-alpine AS base

# Install necessary packages
RUN apk add --no-cache git

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies)
RUN npm ci

# Copy all source code
COPY . .

# Build frontend
RUN npm run build

# Create production stage
FROM node:18-alpine AS production

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy backend files
COPY backend/ ./backend/

# Copy built frontend from build stage
COPY --from=base /app/dist ./public

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership of the app directory
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["node", "backend/server.js"]

# Development stage
FROM node:18-alpine AS development

# Install necessary packages
RUN apk add --no-cache git

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies
RUN npm ci

# Copy all source code
COPY . .

# Expose ports for both frontend and backend
EXPOSE 3001 5173

# Create startup script
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'echo "Starting Payment Gateway in development mode..."' >> /app/start.sh && \
    echo 'echo "Backend will run on port 3001"' >> /app/start.sh && \
    echo 'echo "Frontend will run on port 5173"' >> /app/start.sh && \
    echo 'echo ""' >> /app/start.sh && \
    echo 'echo "Starting backend server..."' >> /app/start.sh && \
    echo 'node backend/server.js &' >> /app/start.sh && \
    echo 'echo "Starting frontend development server..."' >> /app/start.sh && \
    echo 'npm run dev:frontend' >> /app/start.sh && \
    chmod +x /app/start.sh

# Start both servers
CMD ["/app/start.sh"] 