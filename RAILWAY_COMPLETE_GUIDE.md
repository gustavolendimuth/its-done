# 🚂 Railway - Guia Completo de Deploy

**Its-Done** - Sistema de Gestão de Projetos e Controle de Horas

> 📋 **Guia único e completo** com todas as informações para deploy no Railway

---

## 🎯 **Visão Geral**

**Its-Done** é um sistema completo de gestão de projetos que inclui:

- 👥 **Gestão de Clientes** e Projetos
- ⏱️ **Controle de Horas** trabalhadas
- 📄 **Geração de Faturas** automáticas
- 📊 **Relatórios** e Analytics
- ☁️ **Upload de Arquivos** (Railway Volume + S3 fallback)
- 🔐 **Autenticação** JWT + Google OAuth

### **Arquitetura no Railway:**

- **Backend**: NestJS (API REST + Prisma ORM)
- **Frontend**: Next.js (SSR + Client Components)
- **Database**: PostgreSQL (Railway managed)
- **Storage**: Railway Volume (1GB) + AWS S3 fallback
- **Deploy**: Dockerfiles otimizados (single-stage)

---

## ✅ **Pré-requisitos**

### **1. Contas Necessárias:**

- ✅ [Railway Account](https://railway.app/) (GitHub login)
- ✅ [GitHub Account](https://github.com/) (código fonte)
- 🔵 [Google Console](https://console.cloud.google.com/) (OAuth opcional)
- 📧 [Resend Account](https://resend.com/) (emails opcional)
- ☁️ [AWS Account](https://aws.amazon.com/) (S3 fallback opcional)

### **2. Repositório:**

- ✅ Fork ou clone do repositório `its-done`
- ✅ Código no GitHub (público ou privado)

### **3. Arquivos Obrigatórios:**

```
its-done/
├── apps/backend/Dockerfile ✅
├── apps/frontend/Dockerfile ✅
├── apps/backend/railway.toml ✅
├── apps/frontend/railway.toml ✅
├── railway.toml ✅
└── docker-compose.yml ✅
```

---

## 🗄️ **1. Setup do PostgreSQL**

### **Criar Database**

1. Faça login no [Railway Dashboard](https://railway.app/dashboard)
2. Clique em **"+ New Project"**
3. Clique em **"+ New Service"** → **"Database"** → **"PostgreSQL"**
4. ✅ Database será criado automaticamente

### **Anotar Credenciais**

1. Clique no serviço **PostgreSQL**
2. Vá em **"Variables"**
3. ✅ Anote o valor de `DATABASE_URL`
4. 📋 Formato: `postgresql://user:password@host:port/database`

> ⚠️ **Importante**: Use `${{PostgreSQL.DATABASE_URL}}` nas variáveis do backend

---

## 🎯 **2. Deploy do Backend**

### **Conectar Repositório**

1. No Railway Dashboard: **"+ New Service"** → **"GitHub Repo"**
2. Selecione o repositório `its-done`
3. ✅ Railway detectará automaticamente o Dockerfile

### **Configuração Automática**

Railway detectará e usará automaticamente:

- ✅ **Builder**: Dockerfile (via `railway.toml`)
- ✅ **Path**: `apps/backend/Dockerfile`
- ✅ **Port**: 3002 (auto-exposição)
- ✅ **Health Check**: `curl http://127.0.0.1:3002/health`

### **Build Process**

```bash
# Dockerfile otimizado (single-stage):
📦 Install: PNPM + Dependencies
🔨 Build: TypeScript → JavaScript (pnpm run build)
🏗️ Prisma: Generate client
✅ Result: dist/main.js (2665 bytes)
```

> ✅ **Build funcionando**: O NestJS agora compila corretamente e gera o `dist/main.js`

> ⚠️ **Se Railway tentar usar Nixpacks**: Vá em **Settings → Build** e mude para **"Dockerfile"**

---

## 🔐 **3. Configuração de Variáveis (Backend)**

### **⚠️ CRÍTICO - Variáveis Obrigatórias**

> 🚨 **Health check falhará** se essas variáveis não estiverem configuradas!

Vá em **Settings → Variables** do serviço **backend**:

#### **🗄️ Database (CRÍTICO)**

```env
DATABASE_URL=${{PostgreSQL.DATABASE_URL}}
```

> ⚠️ Use **exatamente** `${{PostgreSQL.DATABASE_URL}}` - Railway substituirá automaticamente

#### **🔐 JWT Secret (CRÍTICO)**

```env
JWT_SECRET=sua_chave_jwt_super_segura_de_pelo_menos_32_caracteres
```

**Gerar JWT Secret seguro:**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### **🌍 Environment (CRÍTICO)**

```env
NODE_ENV=production
PORT=3002
RAILWAY_ENVIRONMENT=production
```

### **📧 Variáveis Opcionais**

#### **Email (Resend)**

```env
RESEND_API_KEY=re_sua_chave_resend
FROM_EMAIL=noreply@seudominio.com
```

#### **🔵 Google OAuth**

```env
GOOGLE_CLIENT_ID=seu_google_client_id
GOOGLE_CLIENT_SECRET=seu_google_client_secret
```

#### **☁️ AWS S3 (Fallback)**

```env
AWS_ACCESS_KEY_ID=sua_aws_access_key
AWS_SECRET_ACCESS_KEY=sua_aws_secret_key
AWS_S3_BUCKET=seu-bucket-nome
AWS_REGION=us-east-1
```

#### **🚂 Railway Volume**

```env
RAILWAY_VOLUME_PATH=/app/data
```

---

## 🎯 **4. Deploy do Frontend**

### **Novo Serviço**

1. **"+ New Service"** → **"GitHub Repo"**
2. Selecione o **mesmo repositório** `its-done`
3. ✅ Railway criará um **segundo serviço** automaticamente

### **Configuração Automática**

- ✅ **Builder**: Dockerfile (via `railway.toml`)
- ✅ **Path**: `apps/frontend/Dockerfile`
- ✅ **Next.js**: Standalone output configurado
- ✅ **Port**: 3000 (auto-exposição)

### **Build Process**

```bash
📦 Install: PNPM + Dependencies
🔨 Build: Next.js → Standalone
✅ Result: Optimized production server
```

---

## 🔐 **5. Configuração de Variáveis (Frontend)**

Vá em **Settings → Variables** do serviço **frontend**:

### **🔐 NextAuth (CRÍTICO)**

```env
NEXTAUTH_SECRET=sua_chave_nextauth_super_segura_de_pelo_menos_32_caracteres
NEXTAUTH_URL=${{RAILWAY_STATIC_URL}}
```

**Gerar NEXTAUTH_SECRET:**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### **🌐 API Connection (CRÍTICO)**

```env
API_URL=${{backend.RAILWAY_STATIC_URL}}
```

### **🌍 Environment**

```env
NODE_ENV=production
PORT=3000
```

---

## 💾 **6. Railway Volume (Opcional)**

### **Configurar Volume**

1. Vá no serviço **backend** → **Settings** → **Volumes**
2. Clique em **"New Volume"**
   - **Mount Path**: `/app/data`
   - **Size**: 1GB (ou conforme necessário)
3. Clique em **"Add Volume"**

### **Sistema de Storage Inteligente**

O backend usa fallback automático:

```
1º Railway Volume (/app/data/uploads)
    ↓ (se falhar)
2º AWS S3 (configurado via env vars)
    ↓ (se falhar)
3º Local Storage (./uploads)
```

### **Verificar Storage**

Endpoint de diagnóstico: `GET /invoices/upload-info`

```json
{
  "storage": "railway" | "s3" | "local",
  "railwayVolume": {
    "available": true,
    "path": "/app/data/uploads"
  }
}
```

---

## 🌐 **7. Networking**

### **Gerar Domínios**

#### **Backend:**

1. Serviço backend → **Settings** → **Networking**
2. **"Generate Domain"**
3. 📋 Anote: `backend-production-xxx.up.railway.app`

#### **Frontend:**

1. Serviço frontend → **Settings** → **Networking**
2. **"Generate Domain"**
3. 📋 Anote: `frontend-production-xxx.up.railway.app`

### **Comunicação entre Serviços**

- Frontend → Backend: `${{backend.RAILWAY_STATIC_URL}}`
- Railway gerencia networking interno automaticamente

---

## 🔄 **8. Migrações**

### **Executar via Railway Shell**

```bash
# Conectar ao terminal do backend
railway shell --service backend

# Executar migrações
cd apps/backend
pnpm prisma migrate deploy
pnpm prisma db seed
```

### **Executar via CLI**

```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login e conectar
railway login
railway link

# Executar comandos
railway run --service backend pnpm prisma migrate deploy
railway run --service backend pnpm prisma db seed
```

---

## 🩺 **9. Troubleshooting**

### **❌ Health Check Falhando**

#### **1. Verificar Variáveis**

```bash
railway logs --service backend --follow
```

Procure por:

```
🚀 Starting application bootstrap...
📋 Environment variables:
- DATABASE_URL: configured ✅
- JWT_SECRET: configured ✅
```

Se vir **❌ MISSING**, configure a variável!

#### **2. Testar Health Check**

Vá para: `https://seu-backend-url.up.railway.app/health`

Deve retornar:

```json
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "database": "connected",
  "environment": {
    "NODE_ENV": "production",
    "DATABASE_URL": "configured",
    "JWT_SECRET": "configured",
    "RAILWAY_ENVIRONMENT": "production",
    "PORT": "3002"
  }
}
```

#### **3. Forçar Dockerfile**

Se Railway usar Nixpacks:

1. **Settings** → **Build**
2. Mude **Builder** para **"Dockerfile"**
3. **Dockerfile Path**:
   - Backend: `apps/backend/Dockerfile`
   - Frontend: `apps/frontend/Dockerfile`

### **❌ Build Timeout ou Arquivo main.js não encontrado**

#### **1. Problemas com NestJS Build**

Se ver logs como "Nenhum main file encontrado":

```bash
# Verificar logs detalhados
railway logs --service backend --follow

# Procurar por:
# 🔨 Executando build NestJS...
# 📋 Debug info: (versões e tentativas de build)
# 📦 Verificando build final: (resultado)
```

#### **2. Restart Build**

```bash
# Restart Build
railway service redeploy --service backend
railway service redeploy --service frontend

# Verificar Logs
railway logs --service backend
railway logs --service frontend

# Limpar Cache
railway service disconnect
railway service connect
```

#### **3. Verificar Build Localmente**

```bash
# Testar build local
cd apps/backend
pnpm install
pnpm prisma generate
pnpm run build

# Verificar se dist/main.js foi criado
ls -la dist/
```

### **❌ Database Connection**

```bash
# Verificar PostgreSQL status
railway status

# Testar Conexão
railway connect PostgreSQL

# Re-gerar DATABASE_URL (se necessário)
# Delete e recrie o PostgreSQL service
```

### **❌ Frontend não carrega**

```bash
# Verificar API_URL
railway variables --service frontend

# Logs do Frontend
railway logs --service frontend --follow
```

---

## 💰 **10. Custos**

### **Estimativa Mensal (USD)**

| Serviço            | Recursos             | Custo/mês   |
| ------------------ | -------------------- | ----------- |
| **PostgreSQL**     | 1GB RAM, 1GB Storage | $5.00       |
| **Backend**        | 512MB RAM, 1GB Disk  | $5.00       |
| **Frontend**       | 512MB RAM, 1GB Disk  | $5.00       |
| **Railway Volume** | 1GB Storage          | $0.25       |
| **Total**          |                      | **~$15.25** |

### **Tier Gratuito**

- ✅ $5.00 de crédito mensal grátis
- ⚠️ **Custo real**: ~$10.25/mês após créditos

---

## ✅ **11. Checklist Final**

### **📋 Pré-Deploy**

- [ ] PostgreSQL criado e rodando
- [ ] Repositório conectado ao Railway
- [ ] `railway.toml` files no repositório
- [ ] Dockerfiles otimizados

### **🔐 Variáveis Backend**

- [ ] `DATABASE_URL=${{PostgreSQL.DATABASE_URL}}`
- [ ] `JWT_SECRET=<32+ characters>`
- [ ] `NODE_ENV=production`
- [ ] `PORT=3002`
- [ ] `RAILWAY_ENVIRONMENT=production`

### **🔐 Variáveis Frontend**

- [ ] `NEXTAUTH_SECRET=<32+ characters>`
- [ ] `NEXTAUTH_URL=${{RAILWAY_STATIC_URL}}`
- [ ] `API_URL=${{backend.RAILWAY_STATIC_URL}}`
- [ ] `NODE_ENV=production`

### **🚀 Deploy Verificado**

- [ ] Backend health check: `/health` retorna `200`
- [ ] Frontend carrega: página de login visível
- [ ] Database conectado: health check mostra "connected"
- [ ] Storage funcionando: upload info disponível

### **🔄 Pós-Deploy**

- [ ] Migrações executadas: `pnpm prisma migrate deploy`
- [ ] Seed data criado: `pnpm prisma db seed`
- [ ] Domínios configurados e funcionando

---

## 🚀 **12. Comandos Úteis**

### **Setup Inicial**

```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login e conectar
railway login
railway link
```

### **Deploy & Monitoring**

```bash
# Redeploy
railway service redeploy --service backend
railway service redeploy --service frontend

# Logs em tempo real
railway logs --service backend --follow

# Status
railway status

# Conectar ao database
railway connect PostgreSQL
```

### **Debugging**

```bash
# Variáveis de ambiente
railway variables --service backend
railway variables --service frontend

# Shell no container
railway shell --service backend

# Métricas
railway metrics --service backend
```

---

**🎉 Parabéns! Seu sistema Its-Done está rodando no Railway!**

> 💡 **Dica**: Este guia contém tudo que você precisa para gerenciar sua aplicação no Railway. Salve para referência futura!

---

### **📞 Suporte**

- 📚 [Railway Docs](https://docs.railway.app/)
- 💬 [Railway Discord](https://discord.gg/railway)
- 📖 [README.md](./README.md)
