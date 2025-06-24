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
- [Authentication](#-authentication)

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
- **Armazenamento Inteligente**: Sistema com prioridade Railway Volume > AWS S3 > Storage local
- **Railway Volume**: Armazenamento persistente integrado para deploy em produção
- **Dashboard do Cliente**: Portal público onde clientes visualizam suas faturas, horas trabalhadas e podem fazer download dos documentos
- **Filtros e Pesquisa Avançada**: Componente reutilizável de busca e filtros com:
  - Busca por número da fatura, descrição ou nome do cliente
  - Filtros por status (Todos, Pagos, Pendentes, Cancelados)
  - Ordenação por data, valor, status ou horas
  - Contador de resultados em tempo real
  - Interface consistente entre Dashboard e página de Invoices
- **Métricas Avançadas**: Crescimento mensal, valor médio por fatura, análise de status e tendências

### 🔐 Sistema de Autenticação e Segurança

- **Login Seguro**: Autenticação JWT com tokens de acesso
- **Registro de Usuários**: Criação de contas com validação de email
- **Recuperação de Senha**: Sistema completo de reset de senha via email
- **Google OAuth**: Login social integrado com Google
- **Proteção de Rotas**: Middleware de autenticação para rotas protegidas
- **Tokens Temporários**: Tokens de reset com expiração de 1 hora
- **Emails Automáticos**: Templates profissionais para welcome e reset de senha

### 🖼️ Sistema de Avatares Inteligente

- **Fallback em Cascata**: Sistema robusto com múltiplos provedores de avatar
- **Priorização Inteligente**: Google Profile > Gravatar > UI Avatars > DiceBear > SVG Local
- **Tratamento de Erro DNS**: Solução para problemas de conectividade com Gravatar
- **Detecção de Falhas**: Monitoramento automático de disponibilidade dos serviços
- **Avatar Local**: Geração de SVG como último fallback garantido
- **Cache Inteligente**: Sistema de cache para avatars funcionais por 5 minutos
- **Métricas de Qualidade**: Coleta de estatísticas de sucesso/falha por provedor
- **Performance Otimizada**: Timeout configurável e tentativas em paralelo

### 📧 Notificações Inteligentes

- **Alertas de Horas**: Notificação automática quando atingir limite configurado
- **Notificação de Faturas**: Email automático ao cliente quando fatura for enviada
- **Sistema Anti-Spam**: Prevenção de notificações duplicadas
- **Log de Notificações**: Histórico completo de emails enviados
- **Email de Reset**: Template profissional para recuperação de senha
- **Email de Boas-vindas**: Mensagem automática para novos usuários

### 🔧 Configurações Personalizáveis

- **Limite de Horas**: Configuração do threshold para alertas automáticos
- **Email de Notificação**: Personalização do email para recebimento de alertas
- **Preferências do Sistema**: Configurações de interface e comportamento

### 🌐 Sistema de Traduções Inteligente

- **Traduções Específicas para Formulários**: Subtítulos diferenciados para formulários, separados das descrições de páginas
- **Sistema de Tempo Relativo Customizado**: Função `formatTimeAgo()` que usa traduções próprias ao invés do date-fns locale
- **Suporte Multilíngue**: Idiomas português (pt-BR) e inglês (en) com traduções completas
- **Traduções Contextuais**: Diferentes textos para contextos específicos (página vs formulário vs tempo relativo)
- **Título e Descrição da Aplicação**: Tradução do título e descrição principal da aplicação em todos os idiomas
- **Chaves de Tradução Organizadas**:
  - `app.title`: Título principal da aplicação
  - `app.description`: Descrição principal da aplicação
  - `editClientFormSubtitle`: Texto específico para formulário de edição de cliente
  - `addNewClientFormSubtitle`: Texto específico para formulário de novo cliente
  - `addHoursFormSubtitle`: Texto específico para formulário de registro de horas
  - `addProjectFormSubtitle`: Texto específico para formulário de novo projeto
  - `createInvoiceFormSubtitle`: Texto específico para formulário de criação de fatura
  - `editInvoiceFormSubtitle`: Texto específico para formulário de edição de fatura
  - `workHours.timeAgo.*`: Traduções para tempo relativo (day, days, hour, hours, etc.)
- **Função formatTimeAgo()**: Sistema customizado que substitui date-fns locale:

  ```tsx
  // ❌ Antes: date-fns com locale
  formatDistanceToNow(date, { locale: ptBR })

  // ✅ Depois: Sistema de traduções próprio
  formatTimeAgo(date, t)
  ```

- **Fallback Inteligente**: Sistema que usa traduções específicas quando disponíveis, com fallback para traduções gerais
- **Testes de Integridade**: Verificação automática de consistência entre traduções em diferentes idiomas

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

- **Railway Volume**: Armazenamento persistente para uploads (produção)
- **AWS S3**: Armazenamento de arquivos de faturas (fallback)
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

- **Railway Volume** - Armazenamento persistente nativo (prioridade)
- **@aws-sdk/client-s3** `^3.826.0` - SDK moderno da AWS para S3 (fallback)
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
- **Correção de Legibilidade**: Cores de erro otimizadas para melhor legibilidade
  - Cor `--destructive` no modo escuro alterada de `0 62.8% 30.6%` para `0 84.2% 60.2%`
  - Melhor contraste e legibilidade em avisos de erro e alertos destructivos
  - Mantém consistência com o tema claro usando a mesma configuração HSL
- **Redesign dos Cards de Projects**: Cards redesenhados seguindo o padrão dos cards de clients
  - Layout moderno com barra de destaque indigo e ícone circular
  - Seção de estatísticas organizada em grid 3x3 com métricas relevantes
  - Botões de ação sempre visíveis na parte inferior (Client, Edit, Delete)
  - Hover effects e animações para melhor feedback visual
  - AlertDialog integrado para confirmação de exclusão
  - Componente `ProjectCard` criado seguindo os padrões do `ClientCard`
- **Sistema de Cores Temáticas dos Cards**: Cards redesenhados com cores que correspondem aos big stats de cada página
  - **ClientCard**: Tema azul (`blue`) com background gradient, barra de destaque e ícone azuis
  - **ProjectCard**: Tema indigo (`indigo`) com background gradient, barra de destaque e ícone indigo
  - **InvoiceCard**: Tema purple (`purple`) com background gradient para consistência visual
  - **WorkHourCard**: Tema verde (`green`) seguindo o padrão visual dos outros cards com layout moderno
  - Cards agora seguem o sistema de cores do `BigStatsDisplay` para maior coerência visual
  - Background gradients sutis que respeitam o modo claro/escuro
  - Bordas coloridas que complementam o tema de cada página
- **WorkHourCard - Componente Otimizado**: Card redesenhado com layout integrado e sem redundâncias
  - **Layout Integrado**: Design limpo sem seções separadas de estatísticas para eliminar repetições
  - **Design Melhorado**: Barra de destaque verde e ícone circular de relógio com tema verde consistente
  - **Informações Organizadas**:
    - **Linha 1**: Horas trabalhadas (HH:MM) + data formatada
    - **Linha 2**: Nome da empresa destacado + tempo trabalhado com ícone
    - **Linha 3**: Nome do projeto com ícone (quando disponível)
  - **Empresa Destacada**: Nome da empresa com background verde suave e bordas para maior visibilidade
  - **Ícones Contextuais**: Building2 para empresa, FileText para projetos, Calendar para tempo trabalhado
  - **Seção de Descrição**: Background verde destacando a descrição quando disponível
  - **Botões de Ação**: Edit e Delete sempre visíveis com AlertDialog de confirmação
  - **Flexibilidade**: Suporte completo para work hours com e sem projetos associados
  - **Hover Effects**: Animações e efeitos consistentes com outros cards do sistema
  - **Qualidade Garantida**: Componente totalmente testado com 8 testes unitários

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
│       │   ├── layout/       # Componentes de layout
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

### 📂 Sistema de Upload e Armazenamento

O sistema utiliza uma estratégia de armazenamento inteligente com três níveis de prioridade:

#### 🚂 Railway Volume (Prioridade 1 - Produção)

- **Armazenamento Persistente**: Volume montado em `/app/data`
- **Backup Automático**: Incluído no plano Railway
- **Performance Otimizada**: Acesso local ao sistema de arquivos
- **Configuração**: Automática quando volume Railway está disponível

#### ☁️ AWS S3 (Prioridade 2 - Fallback)

- **Escalabilidade**: Armazenamento ilimitado na nuvem
- **Integração**: SDKs moderno e clássico
- **Configuração**: Através de variáveis de ambiente AWS
- **Uso**: Fallback quando Railway Volume não disponível

#### 📁 Storage Local (Prioridade 3 - Desenvolvimento)

- **Desenvolvimento**: Ideal para ambiente local
- **Simplicidade**: Sem configuração externa necessária
- **Limitações**: Não recomendado para produção
- **Localização**: Diretório `uploads/` no projeto

#### 🔧 Configuração Automática

```typescript
// O sistema detecta automaticamente a melhor opção:
// 1. Railway Volume (se RAILWAY_ENVIRONMENT + volume existir)
// 2. AWS S3 (se credenciais AWS configuradas)
// 3. Local Storage (fallback final)
```

#### 📋 Tipos de Arquivo Suportados

- **Documentos**: PDF, DOC, DOCX
- **Imagens**: JPEG, JPG, PNG
- **Limite de Tamanho**: 10MB por arquivo
- **Validação**: MIME type + extensão

### Segurança e Autorização

1. **Isolamento de Dados**: Usuários só acessam seus próprios dados
2. **Autenticação JWT**: Tokens com expiração configurável
3. **Validação de Input**: Todas as entradas são validadas no backend
4. **Upload Seguro**: Apenas tipos de arquivo permitidos são aceitos
5. **Armazenamento Segregado**: Arquivos organizados por usuário e pasta

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
│   ├── invoices/
│   │   └── __tests__/
│   │       └── invoice-search-filters.test.tsx
│   ├── projects/
│   │   └── __tests__/
│   │       └── project-card.test.tsx
│   └── ui/
│       └── __tests__/
│           └── alert.test.tsx
```

#### Exemplo de Testes

Os testes cobrem:

- **Renderização de Componentes**: Verificação se elementos aparecem corretamente
- **Interações do Usuário**: Cliques, digitação, mudanças de estado
- **Lógica de Hooks**: Teste do hook `useInvoiceFilters`
- **Filtros e Busca**: Validação de filtros por status, busca e ordenação
- **Componentes UI**: Testes de componentes base como Alert com suas variantes
- **Acessibilidade**: Verificação de atributos ARIA e roles apropriados
- **Sistema de Traduções**: Verificação da integridade das traduções de formulários

#### Testes de Traduções

O sistema inclui testes específicos para verificar a integridade das traduções de formulários:

```bash
# Executar testes de tradução
pnpm test form-translations
```

**Testes Implementados:**

- **Carregamento de Traduções**: Verifica se os subtítulos específicos de formulários são carregados corretamente
- **Consistência entre Idiomas**: Confirma que todas as chaves existem em português e inglês
- **Diferenciação de Contexto**: Valida que traduções de formulários são diferentes das descrições de páginas
- **Testes de Componentes**: Verificação se modais usam traduções específicas de formulários
- **Traduções de Cards**: Verificação de traduções específicas do WorkHourCard ("on" → "em")
- **Sistema de Traduções Customizado**: Verificação da função formatTimeAgo que usa traduções do projeto

**Localização dos Testes:**

```
apps/frontend/src/components/
├── __tests__/
│   └── form-translations.test.tsx       # Testes de integridade de traduções
└── clients/__tests__/
    └── edit-client-modal.test.tsx       # Testes do modal de edição
```

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

# Railway Storage (prioritário em produção)
RAILWAY_ENVIRONMENT="production"
RAILWAY_VOLUME_PATH="/app/data"

# AWS S3 (fallback opcional - usa storage local se não configurado)
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

### Acesso Administrativo

O primeiro usuário cadastrado no sistema (ID do banco de dados) é automaticamente definido como administrador. Administradores têm acesso a:

- Painel de estatísticas do sistema
- Gerenciamento de usuários (promover/remover admin, deletar usuários)
- Visualização de atividades recentes
- Métricas gerais do sistema (usuários, clientes, projetos, horas, faturas, receita)

Para acessar o painel administrativo, faça login com uma conta admin e navegue para `/admin`.

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

#### Sistema de Traduções para Formulários

O sistema agora inclui traduções específicas para formulários, separadas das descrições de páginas:

**Implementação em Componentes FormModal:**

```tsx
import { useTranslations } from "next-intl";

// Em vez de usar a descrição geral da página
<FormModal
  title={t("editClient")}
  description={t("editClientDescription")} // ❌ Descrição genérica da página
  // ...
/>

// Use o subtítulo específico do formulário
<FormModal
  title={t("editClient")}
  description={t("editClientFormSubtitle")} // ✅ Texto específico para formulário
  // ...
/>
```

**Chaves de Tradução Disponíveis:**

```json
{
  "clients": {
    "editClientFormSubtitle": "Modify client details and contact information",
    "addNewClientFormSubtitle": "Enter client information and contact details"
  },
  "workHours": {
    "addHoursFormSubtitle": "Record time spent on client projects"
  },
  "projects": {
    "addProjectFormSubtitle": "Create a new project and associate it with a client"
  },
  "invoices": {
    "createInvoiceFormSubtitle": "Generate invoice from tracked work hours",
    "editInvoiceFormSubtitle": "Update invoice status and details"
  }
}
```

**Benefícios das Traduções Específicas:**

- **Contexto Apropriado**: Textos mais específicos e diretos para ações em formulários
- **UX Melhorada**: Usuário entende melhor o que pode fazer no formulário
- **Flexibilidade**: Permite descrições diferentes para página vs modal/formulário
- **Manutenibilidade**: Traduções organizadas por contexto de uso

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

### 🚀 Railway (Recomendado) - Deploy Automático ⚡

O projeto está configurado para **deploy automático** no Railway usando Dockerfiles otimizados:

```bash
# Deploy automático - apenas push para o repositório!
git add .
git commit -m "feat: add Railway deployment configuration"
git push origin main

# 🚀 Railway detecta automaticamente e faz deploy dos serviços
```

**🎯 Arquitetura de Deploy:**

- **PostgreSQL Database** (Railway Template)
- **Backend API** (NestJS + Docker) - **Deploy Automático** ⚡
- **Frontend Web** (Next.js + Docker) - **Deploy Automático** ⚡
- **Railway Volume** (1GB) - **Storage Persistente** 📁

**✅ Configuração Automática:**

- Railway detecta os Dockerfiles automaticamente
- Build multi-stage otimizado com cache inteligente
- Health checks automáticos configurados (`/health`)
- Deployment automático a cada push para `main`
- Fallback inteligente: Railway Volume → AWS S3 → Local

**📁 Arquivos de configuração criados:**

- `apps/backend/Dockerfile` - Backend NestJS multi-stage otimizado
- `apps/frontend/Dockerfile` - Frontend Next.js com standalone output
- `.dockerignore` - Otimização de build Docker
- `RAILWAY_COMPLETE_GUIDE.md` - Guia completo de deploy no Railway

**💰 Custos estimados:** ~$15.25/mês (Database + Backend + Frontend + Volume)

### 📖 Guia Completo

Consulte o arquivo [`RAILWAY_COMPLETE_GUIDE.md`](./RAILWAY_COMPLETE_GUIDE.md) para instruções completas de deploy no Railway.

### 🐳 Docker Local

#### Usando Docker Compose (Desenvolvimento)

```bash
# Iniciar banco de dados local
docker-compose up -d

# Desenvolvimento com hot-reload
pnpm dev
```

#### Build das Imagens Docker

```bash
# Backend
cd apps/backend
docker build -t its-done-backend -f Dockerfile ../..

# Frontend
cd apps/frontend
docker build -t its-done-frontend -f Dockerfile ../..
```

### 🔧 Deploy Manual

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

### 🔒 Variáveis de Ambiente para Produção

#### Backend (.env)

```env
DATABASE_URL="postgresql://user:pass@host:5432/db"
JWT_SECRET="sua_chave_jwt_super_segura"
RESEND_API_KEY="re_sua_chave_resend"
FROM_EMAIL="noreply@seudominio.com"
NODE_ENV="production"
PORT="3002"
```

#### Frontend (.env.local)

```env
NEXTAUTH_URL="https://seu-dominio.com"
NEXTAUTH_SECRET="sua_chave_nextauth_super_segura"
API_URL="https://api.seu-dominio.com"
NODE_ENV="production"
```

### 📋 Checklist de Produção

- [ ] Todas as variáveis de ambiente configuradas
- [ ] Secrets únicos e seguros para produção
- [ ] HTTPS configurado (Railway fornece automaticamente)
- [ ] Backup automático do banco de dados habilitado
- [ ] Monitoramento e logs configurados
- [ ] Health checks funcionando (`/health` endpoint)
- [ ] CORS configurado adequadamente
- [ ] Rate limiting implementado

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

## Authentication

The application uses NextAuth.js for authentication, supporting both email/password and Google OAuth2 login methods.

### Authentication Flow

1. **Email/Password Authentication**

   - Users can register and login using email and password
   - Credentials are validated against the backend API
   - JWT tokens are used for session management

2. **Google OAuth2 Authentication**
   - Users can login using their Google account
   - The flow is handled by NextAuth.js
   - Callback URL: `/api/auth/callback/google`
   - After successful authentication, user data is synchronized with our backend

### Environment Variables

Make sure to set up the following environment variables:

```env
# Frontend (.env)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3000

# Backend (.env)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/callback/google
```
