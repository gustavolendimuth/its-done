# 🚀 It`s Done - Sistema Profissional de Controle de Horas

Sistema profissional e moderno para controle de horas de trabalho, desenvolvido para substituir planilhas tradicionais por uma solução completa e integrada. Ideal para freelancers, consultores, pequenas equipes e empresas de serviços.

## 📋 Índice

- [Sobre o Projeto](#-sobre-o-projeto)
- [Funcionalidades Principais](#-funcionalidades-principais)
- [Tecnologias Utilizadas](#-tecnologias-utilizadas)
- [Arquitetura do Sistema](#-arquitetura-do-sistema)
- [Regras de Negócio](#-regras-de-negócio)
- [Configuração e Instalação](#-configuração-e-instalação)
- [Como Usar o Sistema](#-como-usar-o-sistema)
- [Desenvolvimento](#-desenvolvimento)
- [Testes](#-testes)
- [Deploy](#-deploy)
- [Próximos Passos](#-próximos-passos)
- [Contribuição](#-contribuição)
- [Licença](#-licença)

## 🎯 Sobre o Projeto

O **It`s Done** é um sistema completo de controle de horas de trabalho que oferece uma experiência moderna e profissional para gerenciar tempo, projetos, clientes e faturas. Foi desenvolvido com foco em:

- **Produtividade**: Interface intuitiva e fluxos otimizados
- **Automação**: Notificações automáticas e geração de relatórios
- **Escalabilidade**: Arquitetura modular preparada para crescimento
- **Profissionalismo**: Design moderno e funcionalidades empresariais

### 🎨 Características Visuais

- Interface moderna com design system consistente
- Tema escuro/claro com alternância automática
- Componentes acessíveis e responsivos
- Feedback visual em tempo real
- Dashboard interativo com gráficos

## ✨ Funcionalidades Principais

### 📊 Dashboard e Analytics

- **Componente Unificado**: Dashboard único que suporta tanto o modo interno quanto o modo cliente
- **Visão Geral Personalizada**: Métricas em tempo real sobre horas trabalhadas, clientes ativos e faturamento
- **Dashboard Interno**: Interface administrativa com abas para Recent Work, Invoices e Clients
- **Dashboard do Cliente**: Portal público com visualização profissional de faturas e estatísticas
- **Gráficos Interativos**: Visualização de horas por semana, crescimento mensal e distribuição por clientes
- **Atividades Recentes**: Timeline das últimas ações realizadas no sistema
- **Top Clientes**: Ranking dos clientes por horas trabalhadas e número de faturas
- **Filtragem Avançada**: Sistema de busca, filtros por status e ordenação em ambos os modos

### ⏰ Controle de Horas

- **Registro Intuitivo**: Adicionar horas de trabalho com data, descrição e associação a clientes/projetos
- **Filtros Avançados**: Busca por período, cliente ou projeto específico
- **Estatísticas Automáticas**: Cálculo automático de totais, médias e comparações
- **Validações Inteligentes**: Prevenção de duplicatas e inconsistências

### 👥 Gestão de Clientes e Projetos

- **Cadastro Completo de Clientes**: Nome, empresa, email, telefone e endereços múltiplos
- **Interface de Gestão Otimizada**: Cards de clientes com barra de busca inteligente e botões de ação sempre visíveis
- **Busca Avançada**: Filtro por nome, email ou empresa em tempo real posicionada entre stats e lista de clientes
- **Navegação e Ações Facilitadas**: Três botões sempre visíveis em cada card: View, Edit e Share
- **Compartilhamento Inteligente**: Sistema de compartilhamento do dashboard do cliente via WhatsApp, Email ou cópia de link
- **Organização por Projetos**: Estruturação hierárquica de trabalhos
- **Histórico Detalhado**: Acompanhamento completo de horas e faturas por cliente
- **Endereços Múltiplos**: Suporte a endereços de cobrança, entrega e escritório
- **Página Detalhada do Cliente**: Interface completa com estatísticas, gráficos e histórico de atividades

### 💰 Sistema de Faturas (Invoices)

- **Geração Automática**: Criação de faturas baseadas nas horas trabalhadas
- **Upload de Arquivos**: Anexação de notas fiscais e documentos (PDF, DOC, IMG)
- **Status de Acompanhamento**: Controle de faturas pendentes, pagas e canceladas
- **Armazenamento Seguro**: Integração com AWS S3 ou storage local como fallback
- **Dashboard do Cliente**: Portal público onde clientes visualizam suas faturas, horas trabalhadas e podem fazer download dos documentos
- **Filtros e Pesquisa Avançada**: Componente reutilizável de busca e filtros com:
  - Busca por número da fatura, descrição ou nome do cliente
  - Filtros por status (Todos, Pagos, Pendentes, Cancelados)
  - Ordenação por data, valor, status ou horas
  - Contador de resultados em tempo real
  - Interface consistente entre Dashboard e página de Invoices
- **Métricas Avançadas**: Crescimento mensal, valor médio por fatura, análise de status e tendências

### 📧 Notificações Inteligentes

- **Alertas de Horas**: Notificação automática quando atingir limite configurado
- **Notificação de Faturas**: Email automático ao cliente quando fatura for enviada
- **Sistema Anti-Spam**: Prevenção de notificações duplicadas
- **Log de Notificações**: Histórico completo de emails enviados

### ⚙️ Configurações Personalizáveis

- **Limite de Horas**: Configuração do threshold para alertas automáticos
- **Email de Notificação**: Personalização do email para recebimento de alertas
- **Preferências do Sistema**: Configurações de interface e comportamento

### 📈 Relatórios e Exports

- **Relatórios Detalhados**: Análise por período, cliente ou projeto
- **Métricas de Performance**: Comparação de períodos e identificação de tendências
- **Dados Estruturados**: Informações organizadas para tomada de decisão

## 🛠 Tecnologias Utilizadas

### Backend (NestJS)

- **Framework**: NestJS 10.x com TypeScript
- **ORM**: Prisma 6.x para modelagem e queries do banco
- **Banco de Dados**: PostgreSQL 15
- **Autenticação**: JWT + Passport.js com suporte a Google OAuth
- **Validação**: Class-validator e Class-transformer
- **Upload de Arquivos**: Multer com suporte a AWS S3
- **Email**: Resend para envio de notificações
- **Cache**: Redis para sessões e cache
- **Documentação**: Swagger/OpenAPI automático

### Frontend (Next.js)

- **Framework**: Next.js 14 com App Router
- **UI Library**: React 18 com TypeScript
- **Estilização**: TailwindCSS com Shadcn/ui components
- **Formulários**: React Hook Form com Zod validation
- **State Management**: TanStack Query (React Query)
- **Gráficos**: Recharts para visualizações
- **Temas**: Next-themes para modo escuro/claro
- **Ícones**: Lucide React
- **Data Handling**: Date-fns para manipulação de datas

### DevOps e Infraestrutura

- **Monorepo**: Turborepo para gerenciamento
- **Package Manager**: PNPM para eficiência
- **Containerização**: Docker + Docker Compose
- **Banco de Dados**: PostgreSQL + Redis em containers
- **CI/CD**: GitHub Actions (configurável)
- **Linting**: ESLint + Prettier
- **Testes**: Jest + Testing Library

### Integrações Externas

- **AWS S3**: Armazenamento de arquivos de faturas
- **Google OAuth**: Autenticação social
- **Resend**: Serviço de email transacional
- **PostgreSQL**: Banco de dados principal
- **Redis**: Cache e gerenciamento de sessão

## 📚 Bibliotecas e Dependências

### Backend Dependencies

#### Core Framework

- **@nestjs/core** `^10.0.0` - Framework principal do NestJS
- **@nestjs/common** `^10.0.0` - Módulos comuns do NestJS
- **@nestjs/platform-express** `^10.0.0` - Plataforma Express para NestJS
- **@nestjs/config** `^3.1.1` - Gerenciamento de configurações
- **@nestjs/mapped-types** `^2.1.0` - Utilitários para mapeamento de tipos

#### Database & ORM

- **@prisma/client** `^6.9.0` - Cliente Prisma para TypeScript
- **prisma** `^6.9.0` - ORM e toolkit de banco de dados

#### Authentication & Security

- **@nestjs/jwt** `^10.2.0` - Implementação JWT para NestJS
- **@nestjs/passport** `^10.0.3` - Integração Passport.js com NestJS
- **passport** `^0.7.0` - Middleware de autenticação
- **passport-jwt** `^4.0.1` - Estratégia JWT para Passport
- **passport-local** `^1.0.0` - Estratégia local para Passport
- **passport-google-oauth20** `^2.0.0` - Estratégia Google OAuth2.0
- **bcrypt** `^6.0.0` - Biblioteca para hash de senhas

#### File Upload & Storage

- **@aws-sdk/client-s3** `^3.826.0` - SDK moderno da AWS para S3
- **aws-sdk** `^2.1692.0` - SDK clássico da AWS (fallback)
- **multer** `^2.0.1` - Middleware para upload de arquivos

#### Validation & Transformation

- **class-validator** `^0.14.2` - Validação baseada em decorators
- **class-transformer** `^0.5.1` - Transformação de objetos

#### Email & Communication

- **resend** `^4.5.2` - Serviço de email transacional

#### Utils

- **uuid** `^11.1.0` - Geração de identificadores únicos
- **reflect-metadata** `^0.1.13` - Suporte a metadados para decorators
- **rxjs** `^7.8.1` - Programação reativa

### Frontend Dependencies

#### Core Framework

- **next** `14.1.0` - Framework React para produção
- **react** `^18` - Biblioteca principal do React
- **react-dom** `^18` - DOM renderer para React

#### Authentication

- **next-auth** `^4.24.6` - Autenticação para Next.js
- **@auth/core** `^0.34.2` - Core de autenticação

#### State Management & Data Fetching

- **@tanstack/react-query** `^5.24.1` - Gerenciamento de estado assíncrono (antigo React Query)
- **axios** `^1.9.0` - Cliente HTTP

#### UI Components & Styling

- **@radix-ui/react-\*** `^1.x/^2.x` - Componentes primitivos acessíveis:
  - `react-alert-dialog` - Diálogos de alerta
  - `react-avatar` - Componentes de avatar
  - `react-dialog` - Diálogos modais
  - `react-dropdown-menu` - Menus dropdown
  - `react-label` - Labels acessíveis
  - `react-popover` - Componentes popover
  - `react-progress` - Barras de progresso
  - `react-select` - Seletores customizados
  - `react-separator` - Separadores visuais
  - `react-switch` - Componentes switch
  - `react-tabs` - Navegação em abas
  - `react-toast` - Notificações toast
  - `react-tooltip` - Tooltips interativos
- **lucide-react** `^0.344.0` - Biblioteca de ícones moderna e extensiva
- **tailwindcss** `^3.4.0` - Framework CSS utilitário
- **tailwind-merge** `^2.2.1` - Utilitário para merge de classes Tailwind
- **tailwindcss-animate** `^1.0.7` - Animações para Tailwind
- **class-variance-authority** `^0.7.0` - Variantes de componentes
- **clsx** `^2.1.0` - Utilitário para classes condicionais

#### Design System Enhancements

- **Títulos com Ícones**: Todas as páginas principais agora incluem ícones contextuais nos títulos
  - **Dashboard**: BarChart3 - representa análise e métricas
  - **Clients**: Users - representa gestão de clientes
  - **Projects**: Folder - representa organização de projetos
  - **Invoices**: FileText - representa documentos e faturas
  - **Work Hours**: Clock - representa controle de tempo
  - **Analytics**: BarChart3 - representa análise avançada
  - **Settings**: Settings - representa configurações
- **InfoCard Otimizado**: Componente redesenhado para evitar repetição visual
  - Ícone de "Info" como ícone principal (grande) na lateral esquerda
  - Remove a duplicação de ícones entre PageHeader e InfoCard
  - Cores temáticas adaptáveis (info, success, warning, error)
  - Layout limpo e focado na informação
- **Padronização de Layout**: Todas as páginas agora utilizam o componente PageHeader consistentemente
  - Interface unificada com título, descrição, ícone e ações
  - PageContainer para layout responsivo e padronizado
  - Spacing e estrutura visual consistente em toda a aplicação
  - Melhor acessibilidade e experiência do usuário
  - Hierarquia visual clara: PageHeader (ícone da página) + InfoCard (ícone Info)

#### Forms & Validation

- **react-hook-form** `^7.50.1` - Biblioteca de formulários performática
- **@hookform/resolvers** `^3.3.4` - Resolvers para validação
- **zod** `^3.22.4` - Schema de validação TypeScript-first

#### Date & Time

- **date-fns** `^3.3.1` - Biblioteca moderna para manipulação de datas
- **react-datepicker** `^8.4.0` - Seletor de datas
- **react-day-picker** `^9.7.0` - Calendário e seletor de dias

#### Data Visualization

- **recharts** `^2.15.3` - Biblioteca de gráficos para React

#### Utilities & Enhancements

- **next-themes** `^0.2.1` - Gerenciamento de temas (dark/light)
- **cmdk** `^1.1.1` - Command palette primitives
- **js-cookie** `^3.0.5` - Manipulação de cookies
- **react-input-mask** `^2.0.4` - Máscaras para inputs
- **sonner** `^1.4.0` - Toast notifications elegantes

### Development Dependencies

#### Backend DevDeps

- **@nestjs/cli** `^10.0.0` - CLI do NestJS
- **@nestjs/testing** `^10.0.0` - Utilitários de teste
- **typescript** `^5.1.3` - Compilador TypeScript
- **ts-node** `^10.9.1` - Execução TypeScript em Node.js
- **jest** `^29.5.0` - Framework de testes
- **ts-jest** `^29.1.0` - Transformador Jest para TypeScript
- **eslint** `^8.42.0` - Linter JavaScript/TypeScript
- **prettier** `^3.0.0` - Formatador de código

#### Frontend DevDeps

- **@types/\*** - Definições de tipos TypeScript
- **eslint-config-next** `14.1.0` - Configuração ESLint para Next.js
- **autoprefixer** `^10.4.21` - PostCSS plugin para prefixos CSS
- **postcss** `^8.5.4` - Ferramenta de transformação CSS

#### Monorepo Management

- **turbo** `^1.12.4` - Build system otimizado para monorepos
- **@nestjs/cli** `^11.0.7` - CLI global do NestJS

### Principais Características das Bibliotecas

#### 🚀 Performance

- **Next.js 14**: App Router, Server Components, streaming SSR
- **TanStack Query (React Query)**: Cache inteligente, background updates, otimização de requests
- **Turbo**: Build paralelo e cache inteligente para monorepo

#### 🎨 UI/UX

- **Radix UI**: Componentes headless, acessíveis e customizáveis
- **Tailwind CSS**: Styling utilitário com design consistente
- **Recharts**: Gráficos responsivos e interativos

#### 🔒 Segurança

- **NextAuth.js**: Autenticação segura com múltiplos providers
- **Zod**: Validação runtime com type safety
- **bcrypt**: Hash seguro de senhas

#### 📊 Dados

- **Prisma**: Type-safe database access com migrations
- **Class-validator**: Validação robusta no backend
- **Date-fns**: Manipulação confiável de datas

## 🏗 Arquitetura do Sistema

### Estrutura do Monorepo

```
its-done/
├── apps/
│   ├── backend/          # API NestJS
│   │   ├── src/
│   │   │   ├── auth/         # Autenticação e autorização
│   │   │   ├── users/        # Gestão de usuários
│   │   │   ├── work-hours/   # Controle de horas
│   │   │   ├── clients/      # Gestão de clientes
│   │   │   ├── projects/     # Gestão de projetos
│   │   │   ├── invoices/     # Sistema de faturas
│   │   │   ├── settings/     # Configurações do usuário
│   │   │   ├── dashboard/    # Métricas e analytics
│   │   │   ├── reports/      # Relatórios
│   │   │   ├── notifications/ # Sistema de notificações
│   │   │   ├── addresses/    # Endereços de clientes
│   │   │   └── prisma/       # Configuração do banco
│   │   └── prisma/
│   │       ├── schema.prisma # Modelo de dados
│   │       └── migrations/   # Migrações do banco
│   └── frontend/         # App Next.js
│       ├── src/
│       │   ├── app/          # Pages (App Router)
│       │   ├── components/   # Componentes reutilizáveis
│       │   │   ├── dashboard/    # Dashboard unificado
│       │   │   ├── ui/           # Componentes UI base
│       │   │   ├── layout/       # Componentes de layout
│       │   │   ├── invoices/     # Componentes de faturas
│       │   │   │   ├── invoice-search-filters.tsx  # Filtros reutilizáveis
│       │   │   │   ├── create-invoice-form.tsx     # Formulário de criação
│       │   │   │   ├── edit-invoice-form.tsx       # Formulário de edição
│       │   │   │   └── ...                         # Outros componentes
│       │   │   ├── clients/      # Componentes de clientes
│       │   │   └── ...           # Outros componentes
│       │   ├── hooks/        # Custom hooks
│       │   ├── services/     # API services
│       │   ├── types/        # Tipos TypeScript
│       │   └── lib/          # Utilitários
│       └── public/       # Assets estáticos
├── packages/             # Pacotes compartilhados
│   ├── ui/              # Biblioteca de componentes
│   ├── eslint/          # Configurações ESLint
│   └── tsconfig/        # Configurações TypeScript
├── docker/              # Configurações Docker
├── scripts/             # Scripts de automação
└── docs/               # Documentação
```

### Modelo de Dados (Prisma Schema)

#### Entidades Principais:

- **User**: Usuários do sistema com autenticação JWT/OAuth
- **WorkHour**: Registros de horas trabalhadas
- **Client**: Clientes/contratantes
- **Project**: Projetos associados aos clientes
- **Invoice**: Faturas geradas
- **Settings**: Configurações personalizadas do usuário
- **Address**: Endereços múltiplos dos clientes
- **NotificationLog**: Log de notificações enviadas

#### Relacionamentos:

- User → WorkHours (1:N)
- User → Clients (1:N)
- User → Projects (1:N)
- Client → WorkHours (1:N)
- Client → Invoices (1:N)
- Client → Addresses (1:N)
- Project → WorkHours (1:N)
- Invoice → InvoiceWorkHours (1:N)

## 📋 Regras de Negócio

### Sistema de Horas

1. **Registro de Horas**: Cada registro deve ter data, descrição, horas trabalhadas e estar associado a um cliente
2. **Validação de Dados**: Horas não podem ser negativas, datas não podem ser futuras
3. **Associação a Projetos**: Horas podem opcionalmente ser associadas a projetos específicos
4. **Cálculos Automáticos**: Sistema calcula automaticamente totais por período, cliente e projeto

### Sistema de Alertas

1. **Threshold Configurável**: Usuário define limite de horas para receber alertas
2. **Prevenção de Spam**: Sistema evita envio de múltiplas notificações para o mesmo threshold
3. **Email Personalizado**: Possibilidade de configurar email diferente para recebimento de alertas
4. **Log de Notificações**: Todas as notificações são registradas no banco para auditoria

### Sistema de Faturas

1. **Associação Única**: Cada hora trabalhada pode estar associada a apenas uma fatura
2. **Validação de Cliente**: Todas as horas de uma fatura devem pertencer ao mesmo cliente
3. **Status de Controle**: Faturas podem estar Pendentes, Pagas ou Canceladas
4. **Upload Seguro**: Arquivos são validados por tipo e tamanho antes do upload
5. **Notificação Automática**: Cliente recebe email automaticamente quando fatura é criada

### Sistema de Clientes

1. **Dados Obrigatórios**: Nome da empresa e email são obrigatórios
2. **Endereços Múltiplos**: Suporte a diferentes tipos de endereço (cobrança, entrega, escritório)
3. **Endereço Primário**: Cada cliente deve ter um endereço marcado como primário
4. **Relacionamentos**: Clientes podem ter múltiplos projetos e faturas

### Segurança e Autorização

1. **Isolamento de Dados**: Usuários só acessam seus próprios dados
2. **Autenticação JWT**: Tokens com expiração configurável
3. **Validação de Input**: Todas as entradas são validadas no backend
4. **Upload Seguro**: Apenas tipos de arquivo permitidos são aceitos

## 🧪 Testes

### Frontend (Next.js + Vitest)

O frontend usa Vitest com Testing Library para testes:

```bash
cd apps/frontend
pnpm test          # Executar testes em modo watch
pnpm test:run      # Executar todos os testes uma vez
pnpm test:ui       # Interface visual para testes
```

#### Configuração de Testes Frontend

- **Framework**: Vitest com JSDOM
- **Testing Library**: React Testing Library + Jest DOM
- **Setup**: Arquivo de setup em `src/test/setup.ts`
- **Configuração**: `vitest.config.ts`

#### Estrutura de Testes Frontend

```
apps/frontend/src/
├── test/
│   ├── setup.ts           # Configuração global dos testes
│   └── vitest.d.ts       # Tipos globais do Vitest
├── components/
│   └── invoices/
│       └── __tests__/
│           └── invoice-search-filters.test.tsx
```

#### Exemplo de Testes

Os testes cobrem:

- **Renderização de Componentes**: Verificação se elementos aparecem corretamente
- **Interações do Usuário**: Cliques, digitação, mudanças de estado
- **Lógica de Hooks**: Teste do hook `useInvoiceFilters`
- **Filtros e Busca**: Validação de filtros por status, busca e ordenação

### Backend (NestJS)

Os testes do backend usam Jest como framework de testes:

```bash
cd apps/backend
pnpm test          # Executar todos os testes
pnpm test:watch    # Executar testes em modo watch
pnpm test:cov      # Executar testes com cobertura
```

#### Estrutura de Testes Backend

- **Testes Unitários**: Para serviços e controladores
- **Testes de Integração**: Para endpoints da API
- **Mocks**: Para dependências externas (banco, email, etc.)

## 🚀 Configuração e Instalação

### Pré-requisitos

- Node.js 18+
- Docker e Docker Compose
- PNPM (recomendado) ou NPM
- Git

### 1. Clone o Repositório

```bash
git clone https://github.com/seu-usuario/its-done.git
cd its-done
```

### 2. Instalação Automática

Execute o script de setup que configura todo o ambiente:

```bash
chmod +x setup.sh
./setup.sh
```

### 3. Instalação Manual

#### Instalar Dependências

```bash
pnpm install
```

#### Configurar Banco de Dados

```bash
# Iniciar banco de dados com Docker
docker-compose up -d

# Gerar cliente Prisma e aplicar migrações
cd apps/backend
pnpm prisma generate
pnpm prisma db push
```

#### Configurar Variáveis de Ambiente

**Backend (.env):**

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/its_done"

# JWT
JWT_SECRET="sua_chave_secreta_jwt_super_segura"

# Google OAuth (opcional)
GOOGLE_CLIENT_ID="seu_google_client_id"
GOOGLE_CLIENT_SECRET="seu_google_client_secret"

# Email - Resend
RESEND_API_KEY="re_sua_chave_resend"
FROM_EMAIL="noreply@seu-dominio.com"

# AWS S3 (opcional - usa storage local se não configurado)
AWS_ACCESS_KEY_ID="sua_aws_access_key"
AWS_SECRET_ACCESS_KEY="sua_aws_secret_key"
AWS_S3_BUCKET="nome-do-seu-bucket"
AWS_REGION="us-east-1"
```

**Frontend (.env.local):**

```env
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="sua_chave_secreta_nextauth"
API_URL="http://localhost:3002"
```

### 4. Executar o Projeto

#### Modo Desenvolvimento

##### 🚀 **Opção Recomendada: Script Inteligente**

O projeto conta com um script inteligente que gerencia automaticamente o ambiente de desenvolvimento:

```bash
# Iniciar ambiente completo (RECOMENDADO)
pnpm dev
```

**Características do script:**

- ✅ **Reinicialização automática**: Para e reinicia todos os serviços existentes
- 📝 **Logs integrados**: Visualiza logs do backend e frontend simultaneamente
- 🎨 **Logs coloridos**: Backend em roxo, frontend em ciano
- 🔄 **Detecção de porta**: Verifica se os serviços iniciaram corretamente
- 🛑 **Cleanup automático**: Ctrl+C para todas as operações de limpeza

**Exemplo de saída:**

```
🚀 Starting development environment...
🛑 Stopping any existing services...
✅ All existing services stopped
🔄 Starting both frontend and backend...
✅ Backend started successfully on port 3002
✅ Frontend started successfully on port 3000

🎉 Development environment ready!
Frontend: http://localhost:3000
Backend: http://localhost:3002

📝 Showing logs (Press Ctrl+C to stop all services)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[BACKEND] 🚀 Starting Nest application...
[FRONTEND] ▲ Next.js 14.1.0
[BACKEND] ✅ Mapped {/api/users, GET}
[FRONTEND] - Local: http://localhost:3000
```

##### 📍 **Execução de Qualquer Diretório**

O script também está disponível em todos os package.json:

```bash
# Da raiz do projeto
pnpm dev

# Do diretório frontend
cd apps/frontend && pnpm start:dev

# Do diretório backend
cd apps/backend && pnpm start:dev
```

##### 🔧 **Opções Alternativas**

Para desenvolvimento individual dos serviços:

```bash
# Apenas backend (porta 3002)
cd apps/backend && pnpm dev

# Apenas frontend (porta 3000)
cd apps/frontend && pnpm dev
```

#### Modo Produção

```bash
pnpm build
pnpm start
```

#### Acessos

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3002
- **Banco de dados**: localhost:5432
- **Prisma Studio**: `pnpm studio` (porta 5555)

## 📖 Como Usar o Sistema

### 1. Primeiro Acesso

1. Acesse http://localhost:3000
2. Registre uma nova conta ou faça login com Google
3. Configure suas preferências iniciais

### 2. Configuração Inicial

1. Vá para **Configurações** (`/settings`)
2. Defina seu limite de horas para alertas (padrão: 160h)
3. Configure seu email para notificações
4. Salve as configurações

### 3. Gerenciar Clientes

#### Cadastrar Novos Clientes

1. Acesse **Clientes** (`/clients`)
2. Clique em "Novo Cliente"
3. Preencha: nome, empresa, email, telefone
4. Adicione endereços se necessário
5. Salve o cliente

#### Navegar e Buscar Clientes

1. Use a **barra de busca** (posicionada entre as estatísticas e os cards de clientes)
2. Pesquise por nome, email ou empresa em tempo real
3. Visualize estatísticas detalhadas de cada cliente nos cards:
   - **Hours**: Total de horas trabalhadas
   - **Paid**: Valor total de faturas pagas
   - **Pending**: Valor total de faturas pendentes

#### Ações Rápidas nos Cards

- **View**: Clique no botão "View" para acessar a página detalhada com gráficos, estatísticas e histórico
- **Edit**: Clique no botão "Edit" para editar informações básicas e endereços
- **Share**: Clique no botão "Share" para acessar opções de compartilhamento:
  - **Copy Link**: Copia o link do dashboard do cliente para a área de transferência
  - **Share via WhatsApp**: Abre o WhatsApp com mensagem pré-formatada contendo o link
  - **Send via Email**: Abre o cliente de email padrão com assunto e corpo pré-preenchidos

### 4. Criar Projetos (Opcional)

1. Acesse **Projetos** (`/projects`)
2. Clique em "Novo Projeto"
3. Associe o projeto a um cliente existente
4. Adicione nome e descrição
5. Salve o projeto

### 5. Registrar Horas de Trabalho

1. Vá para **Controle de Horas** (`/work-hours`)
2. Clique em "Adicionar Horas"
3. Selecione a data de trabalho
4. Escolha o cliente (e projeto se applicable)
5. Insira as horas trabalhadas
6. Adicione uma descrição detalhada
7. Salve o registro

### 6. Monitorar no Dashboard

1. Acesse o **Dashboard** (`/dashboard`)
2. Veja suas métricas em tempo real:
   - Total de horas no mês
   - Crescimento percentual
   - Clientes ativos
   - Atividades recentes
3. Analise os gráficos de performance

### 7. Gerar Faturas

1. Acesse **Faturas** (`/invoices`)
2. Clique em "Nova Fatura"
3. Selecione o cliente
4. Escolha as horas a serem faturadas
5. Defina o valor (se aplicável)
6. Faça upload da nota fiscal (PDF/IMG)
7. O sistema enviará email automaticamente ao cliente

### 7. Dashboard do Cliente (Portal Público)

O sistema oferece um dashboard público onde seus clientes podem:

1. **Acessar via URL**: `/client-dashboard/[clientId]`
2. **Visualizar Estatísticas**:
   - Total de faturas e horas trabalhadas
   - Valores pagos e pendentes
   - Crescimento mensal e métricas de performance
3. **Gerenciar Faturas**:
   - Visualizar todas as faturas em cards interativos
   - Filtrar por status (Pago, Pendente, Atrasado)
   - Pesquisar por número ou descrição
   - Ordenar por data, valor, status ou horas
4. **Download de Documentos**:
   - Visualizar faturas em nova aba
   - Download direto dos arquivos PDF
   - Detalhes completos de horas trabalhadas por fatura
5. **Interface Profissional**:
   - Design moderno e responsivo
   - Tema claro/escuro
   - Experiência otimizada para cliente

### 9. Acompanhar Relatórios

1. Vá para **Analytics** (`/analytics`)
2. Filtre por período, cliente ou projeto
3. Visualize estatísticas detalhadas
4. Exporte dados se necessário

## 👨‍💻 Desenvolvimento

### Estrutura de Comandos

#### 🚀 Comandos de Desenvolvimento

```bash
# Comando principal (RECOMENDADO)
pnpm dev                   # Script inteligente: para + inicia + logs coloridos

# Comandos alternativos
cd apps/backend && pnpm dev     # Apenas backend (porta 3002)
cd apps/frontend && pnpm dev    # Apenas frontend (porta 3000)

# Execução em qualquer diretório
pnpm start:dev            # Da pasta frontend ou backend
```

#### 🏗️ Comandos de Build

```bash
pnpm build                 # Build de produção completo
pnpm build:backend         # Build apenas backend
pnpm build:frontend        # Build apenas frontend
```

#### 🗄️ Comandos de Banco de Dados

```bash
pnpm studio               # Prisma Studio (porta 5555)
cd apps/backend && pnpm prisma generate    # Gerar cliente Prisma
cd apps/backend && pnpm prisma db push     # Aplicar schema
cd apps/backend && pnpm prisma migrate dev # Nova migração
```

#### ✅ Comandos de Qualidade

```bash
pnpm lint                 # Executar linting em todo o projeto
pnpm format              # Formatar código com Prettier
pnpm test                # Executar testes
```

### Desenvolvimento Backend

1. **Estrutura Modular**: Cada feature tem seu próprio módulo
2. **DTOs Validados**: Uso de class-validator para validação
3. **Decorators Customizados**: Simplificação de código comum
4. **Guards de Autenticação**: Proteção automática de rotas
5. **Swagger Automático**: Documentação gerada automaticamente

### Desenvolvimento Frontend

1. **Componentes Reutilizáveis**: Biblioteca de componentes própria
2. **Hooks Customizados**: Lógica compartilhada encapsulada
3. **Type Safety**: TypeScript em todo o frontend
4. **Estado Global**: React Query para cache e sincronização
5. **Formulários Validados**: Zod + React Hook Form

### Padrões de Código

- **Naming Convention**: camelCase para variáveis, PascalCase para componentes
- **Estrutura de Arquivos**: Agrupamento por feature, não por tipo
- **Imports**: Paths absolutos usando aliases
- **Error Handling**: Tratamento consistente de erros
- **Logging**: Logs estruturados para debugging

## 🧪 Testes

### Backend

```bash
cd apps/backend

# Testes unitários
pnpm test

# Testes com coverage
pnpm test:cov

# Testes em modo watch
pnpm test:watch

# Testes end-to-end
pnpm test:e2e
```

### Frontend

```bash
cd apps/frontend

# Testes de componentes
pnpm test

# Testes com coverage
pnpm test:coverage

# Testes em modo watch
pnpm test:watch
```

### Estrutura de Testes

- **Unit Tests**: Lógica de negócio e utilitários
- **Integration Tests**: APIs e banco de dados
- **Component Tests**: Componentes React isolados
- **E2E Tests**: Fluxos completos do usuário

## 🚢 Deploy

### Usando Docker (Recomendado)

```bash
# Build das imagens
docker-compose -f docker-compose.prod.yml build

# Deploy em produção
docker-compose -f docker-compose.prod.yml up -d
```

### Deploy Manual

#### Backend

```bash
cd apps/backend
pnpm build
pnpm start:prod
```

#### Frontend

```bash
cd apps/frontend
pnpm build
pnpm start
```

### Variáveis de Ambiente para Produção

- Configure todas as variáveis de ambiente necessárias
- Use secrets seguros para JWT_SECRET e outras chaves
- Configure SSL/TLS para HTTPS
- Configure backup automático do banco de dados

## 🎯 Próximos Passos

### Funcionalidades Planejadas

#### Curto Prazo (1-2 meses)

- [x] **Dashboard Público para Clientes**: Portal onde clientes podem visualizar suas horas e faturas ✅
- [x] **Componente de Dashboard Unificado**: Sistema unificado que combina dashboard interno e do cliente ✅
- [ ] **Notificações Push**: Notificações em tempo real no browser
- [ ] **Export de Relatórios**: PDF e Excel com dados formatados
- [ ] **API REST Pública**: Endpoints para integrações externas
- [ ] **Modo Offline**: Funcionamento básico sem conexão
- [ ] **Multi-idiomas**: Suporte a português e inglês

#### Médio Prazo (3-6 meses)

- [ ] **Mobile App**: Aplicativo React Native para iOS e Android
- [ ] **Time Tracking em Tempo Real**: Cronômetro integrado
- [ ] **Integração com Calendários**: Google Calendar, Outlook
- [ ] **Backup Automático**: Backup incremental para nuvem
- [ ] **Colaboração em Equipe**: Múltiplos usuários por workspace
- [ ] **Sistema de Aprovação**: Workflow para aprovação de horas

#### Longo Prazo (6+ meses)

- [ ] **Inteligência Artificial**: Sugestões automáticas e insights
- [ ] **Integrações Contábeis**: QuickBooks, Xero, Conta Azul
- [ ] **Faturamento Automático**: Geração automática baseada em regras
- [ ] **Dashboard Executivo**: Métricas avançadas para gestão
- [ ] **Multi-tenancy**: Suporte a múltiplas empresas
- [ ] **Compliance**: LGPD, GDPR, SOX

### Melhorias Técnicas

#### Performance

- [ ] **Cache Redis**: Implementação de cache distribuído
- [ ] **CDN**: Content Delivery Network para assets
- [ ] **Database Indexing**: Otimização de queries
- [ ] **Lazy Loading**: Carregamento sob demanda
- [ ] **Bundle Optimization**: Redução do tamanho dos bundles

#### Segurança

- [ ] **2FA**: Autenticação de dois fatores
- [ ] **Rate Limiting**: Proteção contra ataques
- [ ] **Security Headers**: Headers de segurança HTTP
- [ ] **Encryption**: Criptografia de dados sensíveis
- [ ] **Audit Logs**: Log detalhado de ações

#### DevOps

- [ ] **CI/CD Pipeline**: Automação completa de deploy
- [ ] **Monitoring**: Monitoramento de aplicação e infraestrutura
- [ ] **Health Checks**: Verificações automáticas de saúde
- [ ] **Load Balancing**: Balanceamento de carga
- [ ] **Auto Scaling**: Escalonamento automático

### Arquitetura e Escalabilidade

- [ ] **Microservices**: Quebra em serviços menores se necessário
- [ ] **Event Sourcing**: Implementação para auditoria completa
- [ ] **CQRS**: Separação de comando e consulta
- [ ] **Message Queue**: Processamento assíncrono
- [ ] **Kubernetes**: Orquestração de containers

## 🤝 Contribuição

### Como Contribuir

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

### Padrões de Contribuição

- Siga os padrões de código estabelecidos
- Escreva testes para novas funcionalidades
- Atualize a documentação quando necessário
- Use commits semânticos (feat, fix, docs, etc.)

### Reportar Bugs

Use o sistema de Issues do GitHub para reportar bugs, incluindo:

- Descrição detalhada do problema
- Passos para reproduzir
- Screenshots se aplicável
- Informações do ambiente (OS, Browser, etc.)

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 📞 Suporte

Para suporte técnico ou dúvidas:

- Abra uma Issue no GitHub
- Consulte a documentação técnica
- Entre em contato com a equipe de desenvolvimento

---

**Its Done** - Transformando controle de horas em produtividade profissional. 🚀
