# Dockerfile for frontend standalone deployment
FROM node:18-alpine AS base

# Install system dependencies
RUN apk add --no-cache libc6-compat && \
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

# Copy frontend package files
COPY apps/frontend/package.json ./apps/frontend/
COPY apps/frontend/components.json ./apps/frontend/

# Install dependencies
RUN pnpm install

# Stage 2: Build
FROM base AS builder
WORKDIR /app

# Copy workspace files and dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./
COPY --from=deps /app/pnpm-workspace.yaml ./
COPY --from=deps /app/pnpm-lock.yaml ./
COPY --from=deps /app/packages ./packages
COPY --from=deps /app/apps/frontend/node_modules ./apps/frontend/node_modules
COPY --from=deps /app/apps/frontend/package.json ./apps/frontend/

# Copy frontend source code
COPY apps/frontend/src ./apps/frontend/src
COPY apps/frontend/public ./apps/frontend/public
COPY apps/frontend/next.config.js ./apps/frontend/
COPY apps/frontend/tailwind.config.ts ./apps/frontend/
COPY apps/frontend/tsconfig.json ./apps/frontend/
COPY apps/frontend/postcss.config.* ./apps/frontend/
COPY apps/frontend/components.json ./apps/frontend/

# Build the application
WORKDIR /app/apps/frontend
RUN echo "🔨 Building Next.js application..." && \
    pnpm build

# Stage 3: Production
FROM base AS runner
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy necessary files
COPY --from=builder /app/apps/frontend/next.config.js ./
COPY --from=builder /app/apps/frontend/public ./public

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/.next/static ./.next/static

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/ || exit 1

# Start command
CMD ["node", "server.js"]

# Development Dockerfile for frontend
FROM node:18-alpine

# Install system dependencies
RUN apk add --no-cache libc6-compat && \
    npm install -g pnpm@8.15.4

# Set working directory
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Switch to non-root user and ensure directory permissions
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose port
EXPOSE 3000

# Start development server
CMD ["sh", "-c", "cd apps/frontend && pnpm install && pnpm dev"]

# Production Dockerfile for frontend
FROM node:18-alpine AS base

# Install dependencies in a separate layer to better utilize cache
RUN apk add --no-cache libc6-compat curl

# Install pnpm in a separate layer
RUN npm install -g pnpm@8.15.4

# Set working directory
WORKDIR /app

# Stage 1: Dependencies
FROM base AS deps

# Copy package files first to leverage Docker cache
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# Copy shared packages
COPY packages/types ./packages/types/

# Copy frontend package files
COPY apps/frontend/package.json apps/frontend/components.json ./apps/frontend/

# Install dependencies with specific network timeout and retry settings
RUN pnpm install --frozen-lockfile --network-timeout 600000 --retry 3

# Stage 2: Builder
FROM base AS builder
WORKDIR /app

# Copy all dependencies and configs from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./
COPY --from=deps /app/pnpm-workspace.yaml ./
COPY --from=deps /app/pnpm-lock.yaml ./
COPY --from=deps /app/packages ./packages
COPY --from=deps /app/apps/frontend/node_modules ./apps/frontend/node_modules
COPY --from=deps /app/apps/frontend/package.json ./apps/frontend/
COPY --from=deps /app/apps/frontend/components.json ./apps/frontend/

# Copy frontend source code
COPY apps/frontend/src ./apps/frontend/src
COPY apps/frontend/public ./apps/frontend/public
COPY apps/frontend/next.config.js ./apps/frontend/
COPY apps/frontend/tailwind.config.ts ./apps/frontend/
COPY apps/frontend/tsconfig.json ./apps/frontend/
COPY apps/frontend/postcss.config.* ./apps/frontend/

# Set max old space size for build process
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Build the application with increased timeout
WORKDIR /app/apps/frontend
RUN echo "🔨 Building Next.js application..." && \
    pnpm build

# Stage 3: Runner
FROM base AS runner
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Set environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Copy necessary files
COPY --from=builder /app/apps/frontend/next.config.js ./
COPY --from=builder /app/apps/frontend/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/.next/static ./.next/static

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

# Start command
CMD ["node", "server.js"] 