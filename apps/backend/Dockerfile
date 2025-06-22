# Use Node.js 18 Alpine
FROM node:18-alpine

# Instalar dependências do sistema
RUN apk add --no-cache libc6-compat curl && \
    npm install -g pnpm@8.15.4

# Definir diretório de trabalho
WORKDIR /app

# Copiar apenas o que é necessário para install
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/ ./packages/
COPY apps/backend/package.json ./apps/backend/

# Instalar dependências primeiro
RUN pnpm config set network-timeout 300000 && \
    pnpm install --frozen-lockfile

# Copiar código fonte
COPY apps/backend/ ./apps/backend/

# Navegar para o backend
WORKDIR /app/apps/backend

# Build em etapas
RUN echo "🔧 Gerando Prisma client..." && \
    pnpm prisma generate

RUN echo "🔨 Executando build NestJS..." && \
    pnpm run build

# Debug: Verificar configuração e tentar builds alternativos
RUN echo "📋 Debug info:" && \
    echo "TypeScript version: $(npx tsc --version)" && \
    echo "Nest CLI version: $(npx nest --version)" && \
    echo "📁 Conteúdo do dist após primeiro build:" && \
    ls -la dist/ && \
    echo "🔧 Tentando build direto com tsc..." && \
    npx tsc --project tsconfig.build.json && \
    echo "📁 Conteúdo do dist após tsc:" && \
    ls -la dist/ && \
    echo "🔧 Tentando nest build direto..." && \
    npx nest build --webpack && \
    echo "📁 Conteúdo final do dist:" && \
    ls -la dist/

# Verificar resultado final
RUN echo "📦 Verificando build final:" && \
    find dist -type f -name "*.js" | head -10 && \
    echo "📄 Procurando main file:" && \
    ls -la dist/main.* || ls -la dist/ | grep main || echo "Nenhum main file encontrado"

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

# Comando para iniciar (com debugging)
CMD ["sh", "-c", "echo '🚀 Iniciando aplicação...' && echo '📁 Conteúdo do dist:' && ls -la dist/ && echo '📄 Procurando arquivo principal:' && find . -name '*.js' | grep -E '(main|index)' | head -5 && if [ -f dist/main.js ]; then echo '✅ Executando dist/main.js' && node dist/main.js; elif [ -f dist/src/main.js ]; then echo '✅ Executando dist/src/main.js' && node dist/src/main.js; elif [ -f main.js ]; then echo '✅ Executando main.js' && node main.js; else echo '❌ Nenhum arquivo principal encontrado' && exit 1; fi"] 