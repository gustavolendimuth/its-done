# 🔧 Railway - Configuração de Variáveis de Ambiente

## ⚠️ Health Check Falhando?

Se o health check estiver falhando com "service unavailable", pode ser por dois motivos:

1. **Variáveis de ambiente obrigatórias** não foram configuradas
2. **Problema de rede** - health check usando `localhost` em vez de `127.0.0.1` (✅ já corrigido)

> ✅ **Correção aplicada**: Health check agora usa `curl` com `127.0.0.1` para maior compatibilidade com containers

## 📋 **1. Variáveis Obrigatórias (Backend)**

Vá em **Settings → Variables** do serviço **backend** e adicione:

### 🗄️ **Database (CRÍTICO)**

```env
DATABASE_URL=${{PostgreSQL.DATABASE_URL}}
```

> ⚠️ **IMPORTANTE**: Use exatamente `${{PostgreSQL.DATABASE_URL}}` - o Railway substituirá automaticamente

### 🔐 **JWT Secret (CRÍTICO)**

```env
JWT_SECRET=sua_chave_jwt_super_segura_de_pelo_menos_32_caracteres
```

### 🌍 **Environment**

```env
NODE_ENV=production
PORT=3002
RAILWAY_ENVIRONMENT=production
```

## 📋 **2. Variáveis Opcionais (Backend)**

### 📧 **Email (Resend)**

```env
RESEND_API_KEY=re_sua_chave_resend
FROM_EMAIL=noreply@seudominio.com
```

### 🔵 **Google OAuth**

```env
GOOGLE_CLIENT_ID=seu_google_client_id
GOOGLE_CLIENT_SECRET=seu_google_client_secret
```

### ☁️ **AWS S3 (Fallback)**

```env
AWS_ACCESS_KEY_ID=sua_aws_access_key
AWS_SECRET_ACCESS_KEY=sua_aws_secret_key
AWS_S3_BUCKET=seu-bucket-nome
AWS_REGION=us-east-1
```

### 🚂 **Railway Volume**

```env
RAILWAY_VOLUME_PATH=/app/data
```

## 📋 **3. Variáveis Frontend**

Vá em **Settings → Variables** do serviço **frontend** e adicione:

### 🔐 **NextAuth (CRÍTICO)**

```env
NEXTAUTH_SECRET=sua_chave_nextauth_super_segura_de_pelo_menos_32_caracteres
NEXTAUTH_URL=${{RAILWAY_STATIC_URL}}
```

### 🌐 **API Connection (CRÍTICO)**

```env
API_URL=${{backend.RAILWAY_STATIC_URL}}
```

### 🌍 **Environment**

```env
NODE_ENV=production
PORT=3000
```

## 🚀 **4. Passo a Passo de Configuração**

### **4.1. Database Setup**

1. No Railway, crie um **PostgreSQL Database**
2. Copie a **DATABASE_URL** do banco
3. No backend, adicione: `DATABASE_URL=${{PostgreSQL.DATABASE_URL}}`

### **4.2. JWT Secrets**

```bash
# Gerar JWT_SECRET seguro
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Gerar NEXTAUTH_SECRET seguro
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### **4.3. Configurar Backend**

1. Vá em **Settings → Variables** do serviço backend
2. Adicione **todas** as variáveis obrigatórias
3. Clique em **"Save"**
4. **Redeploy** o serviço

### **4.4. Configurar Frontend**

1. Vá em **Settings → Variables** do serviço frontend
2. Adicione as variáveis do frontend
3. Clique em **"Save"**
4. **Redeploy** o serviço

## 🩺 **5. Verificar Health Check**

Após configurar as variáveis:

1. **Redeploy** o backend
2. Aguarde o build completar
3. Vá na URL do backend + `/health`
4. Deve retornar:
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

## ❌ **6. Troubleshooting**

### **Health Check Still Failing?**

1. **Verificar Logs**:

   ```bash
   railway logs --service backend --follow
   ```

2. **Verificar se DATABASE_URL está correto**:

   - Deve começar com `postgresql://`
   - Deve conter host, porta, usuário, senha e database

3. **Variáveis não aparecendo?**:

   - Vá em **Settings → Variables**
   - Confirme que **todas** estão salvas
   - **Redeploy** o serviço

4. **Database não conectando?**:
   - Verificar se o PostgreSQL está **running**
   - Verificar se está no mesmo **project**
   - Testar conexão manual no Railway

### **Logs Úteis para Debug**

O backend agora mostra logs detalhados:

```
🚀 Starting application bootstrap...
📋 Environment variables:
- NODE_ENV: production
- DATABASE_URL: configured ✅
- JWT_SECRET: configured ✅
- PORT: 3002
- RAILWAY_ENVIRONMENT: production
✅ Application is running on port: 3002
🌐 Health check available at: http://localhost:3002/health
```

Se vir **❌ MISSING** em qualquer variável crítica, configure ela!

## 🔄 **7. Após Configurar**

1. **Backend**: Deve passar no health check
2. **Frontend**: Deve carregar a página de login
3. **Database**: Executar migrações:
   ```bash
   railway shell --service backend
   pnpm prisma migrate deploy
   pnpm prisma db seed
   ```

## 💡 **Dicas**

- Use `${{ServiceName.VARIABLE}}` para referenciar variáveis entre serviços
- Variáveis começando com `${{` são **automáticas** do Railway
- **Sempre** redeploy após alterar variáveis
- Logs em tempo real: `railway logs --follow`
