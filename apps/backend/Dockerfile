# Use Node.js 18 Alpine como base
FROM node:18-alpine AS base

# Instalar pnpm globalmente
RUN npm install -g pnpm

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de configuração do workspace
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/ ./packages/
COPY turbo.json ./

# Copiar arquivos do backend
COPY apps/backend/package.json ./apps/backend/
COPY apps/backend/tsconfig*.json ./apps/backend/
COPY apps/backend/nest-cli.json ./apps/backend/

# Instalar dependências
RUN pnpm install --frozen-lockfile

# Copiar código fonte do backend
COPY apps/backend/src ./apps/backend/src
COPY apps/backend/prisma ./apps/backend/prisma

# Gerar o cliente Prisma
WORKDIR /app/apps/backend
RUN pnpm prisma generate

# Build da aplicação
RUN pnpm build

# Expor porta
EXPOSE 3002

# Comando para iniciar a aplicação
CMD ["pnpm", "start:prod"] 