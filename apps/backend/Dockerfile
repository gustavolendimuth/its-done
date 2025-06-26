# Use Node 18 slim instead of alpine for better compatibility
FROM node:18-slim AS base

# Set environment variables
ENV NODE_ENV=production
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
COPY apps/backend/package.json ./apps/backend/

# Install dependencies with production only
RUN pnpm install --prod --frozen-lockfile --workspace-root

# Stage 2: Build the application
FROM base AS builder
WORKDIR /app

# Copy files needed for build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY --from=deps /app/apps/backend/node_modules ./apps/backend/node_modules

# Copy source files
COPY . .

# Generate Prisma Client
WORKDIR /app/apps/backend
RUN pnpm prisma generate

# Build the app
RUN pnpm build

# Stage 3: Production image
FROM node:18-slim AS runner
WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=3002

# Install production dependencies
RUN apt-get update -y && \
    apt-get install -y openssl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -r nodejs -g 1001 && \
    useradd -r -g nodejs -u 1001 nestjs

# Copy only the necessary files
COPY --from=builder /app/apps/backend/dist ./dist
COPY --from=builder /app/apps/backend/prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/backend/node_modules ./node_modules

# Create uploads directory and set permissions
RUN mkdir -p /app/data/uploads && \
    chown -R nestjs:nodejs /app

# Switch to non-root user
USER nestjs

# Expose the port
EXPOSE 3002

# Start the application
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"] 