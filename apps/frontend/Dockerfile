# Dockerfile para deploy standalone do frontend
FROM node:18-alpine AS base

# Instalar dependências do sistema
RUN apk add --no-cache libc6-compat && \
    npm install -g pnpm@8.15.4

# Definir diretório de trabalho
WORKDIR /app

# Stage 1: Dependencies
FROM base AS deps

# Copiar arquivos de configuração do workspace
COPY pnpm-workspace.yaml ./
COPY package.json ./

# Criar estrutura de diretórios
RUN mkdir -p apps/frontend packages

# Copiar arquivos de configuração do frontend
COPY apps/frontend/package.json ./apps/frontend/
COPY apps/frontend/components.json ./

# Copiar os pacotes necessários do workspace
COPY packages/types ./packages/types
COPY packages/tsconfig ./packages/tsconfig

# Instalar dependências
RUN pnpm config set network-timeout 300000 && \
    pnpm install --prod=false

# Stage 2: Build
FROM base AS builder
WORKDIR /app

# Criar estrutura de diretórios
RUN mkdir -p apps/frontend packages

# Copiar node_modules e estrutura do workspace
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json
COPY --from=deps /app/pnpm-workspace.yaml ./
COPY --from=deps /app/packages ./packages
COPY --from=deps /app/apps/frontend/package.json ./apps/frontend/package.json

# Copiar código fonte
COPY apps/frontend/src ./src
COPY apps/frontend/public ./public
COPY apps/frontend/next.config.js ./
COPY apps/frontend/tailwind.config.ts ./
COPY apps/frontend/tsconfig.json ./
COPY apps/frontend/postcss.config.* ./
COPY apps/frontend/components.json ./

# Build da aplicação
RUN echo "🔨 Building Next.js application..." && \
    pnpm build

# Stage 3: Production
FROM base AS runner
WORKDIR /app

# Criar usuário não-root
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copiar arquivos necessários
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public

# Copiar aplicação buildada
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Mudar para usuário não-root
USER nextjs

# Expor porta
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/ || exit 1

# Comando para iniciar
CMD ["node", "server.js"] 