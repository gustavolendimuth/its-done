# Dockerfile para o backend (context da raiz do monorepo)
FROM node:18-alpine AS base

# Instalar dependências necessárias (incluindo postgresql-client para backups)
RUN apk add --no-cache libc6-compat curl postgresql-client
RUN npm install -g pnpm@8.15.4

WORKDIR /app

# Dependencies stage
FROM base AS deps

# Copiar package.json do backend
COPY apps/backend/package.json ./

# Instalar dependências
RUN pnpm install

# Development stage (para hot reload)
FROM base AS development

WORKDIR /app

# Copiar node_modules das dependências
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json

# Copiar código fonte (será substituído por volume)
COPY apps/backend/ ./

# Gerar Prisma client
RUN npx prisma generate

# Expor porta
EXPOSE 3002

# Comando de desenvolvimento (será sobrescrito pelo docker-compose)
CMD ["pnpm", "run", "start:dev"]

# Builder stage (para produção)
FROM base AS builder

WORKDIR /app

# Copiar node_modules do stage anterior
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json

# Copiar código fonte do backend (incluindo prisma)
COPY apps/backend/ ./

# Gerar Prisma client
RUN npx prisma generate

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
COPY --from=builder /app/scripts ./scripts

# Definir permissões e tornar scripts executáveis
RUN chown -R nestjs:nodejs /app && \
    chmod +x /app/scripts/*.sh

USER nestjs

EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://127.0.0.1:3002/health || exit 1

# Comando para iniciar com migrações e backup automático
CMD ["sh", "-c", "/app/scripts/migrate-with-backup.sh && node dist/src/main.js"] 