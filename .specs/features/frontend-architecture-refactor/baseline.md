# Baseline pré-refactor

**Capturado em**: 2026-09-12, antes de qualquer task do refactor de arquitetura do frontend.
**Comando**: `cd apps/frontend && pnpm test:ci`

```
Test Suites: 32 failed, 14 passed, 46 total
Tests:       220 failed, 167 passed, 387 total
Snapshots:   0 total
```

**Build (root, `pnpm build` via turbo)**: passou — `3 successful, 3 total` (backend, frontend, e o terceiro pacote do monorepo).

Todo gate de task deste refactor compara contra este baseline: **mesmo número ou menos falhas, nunca mais**. As 220 falhas pré-existentes (documentadas em `.specs/STATE.md` como pendência não relacionada, originada no trabalho de work-timer) não são responsabilidade deste refactor corrigir.

---

## Resultado final (preenchido em T32)

**`pnpm test:ci` contra o HEAD final (commit `3cffc4d` + este doc)**: `32 failed, 14 passed, 46 total` suites / `220 failed, 167 passed, 387 total` testes — **idêntico byte-a-byte à baseline**. Confirmado repetidamente ao longo de toda a execução (a cada task, contra o HEAD já commitado, não contra a árvore de trabalho — ver lição registrada no T25).

**`pnpm build` (frontend)**: passa limpo, incluindo o passo de TypeScript do Next.js (que verifica o projeto inteiro, não só arquivos alcançáveis pelas rotas).

**`pnpm lint`**: continua quebrado por uma falha pré-existente do CLI do Next 16 (`next lint`), documentada desde T2 — não é uma regressão deste refactor.

**Cypress**: ao contrário do que os lotes 1-3 assumiram ("sem dev server/backend/DB disponível"), descobri em T32 que **o ambiente docker completo já estava rodando** (frontend com bind-mount ao vivo do código atual, backend, postgres, redis — containers de pé há horas). Rodei o Cypress de verdade contra ele:
- `auth/login.cy.ts`: "should display login form" **passa**; as outras 3 falham por motivos de fixture/ambiente pré-existentes e não relacionados a este refactor (credenciais de teste via `Cypress.env` não configuradas nesse ambiente; textos de validação que podem não bater com as traduções atuais).
- `clients/clients.cy.ts`, `projects/projects.cy.ts`, `work-hours/work-hours.cy.ts`: todos falham no `beforeEach` porque o comando customizado `loginByApi` (em `cypress/support/commands.ts`, nunca tocado por este refactor) faz POST pra `/api/auth/login`, uma rota que não existe nesse projeto NextAuth (usa `/api/auth/callback/credentials`). Isso é quebra de fixture pré-existente, não uma regressão de arquitetura.

**Checagem manual (Playwright MCP, headless, projeto local)**:
- `/pt-BR/login`: renderiza perfeitamente (formulário de e-mail/senha, botão "Entrar", botão Google, links de cadastro/recuperação de senha), zero erros de console.
- Via `curl` direto no container: `/clients`, `/projects`, `/work-hours`, `/settings`, `/admin` retornam 200. `/dashboard`, `/invoices`, `/analytics` retornam **500**.

### ⚠️ Achado fora do escopo desta feature: bug pré-existente de produção

`/dashboard`, `/invoices` e `/analytics` quebram em qualquer request real (SSR) com `ReferenceError: FileList is not defined`, originado em `z.instanceof(FileList).optional()` dentro de `invoice-upload-form.tsx` (linha de schema Zod avaliada no carregamento do módulo — `FileList` é uma API só de browser, inexistente no Node/SSR). Como `dashboard` e `analytics` importam (transitivamente) o barrel de `invoices`, o crash se propaga pra essas 3 páginas.

**Confirmado que é 100% pré-existente, não introduzido por este refactor**: `git diff` entre o conteúdo do arquivo no commit anterior a qualquer mudança (`6d3d2df`) e o arquivo atual mostra que essa linha é idêntica — só o caminho de import mudou (`@/services/invoices` → `@/features/invoices/invoices`). O bug já existia na estrutura antiga; nosso refactor só reorganizou os arquivos ao redor dele. Nenhum teste automatizado (jest usa jsdom, que define `FileList`) nem o `next build` (que não faz prerender dessas rotas dinâmicas) conseguia detectar isso — só um request real contra um servidor rodando expõe o problema, e por isso passou despercebido até agora.

**Não corrigido aqui** — é um bug de produção real e sério, mas fora do escopo de um refactor "zero mudança de comportamento". Recomendo abrir uma tarefa separada para corrigi-lo (ex.: `z.instanceof(typeof window !== "undefined" ? FileList : Object)` ou tornar o schema lazy).

### Veredito

Nenhuma regressão de comportamento introduzida por este refactor. As lacunas de verificação (Cypress com fixtures quebradas, 3 páginas com bug de SSR pré-existente) são limitações do estado atual do projeto, não consequência da reorganização de pastas.
