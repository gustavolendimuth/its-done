# Dockerfile para o frontend (context da raiz do monorepo)
FROM node:18-alpine AS base

# Instalar dependências necessárias
RUN apk add --no-cache libc6-compat
RUN npm install -g pnpm@8.15.4

WORKDIR /app

# Dependencies stage
FROM base AS deps

# Copiar package.json do frontend
COPY apps/frontend/package.json ./

# Instalar dependências
RUN pnpm install

# Development stage (para hot reload)
FROM base AS development

WORKDIR /app

# Copiar node_modules das dependências
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json

# Copiar código fonte (será substituído por volume)
COPY apps/frontend/ ./

# Expor porta
EXPOSE 3000

# Variáveis de ambiente do Next.js
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Comando de desenvolvimento (será sobrescrito pelo docker-compose)
CMD ["pnpm", "run", "dev"]

# Builder stage (para produção)
FROM base AS builder

WORKDIR /app

# Copiar node_modules do stage anterior
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json

# Copiar código fonte do frontend
COPY apps/frontend/ ./

# Build da aplicação Next.js
RUN pnpm run build

# Production stage
FROM base AS runner
WORKDIR /app

# Criar usuário não-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar arquivos necessários para produção
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"] 