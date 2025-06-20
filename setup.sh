#!/bin/bash

# Its Done - Setup e Teste Rápido
echo "🚀 Configurando Its Done - Sistema de Controle de Horas"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📦 Instalando dependências...${NC}"
pnpm install

echo -e "${BLUE}🗃️ Configurando banco de dados...${NC}"
cd apps/backend
pnpm prisma generate
pnpm prisma db push

echo -e "${BLUE}🔧 Verificando variáveis de ambiente...${NC}"
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  Arquivo .env não encontrado. Criando exemplo...${NC}"
    cat > .env << EOF
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/its_done?schema=public"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production"

# Google OAuth (opcional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Email - Resend (opcional para notificações)
RESEND_API_KEY="re_your_resend_api_key"
FROM_EMAIL="noreply@its-done.com"

# AWS S3 (opcional - usa storage local se não configurado)
# AWS_ACCESS_KEY_ID="your-aws-key"
# AWS_SECRET_ACCESS_KEY="your-aws-secret"
# AWS_S3_BUCKET="your-bucket-name"
# AWS_REGION="us-east-1"
EOF
    echo -e "${YELLOW}📝 Configure o arquivo .env com suas credenciais${NC}"
fi

echo -e "${BLUE}🔨 Compilando backend...${NC}"
pnpm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backend compilado com sucesso!${NC}"
else
    echo -e "${RED}❌ Erro na compilação do backend${NC}"
    exit 1
fi

cd ../..

echo -e "${BLUE}🌐 Compilando frontend...${NC}"
cd apps/frontend
pnpm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Frontend compilado com sucesso!${NC}"
else
    echo -e "${RED}❌ Erro na compilação do frontend${NC}"
    exit 1
fi

cd ../..

echo -e "${GREEN}🎉 Setup concluído com sucesso!${NC}"
echo ""
echo -e "${BLUE}🚀 Para iniciar o desenvolvimento:${NC}"
echo "1. Backend:  cd apps/backend && pnpm run start:dev"
echo "2. Frontend: cd apps/frontend && pnpm run dev"
echo ""
echo -e "${BLUE}📊 URLs importantes:${NC}"
echo "• Frontend: http://localhost:3000"
echo "• Backend:  http://localhost:3002"
echo "• API Dashboard: http://localhost:3002/dashboard/stats"
echo ""
echo -e "${BLUE}🧪 Funcionalidades principais testáveis:${NC}"
echo "• ⚙️  Configurações: /settings"
echo "• ⏰ Controle de horas: /work-hours" 
echo "• 📄 Invoices: /invoices"
echo "• 📧 Notificações automáticas (configurar email)"
echo "• 📊 Dashboard com analytics"
echo ""
echo -e "${YELLOW}💡 Dica: Configure RESEND_API_KEY no .env para testar notificações por email${NC}"
