# Dockerfile para deploy standalone do backend
FROM node:18-alpine

# Instalar dependências do sistema
RUN apk add --no-cache libc6-compat curl && \
    npm install -g pnpm@8.15.4

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de configuração
COPY package.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./

# Instalar dependências
RUN pnpm config set network-timeout 300000 && \
    pnpm install --prod=false && \
    pnpm add prisma@latest --save-dev

# Copiar código fonte e prisma
COPY src ./src
COPY prisma ./prisma

# Build da aplicação
RUN echo "🔧 Gerando Prisma client..." && \
    pnpm prisma generate

RUN echo "🔨 Executando build NestJS..." && \
    pnpm run build

# Verificar resultado do build
RUN echo "📦 Verificando build:" && \
    ls -la dist/ && \
    echo "✅ Main file encontrado:" && \
    ls -la dist/main.js

# Criar usuário não-root e diretórios
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs && \
    mkdir -p /app/data/uploads && \
    chown -R nestjs:nodejs /app

# Mudar para usuário não-root
USER nestjs

# Expor porta
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://127.0.0.1:3002/health || exit 1

# Comando para iniciar com migrações
CMD ["sh", "-c", "pnpm prisma migrate deploy && pnpm prisma db seed && node dist/main.js"] 