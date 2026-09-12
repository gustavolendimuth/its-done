# Frontend Architecture Refactor Context

**Gathered:** 2026-09-12
**Spec:** `.specs/features/frontend-architecture-refactor/spec.md`
**Status:** Ready for design

---

## Feature Boundary

Reorganizar a estrutura de pastas de `apps/frontend/src` de "por tipo técnico" (components/, hooks/, services/, types/ genéricos) para "por domínio de negócio" (feature-based), sem alterar comportamento visível da aplicação. Inclui quebrar arquivos grandes/multi-responsabilidade, adotar barrel exports por domínio, co-localizar testes, e documentar convenções (README/CLAUDE.md por domínio) para acelerar tanto humanos quanto agentes de IA navegando o código.

---

## Implementation Decisions

### Working tree / sequenciamento

- Trabalho pendente de work-timer (WKT-10/WKT-11 + troca de card por tabela em work-hours) foi commitado ANTES de iniciar o refactor, em 2 commits separados na `main`.
- O refactor roda inteiro numa branch dedicada: `refactor/frontend-feature-architecture`.

### Escopo do refactor

- **Big bang**: todo o `apps/frontend/src` é reorganizado numa única iniciativa (mesma branch), não domínio por domínio ao longo de dias/PRs separadas.
- Isso não impede que a fase de Tasks quebre o trabalho em tasks atômicas menores por domínio dentro dessa mesma branch/PR — só significa que a PR final é única.

### Estilo de arquitetura

- **Feature-based / domain-driven**: cada domínio de negócio ganha uma pasta própria sob `src/features/<domain>/` contendo os arquivos que hoje estão espalhados em `components/<domain>/`, hooks específicos daquele domínio (hoje soltos ou inexistentes), e o service correspondente de `services/<domain>.ts`.
- `components/ui/` (design system compartilhado: Radix + Shadcn wrappers, 56 arquivos) permanece como está, fora de `features/`.
- Componentes genuinamente compartilhados entre múltiplos domínios (ex.: `PageHeader`, `InfoCard`, `BigStatsDisplay`, avatar) ficam num nível compartilhado (`components/` na raiz, fora de `features/`), não duplicados por domínio.
- Hooks/libs genuinamente cross-cutting (ex.: `use-toast`, `axios.ts`, `use-safe-hydration`) permanecem fora de `features/`.
- O mapeamento exato de quais domínios existem (ex.: se `work-hours` e `work-timer` viram um único feature `time-tracking` ou dois features separados) e o desenho final da árvore de pastas é decisão da fase de **Design**, não desta fase de Specify — aqui só fica fixada a filosofia (feature-based) e as exceções acima (ui/ compartilhado, cross-cutting fora de features/).

### Agent-friendliness (o que priorizar)

Todos os quatro pontos abaixo importam, nesta ordem de prioridade percebida pelo usuário:

1. **README.md por domínio** — cada pasta em `features/<domain>/` ganha um README curto (responsabilidade, convenções, pontos de entrada). Este é o item que o usuário marcou como "Recomendado".
2. **Barrel exports (`index.ts`) por domínio** — cada feature expõe sua API pública via `index.ts`; consumidores externos à feature importam só dali, nunca de arquivos internos.
3. **Arquivos pequenos e previsíveis** — quebrar arquivos grandes/multi-responsabilidade (ver lista de candidatos no spec) em partes menores.
4. **Co-localização de testes** — testes ficam ao lado do arquivo testado (`Componente.tsx` + `Componente.test.tsx`), substituindo as pastas `__tests__/` atuais.

### Agent's Discretion

- Nomenclatura exata de arquivos internos de cada feature (ex.: `types.ts` vs `types/index.ts`, `schemas.ts` vs `validation.ts`) fica a critério do agente durante o Design, desde que consistente entre todos os domínios.
- Limiar de linhas/responsabilidades que dispara "quebrar o arquivo" é decisão de Design (ex.: um número-alvo como ~250-300 linhas ou um critério de responsabilidade única), não foi fixado pelo usuário.
- Decisão de mesclar ou não `work-hours` e `work-timer` num único feature é do agente na fase de Design, com base em acoplamento real (hoje `lib/work-timer-*` já é consumido só por `work-timer` e a página de `work-hours` embute o widget de timer).

### Declined / Undiscussed Gray Areas → Assumptions

- **Convenção de nomenclatura de pastas** (kebab-case vs. outra) — não discutido explicitamente; assumido: manter kebab-case, que já é o padrão 100% consistente no projeto atual.
- **O que fazer com `types/index.ts` e `types/entities.ts` hoje compartilhados entre domínios** — não discutido; assumido: tipos usados por um único domínio migram para dentro do feature correspondente; tipos genuinamente compartilhados (ex.: tipos de API, tipos de UI genéricos) permanecem em `types/` na raiz. Decisão fina fica para Design.
- **Se as rotas do App Router (`app/[locale]/(authenticated)/<domain>/page.tsx`) devem virar apenas um "wrapper fino" que importa do feature** — não discutido explicitamente, mas decorre logicamente da escolha feature-based; registrado aqui como requisito assumido (ver spec.md).

---

## Specific References

Nenhuma referência externa de produto foi citada. O usuário se baseou na estrutura já existente do backend (`apps/backend/src/<module>/` agrupando controller+service+dto) como padrão mental de "boas práticas de organização por domínio", pedindo o equivalente no frontend.

---

## Deferred Ideas

- Migração de padrão de state management (ex.: trocar TanStack Query por outra lib) — fora de escopo, não foi cogitado.
- Redesenho visual/UX de qualquer tela — fora de escopo; este refactor é estrutural, não visual.
- Adoção de Atomic Design — avaliado e explicitamente descartado pelo usuário em favor de feature-based.
- Investigar as 226 falhas pré-existentes na suíte de testes do frontend (mencionadas em `.specs/STATE.md` como pendência do work-timer) — seguem fora de escopo deste refactor; serão apenas usadas como baseline de comparação (ver spec.md), não corrigidas aqui.
