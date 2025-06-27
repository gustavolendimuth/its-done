# Dockerfile independente para o backend
FROM node:18-alpine AS base

# Instalar dependências necessárias
RUN apk add --no-cache libc6-compat curl
RUN npm install -g pnpm@8.15.4

WORKDIR /app

# Dependencies stage
FROM base AS deps

# Copiar package.json
COPY package.json ./

# Instalar dependências
RUN pnpm install

# Builder stage
FROM base AS builder

WORKDIR /app

# Copiar node_modules do stage anterior
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json

# Copiar código fonte
COPY . .

# Gerar Prisma client
RUN pnpm prisma generate

# Build da aplicação NestJS
RUN pnpm run build

# Verificar resultado do build
RUN echo "📦 Verificando build:" && \
    ls -la dist/ && \
    echo "📁 Conteúdo do dist/src:" && \
    ls -la dist/src/ && \
    echo "✅ Main file encontrado:" && \
    ls -la dist/src/main.js

# Production stage
FROM base AS runner
WORKDIR /app

# Criar usuário não-root
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs && \
    mkdir -p /app/data/uploads

# Copiar arquivos necessários para produção
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json

# Definir permissões
RUN chown -R nestjs:nodejs /app

USER nestjs

EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://127.0.0.1:3002/health || exit 1

# Comando para iniciar com migrações
CMD ["sh", "-c", "pnpm prisma migrate deploy && pnpm db:seed:prod && node dist/src/main.js"] 