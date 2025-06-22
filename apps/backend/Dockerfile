# Use Node.js 18 Alpine
FROM node:18-alpine

# Instalar dependências do sistema
RUN apk add --no-cache libc6-compat curl && \
    npm install -g pnpm@8.15.4

# Criar usuário não-root
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de configuração do workspace
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY turbo.json ./
COPY packages/ ./packages/

# Copiar arquivos do backend
COPY apps/backend/package.json ./apps/backend/
COPY apps/backend/tsconfig*.json ./apps/backend/
COPY apps/backend/nest-cli.json ./apps/backend/
COPY apps/backend/src ./apps/backend/src
COPY apps/backend/prisma ./apps/backend/prisma

# Configurar pnpm e instalar dependências
RUN pnpm config set network-timeout 300000 && \
    pnpm config set registry https://registry.npmjs.org/ && \
    pnpm install --frozen-lockfile

# Navegar para o diretório do backend
WORKDIR /app/apps/backend

# Debug: Verificar estrutura antes do build
RUN echo "📋 Verificando estrutura:" && \
    pwd && \
    ls -la && \
    echo "📁 Conteúdo do src:" && \
    ls -la src/

# Gerar Prisma client e fazer build
RUN pnpm prisma generate && \
    pnpm build

# Debug: Verificar build
RUN echo "📦 Verificando build:" && \
    ls -la dist/ && \
    echo "📄 Arquivo main.js:" && \
    ls -la dist/main.js

# Criar diretório para Railway Volume
RUN mkdir -p /app/data/uploads && \
    chown -R nestjs:nodejs /app && \
    chown -R nestjs:nodejs /app/data

# Mudar para usuário não-root
USER nestjs

# Expor porta
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://127.0.0.1:3002/health || exit 1

# Comando para iniciar a aplicação
CMD ["node", "dist/main.js"] 