# 🚀 Deploy no Railway - Guia Completo

Este guia detalha como fazer deploy do monorepo Its Done no Railway utilizando Dockerfiles.

## 📋 Pré-requisitos

- Conta no [Railway](https://railway.app)
- Repositório Git (GitHub/GitLab/Bitbucket)
- CLI do Railway instalado (opcional)

## 🏗 Arquitetura de Deploy

O projeto será deployado como **3 serviços separados**:

1. **PostgreSQL Database** (Railway Template)
2. **Backend API** (NestJS + Docker)
3. **Frontend Web** (Next.js + Docker)

## 🚀 Passo a Passo

### 1. Preparação do Repositório

Certifique-se de que todos os arquivos estão commitados:

```bash
git add .
git commit -m "feat: add Railway deployment configuration"
git push origin main
```

### 2. Criar Projeto no Railway

1. Acesse [Railway Dashboard](https://railway.app/dashboard)
2. Clique em **"New Project"**
3. Selecione **"Deploy from GitHub repo"**
4. Conecte seu repositório `its-done`

### 3. Configurar Database (PostgreSQL)

1. No projeto Railway, clique em **"+ New Service"**
2. Selecione **"Database"** → **"PostgreSQL"**
3. Anote as credenciais geradas automaticamente

### 4. Deploy do Backend (Automático ⚡)

1. Clique em **"+ New Service"** → **"GitHub Repo"**
2. Selecione o repositório `its-done`
3. **Railway detectará automaticamente:**

   - ✅ **Dockerfile**: `apps/backend/Dockerfile` (detecção automática)
   - ✅ **Build Process**: Multi-stage build otimizado
   - ✅ **Health Check**: Endpoint `/health` configurado
   - ✅ **Port**: 3002 (exposição automática)

4. **Deploy Automático:**

   - ⚡ Railway iniciará o build automaticamente
   - 📦 Build em 3 stages: deps → builder → runtime
   - 🔒 Container seguro com usuário não-root
   - 🚀 Deploy automático após sucesso do build

5. **Configurar Railway Volume (Recomendado):**

   - Vá em **Settings** → **Volumes**
   - Clique em **"New Volume"**
   - **Mount Path**: `/app/data`
   - **Size**: 1GB (ou conforme necessário)
   - Clique em **"Add Volume"**

6. **Configurar Variáveis de Ambiente:**

   ```env
   # Database (usar as credenciais do PostgreSQL criado)
   DATABASE_URL=${{PostgreSQL.DATABASE_URL}}

   # JWT
   JWT_SECRET=sua_chave_jwt_super_segura_aqui

   # Railway Storage (prioritário se Volume configurado)
   RAILWAY_ENVIRONMENT=production
   RAILWAY_VOLUME_PATH=/app/data

   # Email - Resend
   RESEND_API_KEY=re_sua_chave_resend
   FROM_EMAIL=noreply@seudominio.com

   # Google OAuth (opcional)
   GOOGLE_CLIENT_ID=seu_google_client_id
   GOOGLE_CLIENT_SECRET=seu_google_client_secret

   # AWS S3 (fallback opcional)
   AWS_ACCESS_KEY_ID=sua_aws_access_key
   AWS_SECRET_ACCESS_KEY=sua_aws_secret_key
   AWS_S3_BUCKET=seu-bucket-nome
   AWS_REGION=us-east-1

   # Production
   NODE_ENV=production
   PORT=3002
   ```

### 7. Deploy do Frontend (Automático ⚡)

1. Clique em **"+ New Service"** → **"GitHub Repo"**
2. Selecione o repositório `its-done`
3. **Railway detectará automaticamente:**

   - ✅ **Dockerfile**: `apps/frontend/Dockerfile` (detecção automática)
   - ✅ **Next.js**: Standalone output configurado
   - ✅ **Build Process**: Multi-stage otimizado
   - ✅ **Port**: 3000 (exposição automática)

4. **Deploy Automático:**

   - ⚡ Railway iniciará o build automaticamente
   - 📦 Build otimizado com cache de dependências
   - 🔒 Container seguro com usuário não-root
   - 🚀 Deploy automático após sucesso do build

5. **Configurar Variáveis de Ambiente:**

   ```env
   # NextAuth
   NEXTAUTH_URL=${{RAILWAY_STATIC_URL}}
   NEXTAUTH_SECRET=sua_chave_nextauth_super_segura

   # API URL (usar a URL do serviço backend)
   API_URL=${{backend.RAILWAY_STATIC_URL}}

   # Production
   NODE_ENV=production
   PORT=3000
   ```

### 8. Configurar Networking

1. **Backend**: Gerar domínio público

   - Vá em Settings → Networking
   - Clique em "Generate Domain"
   - Anote a URL (ex: `backend-production-xxx.up.railway.app`)

2. **Frontend**: Gerar domínio público
   - Vá em Settings → Networking
   - Clique em "Generate Domain"
   - Anote a URL (ex: `frontend-production-xxx.up.railway.app`)

### 9. Executar Migrações

Acesse o terminal do serviço backend:

```bash
cd apps/backend
pnpm prisma migrate deploy
pnpm prisma db seed
```

## 🔧 Comandos Úteis

### CLI do Railway

```bash
# Instalar CLI
npm install -g @railway/cli

# Login
railway login

# Conectar ao projeto
railway link

# Ver logs
railway logs

# Executar comandos no serviço
railway run pnpm prisma migrate deploy
```

### Troubleshooting

#### ⚠️ Build Timeout/Stuck no `pnpm install`

Se o build estiver travando no `pnpm install --frozen-lockfile`:

```bash
# 1. Verificar logs em tempo real
railway logs --follow --service backend

# 2. Restart do build (força rebuild)
railway service redeploy

# 3. Verificar se dependencies estão corretas
git log --oneline -10  # Verificar últimos commits
```

**✅ Otimizações implementadas no Dockerfile:**

- Multi-stage build para reduzir tamanho e melhorar cache
- Timeout de rede aumentado (300s) para downloads lentos
- Registry configurado para evitar problemas de conectividade
- Health check automático com endpoint `/health`
- Container não-root para segurança em produção
- Cache de layers otimizado para builds mais rápidos

#### Build Failure

```bash
# Limpar cache de build
railway service disconnect
railway service connect

# Verificar logs detalhados
railway logs --service backend
railway logs --service frontend

# Restart do deploy
railway service redeploy
```

#### Database Connection

```bash
# Testar conexão do banco
railway connect PostgreSQL

# Verificar variáveis de ambiente
railway variables --service backend
```

#### Verificação de Deploy Automático

```bash
# Verificar status dos serviços
railway status

# Ver última atividade de deploy
railway deployments --service backend
railway deployments --service frontend
```

## 📊 Monitoramento

### Logs em Tempo Real

```bash
railway logs --follow --service backend
railway logs --follow --service frontend
```

### Métricas

- CPU/RAM usage: Railway Dashboard
- Response time: Built-in metrics
- Database queries: PostgreSQL insights

## 🔒 Segurança

### Variáveis Sensíveis

- Todas as chaves devem ser únicas para produção
- Use geradores de senha seguros
- Configure CORS adequadamente

### HTTPS

- Railway fornece HTTPS automaticamente
- Configure `NEXTAUTH_URL` com HTTPS

### Database

- Backups automáticos habilitados
- Conexões criptografadas por padrão

## 🚀 Otimizações

### Performance

```dockerfile
# Backend Dockerfile já otimizado com:
# - Multi-stage build
# - Node.js Alpine (menor footprint)
# - Cache layers eficientes

# Frontend Dockerfile já otimizado com:
# - Standalone output
# - Static asset optimization
# - Non-root user
```

### Custos

- **Database**: $5/mês (Postgres)
- **Backend**: $5/mês (512MB RAM)
- **Frontend**: $5/mês (512MB RAM)
- **Volume Storage**: $0.25/GB/mês (1GB = $0.25/mês)
- **Total**: ~$15.25/mês (com 1GB volume)

## 📝 Checklist Final

- [ ] Todos os serviços deployados
- [ ] Railway Volume configurado (1GB+)
- [ ] Variáveis de ambiente configuradas
- [ ] Domínios gerados e funcionando
- [ ] Migrações executadas
- [ ] Seed de dados rodado
- [ ] Frontend consegue se comunicar com Backend
- [ ] Autenticação funcionando
- [ ] Upload de arquivos funcionando (testar Railway Volume)
- [ ] Emails sendo enviados
- [ ] Storage info endpoint funcionando (`/invoices/upload-info`)

## 🔄 Atualizações

### Deploy Automático

```bash
# Cada push para main fará deploy automático
git push origin main
```

### Deploy Manual

```bash
# Via Railway CLI
railway up --service backend
railway up --service frontend
```

## 📞 Suporte

- [Railway Docs](https://docs.railway.app)
- [Railway Discord](https://discord.gg/railway)
- Logs detalhados no Railway Dashboard
