# Use Node.js 18 Alpine como base
FROM node:18-alpine AS base

# Instalar dependências do sistema e pnpm
RUN apk add --no-cache libc6-compat && \
    npm install -g pnpm@8.15.4

# Definir diretório de trabalho
WORKDIR /app

# Stage 1: Install dependencies
FROM base AS deps

# Copiar arquivos de configuração do workspace
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/ ./packages/
COPY turbo.json ./

# Copiar arquivos do backend
COPY apps/backend/package.json ./apps/backend/
COPY apps/backend/tsconfig*.json ./apps/backend/
COPY apps/backend/nest-cli.json ./apps/backend/

# Configurar pnpm e instalar dependências com timeout maior
RUN pnpm config set network-timeout 300000 && \
    pnpm config set registry https://registry.npmjs.org/ && \
    pnpm install --frozen-lockfile --prefer-offline

# Stage 2: Build application
FROM base AS builder
WORKDIR /app

# Copiar node_modules do stage anterior
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY --from=deps /app/apps/backend/node_modules ./apps/backend/node_modules

# Copiar arquivos de configuração
COPY --from=deps /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml /app/turbo.json ./
COPY --from=deps /app/apps/backend/package.json /app/apps/backend/tsconfig*.json /app/apps/backend/nest-cli.json ./apps/backend/

# Copiar código fonte
COPY apps/backend/src ./apps/backend/src
COPY apps/backend/prisma ./apps/backend/prisma

# Build da aplicação
WORKDIR /app/apps/backend
RUN pnpm prisma generate && \
    pnpm build

# Stage 3: Runtime
FROM base AS runner
WORKDIR /app/apps/backend

# Criar usuário não-root
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

# Criar diretório para Railway Volume
RUN mkdir -p /app/data/uploads && \
    chown -R nestjs:nodejs /app/data

# Copiar aplicação buildada
COPY --from=builder --chown=nestjs:nodejs /app/apps/backend/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/apps/backend/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/apps/backend/package.json ./
COPY --from=builder --chown=nestjs:nodejs /app/apps/backend/prisma ./prisma

# Mudar para usuário não-root
USER nestjs

# Expor porta
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3002/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Comando para iniciar a aplicação
CMD ["node", "dist/main.js"] 