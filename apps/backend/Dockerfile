# Railway optimized Dockerfile for backend
FROM node:18-slim AS base

# Set environment variables for better performance and stability
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=1536"
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV PYTHONUNBUFFERED=1

# Install system dependencies with retry logic
RUN apt-get update -y && \
    apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
    curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install pnpm with retry
RUN npm config set registry https://registry.npmjs.org/ && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-retry-maxtime 300000 && \
    npm config set fetch-retry-factor 10 && \
    npm config set fetch-retry-delay 10000 && \
    corepack enable && \
    corepack prepare pnpm@8.15.4 --activate

WORKDIR /app

# ==============================================================================
# Dependencies Stage
# ==============================================================================
FROM base AS deps

# Copy package files for better layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/types/package.json ./packages/types/
COPY apps/backend/package.json ./apps/backend/

# Configure pnpm for better network handling
RUN pnpm config set network-timeout 300000 && \
    pnpm config set fetch-retry-mintimeout 20000 && \
    pnpm config set fetch-retry-maxtimeout 120000 && \
    pnpm config set fetch-retry-factor 10

# Install dependencies with enhanced retry logic
RUN pnpm install --frozen-lockfile --prefer-offline --prod

# ==============================================================================
# Builder Stage
# ==============================================================================
FROM base AS builder

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages

# Copy source code
COPY . .

# Generate Prisma client and build
WORKDIR /app/apps/backend
RUN pnpm prisma generate && \
    pnpm build

# ==============================================================================
# Production Stage
# ==============================================================================
FROM node:18-slim AS runner

# Install only required system dependencies
RUN apt-get update -y && \
    apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -r nodejs -g 1001 && \
    useradd -r -g nodejs -u 1001 nestjs

WORKDIR /app

# Copy built application
COPY --from=builder --chown=nestjs:nodejs /app/apps/backend/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/apps/backend/prisma ./prisma
COPY --from=deps --chown=nestjs:nodejs /app/node_modules ./node_modules

# Create uploads directory
RUN mkdir -p /app/data/uploads && \
    chown -R nestjs:nodejs /app

# Switch to non-root user
USER nestjs

# Set environment
ENV NODE_ENV=production
ENV PORT=3002

# Expose port
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3002/health || exit 1

# Start application with database migration
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"] 