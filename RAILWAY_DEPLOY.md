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

### 4. Deploy do Backend

1. Clique em **"+ New Service"** → **"GitHub Repo"**
2. Selecione o repositório `its-done`
3. **Configure o serviço:**

   - **Root Directory**: `/apps/backend`
   - **Build Command**: `docker build -f Dockerfile ../..`
   - **Start Command**: `pnpm start:prod`

4. **Configurar Variáveis de Ambiente:**

   ```env
   # Database (usar as credenciais do PostgreSQL criado)
   DATABASE_URL=${{PostgreSQL.DATABASE_URL}}

   # JWT
   JWT_SECRET=sua_chave_jwt_super_segura_aqui

   # Email - Resend
   RESEND_API_KEY=re_sua_chave_resend
   FROM_EMAIL=noreply@seudominio.com

   # Google OAuth (opcional)
   GOOGLE_CLIENT_ID=seu_google_client_id
   GOOGLE_CLIENT_SECRET=seu_google_client_secret

   # AWS S3 (opcional)
   AWS_ACCESS_KEY_ID=sua_aws_access_key
   AWS_SECRET_ACCESS_KEY=sua_aws_secret_key
   AWS_S3_BUCKET=seu-bucket-nome
   AWS_REGION=us-east-1

   # Production
   NODE_ENV=production
   PORT=3002
   ```

### 5. Deploy do Frontend

1. Clique em **"+ New Service"** → **"GitHub Repo"**
2. Selecione o repositório `its-done`
3. **Configure o serviço:**

   - **Root Directory**: `/apps/frontend`
   - **Build Command**: `docker build -f Dockerfile ../..`
   - **Start Command**: `node server.js`

4. **Configurar Variáveis de Ambiente:**

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

### 6. Configurar Networking

1. **Backend**: Gerar domínio público

   - Vá em Settings → Networking
   - Clique em "Generate Domain"
   - Anote a URL (ex: `backend-production-xxx.up.railway.app`)

2. **Frontend**: Gerar domínio público
   - Vá em Settings → Networking
   - Clique em "Generate Domain"
   - Anote a URL (ex: `frontend-production-xxx.up.railway.app`)

### 7. Executar Migrações

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

#### Build Failure

```bash
# Limpar cache de build
railway service disconnect
railway service connect

# Verificar logs
railway logs --service backend
railway logs --service frontend
```

#### Database Connection

```bash
# Testar conexão do banco
railway connect PostgreSQL
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
- **Total**: ~$15/mês

## 📝 Checklist Final

- [ ] Todos os serviços deployados
- [ ] Variáveis de ambiente configuradas
- [ ] Domínios gerados e funcionando
- [ ] Migrações executadas
- [ ] Seed de dados rodado
- [ ] Frontend consegue se comunicar com Backend
- [ ] Autenticação funcionando
- [ ] Upload de arquivos funcionando
- [ ] Emails sendo enviados

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
