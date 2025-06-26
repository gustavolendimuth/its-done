# Production Dockerfile for backend
FROM node:18-alpine

# Install system dependencies
RUN apk add --no-cache libc6-compat curl && \
    npm install -g pnpm@8.15.4

# Set working directory
WORKDIR /app

# Copy workspace configuration
COPY package.json ./
COPY pnpm-workspace.yaml ./
COPY pnpm-lock.yaml ./

# Copy shared packages
COPY packages/types ./packages/types/

# Copy backend files
COPY apps/backend/package.json ./apps/backend/
COPY apps/backend/tsconfig*.json ./apps/backend/
COPY apps/backend/nest-cli.json ./apps/backend/
COPY apps/backend/prisma ./apps/backend/prisma/
COPY apps/backend/src ./apps/backend/src/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Generate Prisma client
WORKDIR /app/apps/backend
RUN pnpm prisma generate

# Build the application
RUN pnpm build

# Verify build result
RUN echo "📦 Verifying build:" && \
    ls -la dist/ && \
    echo "✅ Main file found:" && \
    ls -la dist/main.js

# Create non-root user and directories
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs && \
    mkdir -p /app/data/uploads && \
    chown -R nestjs:nodejs /app

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://127.0.0.1:3002/health || exit 1

# Start command with database setup
CMD ["sh", "-c", "pnpm prisma migrate deploy && pnpm prisma db seed && node dist/main.js"] 