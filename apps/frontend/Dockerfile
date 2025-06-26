# Use Node 18 slim instead of alpine for better compatibility
FROM node:18-slim AS base

# Set environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS="--max-old-space-size=1536"
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# Install pnpm
RUN corepack enable && \
    corepack prepare pnpm@8.15.4 --activate

# Set working directory
WORKDIR /app

# Stage 1: Install dependencies
FROM base AS deps
WORKDIR /app

# Copy only package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/types/package.json ./packages/types/
COPY apps/frontend/package.json ./apps/frontend/

# Install dependencies with production only
RUN pnpm install --prod --frozen-lockfile --workspace-root

# Stage 2: Build the application
FROM base AS builder
WORKDIR /app

# Copy files needed for build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY --from=deps /app/apps/frontend/node_modules ./apps/frontend/node_modules

# Copy source files
COPY . .

# Build the app
WORKDIR /app/apps/frontend
RUN pnpm build

# Stage 3: Production image
FROM node:18-slim AS runner
WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy only the necessary files
COPY --from=builder /app/apps/frontend/public ./public
COPY --from=builder /app/apps/frontend/.next/standalone ./
COPY --from=builder /app/apps/frontend/.next/static ./.next/static

# Set permissions
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose the port
EXPOSE 3000

# Start the application
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

# Set environment variables to reduce memory usage
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS="--max-old-space-size=2048"

# Install dependencies in a single layer to reduce image size
RUN apk update && \
    apk add --no-cache --virtual .build-deps curl && \
    apk add --no-cache libc6-compat && \
    npm install -g pnpm@8.15.4 && \
    apk del .build-deps

# Set working directory
WORKDIR /app

# Stage 1: Dependencies
FROM base AS deps

# Copy package files first to leverage Docker cache
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# Copy shared packages
COPY packages/types ./packages/types/

# Copy frontend package files
COPY apps/frontend/package.json ./apps/frontend/
COPY apps/frontend/components.json ./apps/frontend/

# Install dependencies with specific network timeout and retry settings
RUN pnpm install --frozen-lockfile --network-timeout 600000 --retry 3 \
    --prod --no-optional

# Stage 2: Builder
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
COPY --from=deps /app/apps/frontend/components.json ./apps/frontend/

# Copy frontend source code
COPY apps/frontend/src ./apps/frontend/src
COPY apps/frontend/public ./apps/frontend/public
COPY apps/frontend/next.config.js ./apps/frontend/
COPY apps/frontend/tailwind.config.ts ./apps/frontend/
COPY apps/frontend/tsconfig.json ./apps/frontend/
COPY apps/frontend/postcss.config.* ./apps/frontend/

# Build the application with increased timeout
WORKDIR /app/apps/frontend
RUN echo "🔨 Building Next.js application..." && \
    pnpm build

# Stage 3: Runner
FROM node:18-alpine AS runner
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

# Health check with minimal dependencies
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Start command
CMD ["node", "server.js"] 