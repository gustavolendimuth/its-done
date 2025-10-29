# Docker - Guia Completo

Guia completo para desenvolvimento e produção usando Docker no It's Done.

## 📁 Estrutura de Arquivos

O projeto possui **2 arquivos** Docker Compose:

```
its-done/
├── docker-compose.yml          # ← PRODUÇÃO (Railway)
├── docker-compose.dev.yml      # ← DESENVOLVIMENTO (hot reload)
├── apps/
│   ├── backend/Dockerfile      # Multi-stage: development → builder → runner
│   └── frontend/Dockerfile     # Multi-stage: development → builder → runner
└── .env                        # Variáveis de ambiente
```

## 🚀 Início Rápido

### Desenvolvimento (Hot Reload)

```bash
# Alias útil (adicione ao ~/.bashrc ou ~/.zshrc)
alias dc-dev='docker compose -f docker-compose.dev.yml'

# Iniciar todos os serviços
dc-dev up -d --build

# Ver logs em tempo real
dc-dev logs -f backend frontend

# Parar
dc-dev down
```

### Produção (Testar Localmente)

```bash
# Iniciar em modo produção
docker compose up -d --build

# Ver logs
docker compose logs -f

# Parar
docker compose down
```

## 📊 Comparação: Dev vs Prod

| Característica | `docker-compose.dev.yml` | `docker-compose.yml` |
|---------------|--------------------------|----------------------|
| **Propósito** | Desenvolvimento local | Produção (Railway) |
| **Hot Reload** | ✅ Sim | ❌ Não |
| **Volumes** | ✅ Sincroniza código | ❌ Código na imagem |
| **Target** | `development` | `runner` |
| **NODE_ENV** | development | production |
| **Restart** | Manual | unless-stopped |
| **Build** | Dev dependencies | Otimizado |
| **Comando Backend** | `pnpm run start:dev` | `migrate + node dist` |
| **Comando Frontend** | `pnpm run dev` | `node server.js` |

## 🎯 Quando Usar Cada Um

### Use `docker-compose.dev.yml` para:
- ✅ Desenvolvimento local diário
- ✅ Hot reload automático ao editar código
- ✅ Debug e testes rápidos
- ✅ Iteração rápida no código

### Use `docker-compose.yml` para:
- ✅ Testar build de produção localmente
- ✅ Verificar performance final
- ✅ Deploy no Railway (automático)
- ✅ Testar sem volumes/hot reload

## 🔥 Hot Reload (Desenvolvimento)

Ao usar `docker-compose.dev.yml`, as seguintes pastas são sincronizadas:

**Backend:**
- `apps/backend/src/` → Código TypeScript
- `apps/backend/prisma/` → Schema do banco
- Arquivos de config (package.json, tsconfig.json, etc)

**Frontend:**
- `apps/frontend/src/` → Código React/Next.js
- `apps/frontend/public/` → Arquivos estáticos
- Arquivos de config (next.config.js, tailwind.config.ts, etc)

**Como funciona:**
1. Edite um arquivo local em `apps/backend/src/`
2. NestJS detecta a mudança automaticamente
3. Backend reinicia e aplica as mudanças
4. Mesma coisa para o frontend com Next.js

## 📝 Variáveis de Ambiente

Edite o arquivo `.env` na raiz do projeto:

```env
# Obrigatórias
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/its_done"
JWT_SECRET="seu-jwt-secret-super-secreto"
NEXTAUTH_SECRET="seu-nextauth-secret-super-secreto"
NEXTAUTH_URL="http://localhost:3000"

# Opcionais
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
RESEND_API_KEY=""
FROM_EMAIL="noreply@itsdone.local"

# AWS S3 (opcional)
AWS_ACCESS_KEY_ID=""
AWS_SECRET_ACCESS_KEY=""
AWS_S3_BUCKET=""
```

O Docker Compose lê automaticamente este arquivo. Para Railway, configure as variáveis no Dashboard.

## 🛠️ Comandos Essenciais

### Gerenciar Containers (Dev)

```bash
# Iniciar
dc-dev up -d

# Parar
dc-dev down

# Reiniciar um serviço
dc-dev restart backend
dc-dev restart frontend

# Ver status
dc-dev ps

# Ver logs
dc-dev logs -f backend
dc-dev logs -f frontend

# Rebuild
dc-dev up -d --build

# Rebuild sem cache
dc-dev build --no-cache
dc-dev up -d
```

### Executar Comandos nos Containers

```bash
# Backend - Migrations
dc-dev exec backend npx prisma migrate dev
dc-dev exec backend npx prisma migrate deploy

# Backend - Seed
dc-dev exec backend pnpm db:seed

# Backend - Prisma Studio
dc-dev exec backend npx prisma studio

# Backend - Shell
dc-dev exec backend sh

# Frontend - Instalar dependência
dc-dev exec frontend pnpm add nome-do-pacote

# Backend - Instalar dependência
dc-dev exec backend pnpm add nome-do-pacote
```

### Banco de Dados

```bash
# Conectar ao PostgreSQL
dc-dev exec postgres psql -U postgres -d its_done

# Ver tabelas
dc-dev exec postgres psql -U postgres -d its_done -c "\dt"

# Executar query
dc-dev exec postgres psql -U postgres -d its_done -c "SELECT * FROM \"User\";"

# Backup
dc-dev exec postgres pg_dump -U postgres its_done > backup_$(date +%Y%m%d).sql

# Restaurar backup
dc-dev exec -T postgres psql -U postgres its_done < backup.sql

# Resetar banco (CUIDADO!)
dc-dev exec backend npx prisma migrate reset --force
```

## 🏗️ Dockerfiles Multi-Stage

Ambos Dockerfiles usam multi-stage builds para otimizar o tamanho final:

### Backend (`apps/backend/Dockerfile`)

```dockerfile
FROM node:18-alpine AS base
# Instala dependências do sistema

FROM base AS deps
# Instala node_modules

FROM base AS development
# Stage para desenvolvimento (hot reload)
# Usa volumes no docker-compose.dev.yml

FROM base AS builder
# Build de produção
# Compila TypeScript, gera Prisma client

FROM base AS runner
# Imagem final para produção
# Apenas dist/, node_modules prod, sem dev deps
```

### Frontend (`apps/frontend/Dockerfile`)

Mesma estrutura, mas:
- Builder usa `pnpm run build` do Next.js
- Runner usa standalone output do Next.js
- Copia `.next/static` e `.next/standalone`

## 🌐 Serviços Disponíveis

Após iniciar os containers:

| Serviço | URL | Porta |
|---------|-----|-------|
| **Frontend** | http://localhost:3000 | 3000 |
| **Backend API** | http://localhost:3002 | 3002 |
| **Backend Health** | http://localhost:3002/health | 3002 |
| **Prisma Studio** | `dc-dev exec backend npx prisma studio` | 5555 |
| **PostgreSQL** | localhost:5432 | 5432 |
| **Redis** | localhost:6379 | 6379 |

## 🐛 Troubleshooting

### Hot Reload Não Funciona

**Sintoma:** Mudanças no código não são aplicadas automaticamente

**Solução:**
```bash
# Certifique-se de usar docker-compose.dev.yml
dc-dev ps  # Verificar se containers estão usando dev.yml

# Se não estiver, pare e inicie corretamente
docker compose down
dc-dev up -d --build
```

### Container Não Inicia

**Sintoma:** Container crashando ou não iniciando

**Solução:**
```bash
# Ver logs detalhados
dc-dev logs backend
dc-dev logs frontend

# Verificar se portas estão ocupadas
lsof -i :3000  # Frontend
lsof -i :3002  # Backend
lsof -i :5432  # PostgreSQL

# Rebuildar tudo
dc-dev down -v
dc-dev up -d --build
```

### Mudanças Não Aparecem (Cache)

**Sintoma:** Rebuild não pega novas mudanças

**Solução:**
```bash
# Rebuildar sem cache
dc-dev build --no-cache backend
dc-dev build --no-cache frontend
dc-dev up -d
```

### Erro de Permissions (WSL2)

**Sintoma:** Erro de permissões em volumes no Windows/WSL2

**Solução:**
```bash
# Mover projeto para filesystem do Linux
mv /mnt/c/projeto ~/projeto

# Ou ajustar permissões
chmod -R 755 apps/backend/src
chmod -R 755 apps/frontend/src
```

### Node Modules Desatualizados

**Sintoma:** Erro de módulos faltando após atualizar package.json

**Solução:**
```bash
# Backend
dc-dev exec backend rm -rf node_modules
dc-dev exec backend pnpm install
dc-dev restart backend

# Frontend
dc-dev exec frontend rm -rf node_modules .next
dc-dev exec frontend pnpm install
dc-dev restart frontend

# Ou rebuilde tudo
dc-dev down
dc-dev up -d --build
```

### Google OAuth Não Funciona

**Sintoma:** Erro ao tentar login com Google

**Verificações:**
1. Variáveis configuradas no `.env`:
   ```env
   GOOGLE_CLIENT_ID="seu-client-id.apps.googleusercontent.com"
   GOOGLE_CLIENT_SECRET="seu-client-secret"
   ```

2. Callback URL no Google Cloud Console:
   - Dev: `http://localhost:3000/api/auth/callback/google`
   - Prod: `https://seudominio.com/api/auth/callback/google`

3. Reinicie os containers:
   ```bash
   dc-dev restart backend frontend
   ```

### Limpar Tudo e Recomeçar

**CUIDADO:** Isso apaga o banco de dados!

```bash
# Parar e remover tudo (incluindo volumes)
dc-dev down -v

# Limpar cache do Docker
docker builder prune -a

# Iniciar do zero
dc-dev up -d --build
```

## 📦 Performance e Otimização

### Acelerar Builds no WSL2

```bash
# 1. Mover projeto para filesystem do Linux
mv /mnt/c/projeto ~/projeto

# 2. Configurar Docker Desktop
# Settings > Resources > WSL Integration
# Ativar integração com sua distro

# 3. Usar cache de builds
# Docker reutiliza layers automaticamente
dc-dev up -d  # Usa cache
dc-dev up -d --build  # Force rebuild apenas camadas alteradas
```

### Reduzir Tempo de Build

```bash
# Rebuildar apenas um serviço
dc-dev up -d --build backend  # Apenas backend
dc-dev up -d --build frontend  # Apenas frontend

# Builds paralelos
docker compose -f docker-compose.dev.yml build --parallel
```

### Monitorar Recursos

```bash
# Ver uso de CPU/memória
docker stats

# Ver tamanho das imagens
docker images | grep its-done

# Limpar imagens não usadas
docker image prune -a
```

## 🔧 Configurações Avançadas

### Adicionar Nova Dependência

```bash
# Backend
dc-dev exec backend pnpm add nome-da-lib
dc-dev restart backend

# Frontend
dc-dev exec frontend pnpm add nome-da-lib
dc-dev restart frontend
```

### Criar Nova Migration Prisma

```bash
# 1. Edite apps/backend/prisma/schema.prisma
# 2. Crie a migration
dc-dev exec backend npx prisma migrate dev --name nome_da_migration

# 3. Verifique
dc-dev exec backend npx prisma studio
```

### Executar Testes

```bash
# Backend
dc-dev exec backend pnpm test
dc-dev exec backend pnpm test:cov

# Frontend
dc-dev exec frontend pnpm test
dc-dev exec frontend pnpm test:ci
```

### Debug no Container

```bash
# Entrar no shell do container
dc-dev exec backend sh
dc-dev exec frontend sh

# Ver variáveis de ambiente
dc-dev exec backend env | grep NODE_ENV
dc-dev exec backend env | grep DATABASE_URL

# Ver processos rodando
dc-dev exec backend ps aux
```

## 🚀 Workflow Recomendado

### 1. Desenvolvimento Diário

```bash
# Manhã - Iniciar containers
dc-dev up -d

# Durante o dia - Ver logs se necessário
dc-dev logs -f backend frontend

# Noite - Parar containers
dc-dev down
```

### 2. Adicionar Feature

```bash
# 1. Editar código normalmente
# 2. Hot reload aplica mudanças automaticamente
# 3. Testar no navegador
# 4. Commit quando pronto

# Se adicionar dependência:
dc-dev exec backend pnpm add nova-lib
dc-dev restart backend
```

### 3. Antes de Deploy

```bash
# 1. Testar build de produção localmente
docker compose down
docker compose up -d --build

# 2. Verificar se tudo funciona
curl http://localhost:3002/health
curl http://localhost:3000

# 3. Ver logs para erros
docker compose logs -f

# 4. Se OK, fazer push
git add .
git commit -m "feat: nova feature"
git push

# Railway fará deploy automático usando docker-compose.yml
```

## 📚 Arquivos Relacionados

- **RAILWAY.md** - Guia completo de deploy no Railway
- **CLAUDE.md** - Arquitetura do projeto
- **.env.example** - Template de variáveis

## 💡 Dicas Úteis

### Aliases Recomendados

Adicione ao `~/.bashrc` ou `~/.zshrc`:

```bash
# Docker Compose
alias dc-dev='docker compose -f docker-compose.dev.yml'
alias dc-prod='docker compose'

# Logs
alias dc-logs='dc-dev logs -f backend frontend'

# Restart rápido
alias dc-restart='dc-dev restart backend frontend'
```

### Script de Start Rápido

Crie `start-dev.sh`:

```bash
#!/bin/bash
docker compose -f docker-compose.dev.yml up -d --build
echo "✅ Containers iniciados!"
echo "Frontend: http://localhost:3000"
echo "Backend: http://localhost:3002"
docker compose -f docker-compose.dev.yml logs -f backend frontend
```

### VS Code Tasks

Crie `.vscode/tasks.json`:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Docker: Start Dev",
      "type": "shell",
      "command": "docker compose -f docker-compose.dev.yml up -d"
    },
    {
      "label": "Docker: Stop Dev",
      "type": "shell",
      "command": "docker compose -f docker-compose.dev.yml down"
    }
  ]
}
```

---

**Atualizado:** 29 Out 2025
**Versão:** 1.0
