# Features

Cada domínio de negócio do produto (clients, invoices, projects, time-tracking, dashboard, analytics, settings, notifications, profile, auth, admin) vive numa pasta própria aqui dentro: `src/features/<domain>/`.

Plano completo desta reorganização: `.specs/features/frontend-architecture-refactor/` (spec, context, design, tasks).

## Estrutura interna (adaptativa por tamanho)

| Tamanho da feature | Regra |
| --- | --- |
| ≤ 6 arquivos de componente | Tudo flat na raiz de `features/<domain>/` (componentes + hooks + service(s) + `types.ts` + testes co-localizados) |
| \> 6 arquivos de componente | Componentes vão para `features/<domain>/components/`; hooks, service(s) e `types.ts` continuam flat na raiz da feature |
| Qualquer tamanho | Testes sempre ao lado do arquivo testado (`Componente.tsx` + `Componente.test.tsx`), nunca em `__tests__/` |
| Qualquer tamanho | `index.ts` (barrel export) e `README.md` sempre na raiz da feature |

## Regra de import

Código fora de uma feature **só pode importar do seu `index.ts`** (`@/features/<domain>`), nunca de um arquivo interno (`@/features/<domain>/components/algo-interno`). O `index.ts` de cada feature é a API pública do domínio — o que não está re-exportado ali é considerado implementação interna.

## O que fica fora de `features/`

Continua em `src/components/`, `src/hooks/`, `src/lib/`, `src/types/` (raiz) quando é genuinamente compartilhado entre 2+ domínios, ou é infraestrutura sem regra de negócio:

- `components/ui/` — design system (Radix/Shadcn)
- `components/layout/` — scaffold de layout e navegação (`PageHeader`, `PageContainer`, `Nav`, `Topbar`, etc.)
- `hooks/`, `lib/` (raiz) — `use-toast`, `use-safe-hydration`, `use-avatar`, `axios.ts`, `utils.ts`
- `types/` (raiz) — tipos genuinamente cross-domain (`ApiError`, tipos de UI genéricos)

Alguns arquivos de `src/services/` não pertencem a nenhuma feature hoje por não terem consumidor algum no frontend (`backup`, `export`, `import`, `webhook*`, `system`, `logs`, `audit`, `sms`, `push`) — permanecem em `src/services/` raiz, sem mover pra dentro de uma feature fictícia (ver `.specs/features/frontend-architecture-refactor/design.md`, seção Risks & Concerns).
