# Railway - Guia Completo de Deploy

Guia completo para fazer deploy do It's Done no Railway usando Docker.

## ⚠️ IMPORTANTE: Configuração Railway

O Railway **NÃO suporta bem docker-compose com build contexts customizados**.

**Solução:** Configure cada serviço manualmente no Railway Dashboard.

## 📋 Pré-requisitos

- Conta no [Railway](https://railway.app/)
- Repositório Git do projeto no GitHub

## 🚀 Deploy via Dashboard (CORRETO)

### 1. Criar Projeto Vazio

1. Acesse [railway.app](https://railway.app/)
2. Clique em **"New Project"**
3. Selecione **"Empty Project"**
4. Dê um nome: `its-done-production`

### 2. Adicionar PostgreSQL

1. No projeto, clique em **"+ New"**
2. Selecione **"Database" → "Add PostgreSQL"**
3. Railway criará automaticamente o banco

### 3. Adicionar Redis

1. Clique em **"+ New"**
2. Selecione **"Database" → "Add Redis"**
3. Railway criará automaticamente o Redis

### 4. Adicionar Backend (NestJS)

1. Clique em **"+ New"**
2. Selecione **"GitHub Repo"**
3. Escolha `its-done`
4. **IMPORTANTE**: Antes de fazer deploy, configure corretamente:

#### Via Dashboard UI (RECOMENDADO):

1. Vá em **Settings → General**:
   - **Service Name:** backend
   - **Root Directory:** (deixe VAZIO - não preencher nada)

2. Vá em **Settings → Build**:
   - **Builder:** Dockerfile
   - **Dockerfile Path:** `apps/backend/Dockerfile`
   - **Build Command:** (deixe vazio)

3. Se houver campo **"Docker Build Arguments"** ou similar:
   - Adicione: `DOCKER_BUILDKIT=1`

4. **CRÍTICO**: Se houver campo "Docker Build Context" ou "Context Directory":
   - Configure como: `.` (apenas um ponto)
   - Se não existir este campo, o Railway usará o Root Directory (que deve estar vazio)

#### Via Railway CLI (Alternativa):

```bash
railway service --name backend

# Criar arquivo railway.json na RAIZ do projeto:
{
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "apps/backend/Dockerfile",
    "dockerContext": "."
  }
}

# Depois fazer deploy:
railway up --service backend
```
6. Vá em **"Variables"** e adicione:

```env
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET=seu-jwt-secret-super-secreto-change-me
RESEND_API_KEY=re_xxxxxxxxxxxxx
FROM_EMAIL=noreply@seudominio.com
GOOGLE_CLIENT_ID=seu-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=seu-client-secret
RAILWAY_ENVIRONMENT=production
NODE_ENV=production
PORT=3002
```

7. **Adicionar Volume** para uploads:
   - Settings → Storage → Add Volume
   - Mount Path: `/app/data`
   - Size: 1GB

### 5. Adicionar Frontend (Next.js)

1. Clique em **"+ New"**
2. Selecione **"GitHub Repo"**
3. Escolha `its-done` (mesmo repo)
4. Vá em **"Settings" → "Build"**:
   - **Builder:** Dockerfile
   - **Dockerfile Path:** `apps/frontend/Dockerfile`
   - **Docker Build Context:** `.` (IMPORTANTE: ponto = raiz)
5. Vá em **"Variables"** e adicione:

```env
# NextAuth (ALTERE ESTES VALORES!)
NEXTAUTH_URL=${{Frontend.RAILWAY_PUBLIC_DOMAIN}}
NEXTAUTH_SECRET=seu-nextauth-secret-super-secreto-change-me

# API URL (Railway resolve automaticamente)
API_URL=${{Backend.RAILWAY_PRIVATE_DOMAIN}}:3002

# Google OAuth (mesmo do backend)
GOOGLE_CLIENT_ID=seu-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=seu-client-secret

# Next.js
NODE_ENV=production
PORT=3000
```

### 4. Configurar Volume (Backend)

Para persistir uploads de invoices:

1. No serviço **Backend**, vá em **Settings**
2. Clique em **"Add Volume"**
3. Configure:
   - **Mount Path:** `/app/data`
   - **Size:** 1GB ou mais
   - **Name:** backend-data

### 5. Deploy

1. Clique em **"Deploy"** em cada serviço
2. Aguarde o build (primeira vez: 5-10 minutos)
3. Verifique os logs para garantir que iniciou corretamente

### 6. Configurar Domínio

1. No serviço **Frontend**, vá em **Settings**
2. Em **"Domains"**, clique em **"Generate Domain"**
3. Railway gerará algo como: `its-done-production.up.railway.app`
4. Configure domínio customizado se desejar

## 📱 Deploy via Railway CLI

```bash
# 1. Instalar Railway CLI
npm i -g @railway/cli

# 2. Login
railway login

# 3. Inicializar projeto na pasta do repo
cd /caminho/para/its-done
railway init

# 4. Linkar ao projeto (se já existe)
railway link

# 5. Deploy
railway up

# 6. Adicionar variáveis de ambiente
railway variables set JWT_SECRET="seu-secret-super-secreto"
railway variables set NEXTAUTH_SECRET="seu-nextauth-secret"
railway variables set RESEND_API_KEY="re_xxxxx"
railway variables set FROM_EMAIL="noreply@seudominio.com"

# 7. Ver logs
railway logs
railway logs --service backend
railway logs --service frontend
```

## 🔐 Configurar Google OAuth

### 1. Google Cloud Console

1. Acesse [console.cloud.google.com](https://console.cloud.google.com/)
2. Crie ou selecione um projeto
3. Vá em **APIs & Services > Credentials**
4. Clique em **Create Credentials > OAuth 2.0 Client ID**
5. Configure:
   - **Application type:** Web application
   - **Authorized JavaScript origins:**
     - `https://seu-dominio.railway.app`
   - **Authorized redirect URIs:**
     - `https://seu-dominio.railway.app/api/auth/callback/google`
6. Copie **Client ID** e **Client Secret**

### 2. Adicionar ao Railway

```bash
railway variables set GOOGLE_CLIENT_ID="seu-client-id.apps.googleusercontent.com"
railway variables set GOOGLE_CLIENT_SECRET="seu-client-secret"
```

Ou adicione pelo Dashboard em cada serviço (Backend e Frontend).

### 3. Reiniciar Serviços

```bash
railway service restart backend
railway service restart frontend
```

## 🗄️ Migrations do Prisma

### Primeira Deploy

As migrations são executadas automaticamente pelo script `migrate-with-backup.sh` no CMD do Dockerfile.

### Adicionar Nova Migration

```bash
# 1. Localmente, crie a migration
cd apps/backend
npx prisma migrate dev --name add_new_feature

# 2. Commit e push
git add prisma/migrations/
git commit -m "feat: add new migration"
git push

# 3. Railway fará deploy automático e executará a migration

# 4. Ou execute manualmente
railway run --service backend npx prisma migrate deploy
```

### Verificar Migrations

```bash
# Ver status das migrations
railway run --service backend npx prisma migrate status

# Ver dados (abre Prisma Studio localmente conectado ao Railway)
railway run --service backend npx prisma studio
```

## 📊 Monitoramento e Logs

### Ver Logs em Tempo Real

```bash
# Todos os serviços
railway logs

# Serviço específico
railway logs --service backend
railway logs --service frontend
railway logs --service postgres

# Últimas 100 linhas
railway logs --tail 100
```

### Métricas no Dashboard

No Railway Dashboard, cada serviço mostra:
- **CPU usage**
- **Memory usage**
- **Network traffic**
- **Build time**
- **Deploy history**

### Health Checks

Adicione ao `docker-compose.yml`:

```yaml
services:
  backend:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3002/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

## 🐛 Troubleshooting

### Build Falha

**Sintoma:** Build falha no Railway

**Soluções:**

1. **Ver logs do build:**
   ```bash
   railway logs --build
   ```

2. **Testar build localmente:**
   ```bash
   docker compose up -d --build
   docker compose logs -f
   ```

3. **Limpar cache no Railway:**
   - Dashboard > Settings > "Clear Build Cache"
   - Tente deploy novamente

4. **Verificar Dockerfile:**
   ```bash
   # Verificar se stage runner existe
   grep "FROM.*AS runner" apps/backend/Dockerfile
   grep "FROM.*AS runner" apps/frontend/Dockerfile
   ```

### Backend Não Conecta ao Banco

**Sintoma:** Erro de conexão com PostgreSQL

**Soluções:**

1. **Verificar variável DATABASE_URL:**
   ```bash
   railway variables get DATABASE_URL --service backend
   ```

2. **Usar variável do Railway:**
   ```env
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   ```

3. **Verificar se Postgres está rodando:**
   ```bash
   railway logs --service postgres
   ```

### Frontend Não Encontra Backend

**Sintoma:** Frontend retorna erros de API

**Soluções:**

1. **Usar URL privada do Railway:**
   ```env
   API_URL=${{Backend.RAILWAY_PRIVATE_DOMAIN}}:3002
   ```

2. **Ou configurar rede interna:**
   ```env
   API_URL=http://backend:3002
   ```

3. **Verificar se backend está rodando:**
   ```bash
   railway logs --service backend | grep "Application is running"
   ```

### Migrations Não Executam

**Sintoma:** Tabelas não existem no banco

**Soluções:**

1. **Executar migrations manualmente:**
   ```bash
   railway run --service backend npx prisma migrate deploy
   ```

2. **Verificar logs do backend:**
   ```bash
   railway logs --service backend | grep migration
   ```

3. **Resetar banco (CUIDADO!):**
   ```bash
   railway run --service backend npx prisma migrate reset --force
   ```

### Google OAuth Não Funciona

**Sintoma:** Erro ao fazer login com Google

**Verificações:**

1. **Variáveis configuradas:**
   ```bash
   railway variables get GOOGLE_CLIENT_ID
   railway variables get GOOGLE_CLIENT_SECRET
   ```

2. **Callback URL no Google Cloud:**
   - Deve ser: `https://seu-dominio.railway.app/api/auth/callback/google`
   - Verifique se está exatamente igual

3. **NEXTAUTH_URL correto:**
   ```bash
   railway variables get NEXTAUTH_URL --service frontend
   # Deve retornar: https://seu-dominio.railway.app
   ```

### Out of Memory

**Sintoma:** Container reiniciando por falta de memória

**Soluções:**

1. **Aumentar limite de memória:**
   - Dashboard > Service > Settings > "Memory Limit"
   - Aumentar para 2GB ou mais

2. **Otimizar build:**
   - Remover dev dependencies no production
   - Usar multi-stage builds (já configurado)

3. **Verificar memory leaks:**
   ```bash
   railway logs --service backend | grep "memory"
   ```

## 💰 Custos e Planos

### Free Trial
- $5 de crédito mensal
- Suficiente para testes e desenvolvimento

### Estimativa para It's Done

**Plano Hobby (~$5/mês por serviço):**
- Backend: ~$10-15/mês
- Frontend: ~$5-10/mês
- PostgreSQL: ~$5/mês
- Redis: ~$5/mês
- **Total:** ~$25-35/mês

**Plano Pro (~$20/mês por serviço):**
- Mais recursos (CPU, RAM)
- Backups automáticos
- Suporte prioritário
- **Total:** ~$80-100/mês

### Otimizar Custos

1. **Usar sleep mode:**
   - Frontend e Backend dormem após 30min sem uso
   - Acordam automaticamente quando recebem request

2. **Compartilhar banco:**
   - Usar mesmo PostgreSQL para múltiplos ambientes

3. **Monitorar uso:**
   - Dashboard > Usage > Ver consumo mensal
   - Ajustar recursos conforme necessário

## 🔒 Segurança

### Secrets e Variáveis

```bash
# NUNCA comitar secrets
# Use variáveis de ambiente do Railway

# Boas práticas:
- JWT_SECRET: mínimo 32 caracteres
- NEXTAUTH_SECRET: mínimo 32 caracteres
- Trocar secrets em produção
```

### Gerar Secrets Seguros

```bash
# Gerar secret aleatório
openssl rand -base64 32

# Ou usar Railway CLI
railway variables set JWT_SECRET="$(openssl rand -base64 32)"
railway variables set NEXTAUTH_SECRET="$(openssl rand -base64 32)"
```

### Backup do Banco

```bash
# Backup manual
railway run --service postgres pg_dump -U postgres its_done > backup_$(date +%Y%m%d).sql

# Restaurar
railway run --service postgres psql -U postgres its_done < backup.sql
```

**Recomendação:** Configure backups automáticos no plano Pro.

## 🚀 CI/CD Automático

### Deploy Automático no Push

Railway faz deploy automático quando você faz push para `main`:

```bash
git add .
git commit -m "feat: nova feature"
git push origin main

# Railway detecta push e faz deploy automático
```

### Configurar Branch de Deploy

No Railway Dashboard:
1. Service > Settings > "Deploy Branch"
2. Escolha a branch (ex: `main`, `production`)
3. Railway só fará deploy de commits nessa branch

### Preview Deployments

Para testar branches antes de mergear:

1. Railway > Settings > "Enable PR Previews"
2. Cada PR criará um ambiente temporário
3. Teste nesse ambiente antes de mergear

## 📦 Configurações Avançadas

### railway.json (Opcional)

Crie na raiz para configurações customizadas:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "docker-compose.yml"
  },
  "deploy": {
    "numReplicas": 1,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10,
    "healthcheckPath": "/health",
    "healthcheckTimeout": 100
  }
}
```

### Variáveis por Ambiente

```bash
# Desenvolvimento
railway link --environment development
railway variables set NODE_ENV=development

# Produção
railway link --environment production
railway variables set NODE_ENV=production
```

### Executar Comandos One-off

```bash
# Seed do banco
railway run --service backend pnpm db:seed

# Executar script
railway run --service backend node scripts/migrate-data.js

# Shell interativo
railway run --service backend sh
```

## 🔄 Workflow Completo

### 1. Desenvolvimento Local

```bash
# Trabalhar localmente com hot reload
docker compose -f docker-compose.dev.yml up -d

# Fazer mudanças, testar, commit
git add .
git commit -m "feat: nova feature"
```

### 2. Testar Build de Produção

```bash
# Testar build como Railway vai fazer
docker compose down
docker compose up -d --build

# Verificar se funciona
curl http://localhost:3002/health
curl http://localhost:3000

# Se OK, continuar
```

### 3. Deploy

```bash
# Push para GitHub
git push origin main

# Railway faz deploy automático

# Verificar logs
railway logs --service backend
railway logs --service frontend

# Se tudo OK, testar produção
curl https://seu-app.railway.app/health
```

### 4. Monitorar

```bash
# Ver métricas no Dashboard
# Ou via CLI
railway metrics
railway logs --tail 100
```

## 📚 Links Úteis

- **Railway Dashboard:** [railway.app/dashboard](https://railway.app/dashboard)
- **Railway Docs:** [docs.railway.app](https://docs.railway.app/)
- **Railway CLI:** [docs.railway.app/develop/cli](https://docs.railway.app/develop/cli)
- **Support:** [help.railway.app](https://help.railway.app/)

## 📝 Checklist de Deploy

- [ ] Criar conta no Railway
- [ ] Conectar repositório GitHub
- [ ] Configurar variáveis de ambiente (Backend)
- [ ] Configurar variáveis de ambiente (Frontend)
- [ ] Configurar Google OAuth (se usar)
- [ ] Adicionar volume para uploads (Backend)
- [ ] Fazer primeiro deploy
- [ ] Verificar logs (sem erros)
- [ ] Testar aplicação no domínio Railway
- [ ] Configurar domínio customizado (opcional)
- [ ] Configurar backups (Plano Pro)
- [ ] Monitorar métricas e custos

## 📚 Arquivos Relacionados

- **DOCKER.md** - Guia completo de Docker
- **CLAUDE.md** - Arquitetura do projeto
- **.env.example** - Template de variáveis

---

**Atualizado:** 29 Out 2025
**Versão:** 1.0
