# Production Dockerfile for backend
FROM node:18-alpine AS base

# Install system dependencies
RUN apk add --no-cache libc6-compat curl && \
    npm install -g pnpm@8.15.4

# Set working directory
WORKDIR /app

# Stage 1: Dependencies
FROM base AS deps

# Copy workspace configuration
COPY package.json ./
COPY pnpm-workspace.yaml ./
COPY pnpm-lock.yaml ./

# Copy shared packages
COPY packages/types ./packages/types/

# Copy backend package files
COPY apps/backend/package.json ./apps/backend/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Stage 2: Build
FROM base AS builder
WORKDIR /app

# Copy workspace files and dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./
COPY --from=deps /app/pnpm-workspace.yaml ./
COPY --from=deps /app/pnpm-lock.yaml ./
COPY --from=deps /app/packages ./packages
COPY --from=deps /app/apps/backend/node_modules ./apps/backend/node_modules
COPY --from=deps /app/apps/backend/package.json ./apps/backend/

# Copy backend source code
COPY apps/backend/tsconfig*.json ./apps/backend/
COPY apps/backend/nest-cli.json ./apps/backend/
COPY apps/backend/prisma ./apps/backend/prisma/
COPY apps/backend/src ./apps/backend/src/

# Generate Prisma client and build
WORKDIR /app/apps/backend
RUN pnpm prisma generate && \
    pnpm build

# Verify build result
RUN echo "📦 Verifying build:" && \
    ls -la dist/ && \
    echo "✅ Main file found:" && \
    ls -la dist/main.js

# Stage 3: Production
FROM base AS runner
WORKDIR /app

# Create non-root user and directories
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs && \
    mkdir -p /app/data/uploads && \
    chown -R nestjs:nodejs /app

# Copy necessary files from builder
COPY --from=builder --chown=nestjs:nodejs /app/apps/backend/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/apps/backend/prisma ./prisma
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/apps/backend/node_modules ./node_modules

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://127.0.0.1:3002/health || exit 1

# Start command with database setup
CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed && node dist/main.js"] 