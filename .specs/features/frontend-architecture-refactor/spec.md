# Frontend Architecture Refactor Specification

## Problem Statement

`apps/frontend/src` está organizado por tipo técnico (`components/`, `hooks/`, `services/`, `types/`), não por domínio de negócio. Alguns sintomas já mensuráveis: `components/invoices/` tem 11 arquivos com 2590 linhas somadas, `components/ui/` tem 56 arquivos, arquivos isolados chegam a 838 linhas (`analytics/page.tsx`) e 612 linhas (`loading-skeleton.tsx`), e não existe nenhum barrel export por domínio (só `types/index.ts`). Isso já dificulta localizar "tudo que pertence a X" e vai piorar à medida que o produto cresce (mais domínios como work-timer, analytics). Como o time também usa agentes de IA para desenvolver, essa fragmentação técnica-por-tipo (em vez de por domínio) aumenta o custo de descoberta de contexto para o agente a cada tarefa.

## Goals

- [ ] Reorganizar o código de cada domínio de negócio (clients, invoices, projects, work-hours/work-timer, dashboard, analytics, settings, notifications, profile, addresses, auth, admin) numa estrutura feature-based sob `src/features/<domain>/`
- [ ] Cada feature expõe uma API pública única via `index.ts` (barrel export) — consumidores externos não importam arquivos internos da feature
- [ ] Cada pasta de feature tem um `README.md` curto descrevendo responsabilidade, convenções e pontos de entrada
- [ ] Arquivos multi-responsabilidade/grandes (ver lista de candidatos abaixo) são quebrados em unidades menores e nomeadas de forma previsível
- [ ] Testes passam a ficar co-localizados junto ao arquivo testado, substituindo as pastas `__tests__/`
- [ ] Zero mudança de comportamento visível: mesma UI, mesmas rotas, mesmos textos, mesmo comportamento funcional — só reorganização + splitting interno
- [ ] `CLAUDE.md` do projeto é atualizado para descrever a nova estrutura e convenções

## Out of Scope

Explicitamente excluído. Documentado para prevenir scope creep.

| Feature | Reason |
| --- | --- |
| Redesenho visual/UX de qualquer tela | Este refactor é estrutural, não visual — ver AD registrado no context.md |
| Troca de biblioteca de state management (TanStack Query, etc.) | Não solicitado; risco desnecessário combinado com reorganização de pastas |
| Adoção de Atomic Design | Descartado explicitamente pelo usuário em favor de feature-based |
| Corrigir as 226 falhas pré-existentes na suíte de testes do frontend | Falhas pré-existentes documentadas em `.specs/STATE.md` (work-timer); usadas só como baseline de comparação, não como algo a corrigir aqui |
| Mudança de rotas/URLs do App Router | As rotas (`app/[locale]/(authenticated)/<domain>/page.tsx`) continuam nos mesmos caminhos; só o que elas importam muda |
| Alterar contratos com o backend (DTOs, endpoints) | Fora de escopo — é puramente uma reorganização client-side |
| Migrar `apps/backend` | Fora de escopo — só `apps/frontend` |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Nomenclatura de pastas | kebab-case (padrão já 100% consistente hoje) | Evita introduzir uma segunda convenção | y |
| Tipos usados por 1 domínio só | Migram para dentro do feature correspondente | Reduz indireção; tipos genuinamente cross-domain ficam em `types/` raiz | y |
| Rotas do App Router | Viram wrappers finos que só importam da feature correspondente | Decorre logicamente do modelo feature-based | y |
| Agrupamento exato de domínios (ex.: work-hours + work-timer = 1 feature ou 2?) | Decidido na fase de Design com base em acoplamento real | Não é uma decisão de "o quê", é uma decisão de arquitetura | y |
| Limiar de linhas/responsabilidade que dispara split de arquivo | Definido em Design (ex.: alvo ~250-300 linhas ou critério de responsabilidade única) | Preferível a um número arbitrário fixado sem olhar caso a caso | y |

**Open questions:** none — todas resolvidas ou registradas acima (ver também `context.md` para o histórico completo da discussão).

---

## User Stories

### P1: Domínio de negócio co-localizado ⭐ MVP

**User Story**: Como desenvolvedor (humano ou agente de IA) trabalhando numa tela/feature (ex.: invoices), quero encontrar componentes, hooks, services e tipos daquele domínio numa única pasta, para não precisar varrer `components/`, `hooks/`, `services/` e `types/` separadamente a cada tarefa.

**Why P1**: É o objetivo central do refactor — sem isso, nenhum outro ganho (README, barrel, split de arquivos) resolve o problema de fragmentação.

**Acceptance Criteria**:

1. WHEN um desenvolvedor abre `src/features/<domain>/` THEN o sistema SHALL conter todos os componentes, hooks e services específicos daquele domínio que hoje estão espalhados em `components/<domain>/`, `hooks/` e `services/<domain>.ts`
2. WHEN um componente/hook/service é usado por 2+ domínios diferentes THEN o sistema SHALL mantê-lo fora de `features/` (em `components/`, `hooks/` ou `lib/` na raiz de `src/`), nunca duplicado dentro de cada feature
3. WHEN a migração de um domínio é concluída THEN as pastas técnicas antigas (`components/<domain>/`, entrada correspondente em `services/`) SHALL deixar de existir (sem código morto/duplicado remanescente)
4. WHEN o build de produção (`pnpm build:frontend`) roda após a migração completa THEN o sistema SHALL compilar sem erros de import quebrado

**Independent Test**: Escolher um domínio já migrado (ex.: `clients`), confirmar que 100% do código relevante está em `src/features/clients/`, rodar `pnpm build:frontend` e `pnpm typecheck` (ou equivalente) sem erros novos.

---

### P1: Nenhuma regressão de comportamento ⭐ MVP

**User Story**: Como usuário final do produto, quero que a aplicação continue funcionando exatamente igual depois do refactor, para não perceber nenhuma diferença de uso.

**Why P1**: Um refactor estrutural que quebra funcionalidade não é aceitável — é a condição de segurança que permite fazer o refactor "big bang" com confiança.

**Acceptance Criteria**:

1. WHEN a suíte de testes do frontend roda após o refactor THEN o sistema SHALL ter exatamente o mesmo conjunto de testes passando que passavam antes do refactor (baseline capturado antes de qualquer mudança), permitindo apenas mudanças de caminho de import nos próprios arquivos de teste movidos
2. WHEN a suíte de testes do frontend roda após o refactor THEN o sistema SHALL não ter nenhum teste passando-antes-e-falhando-depois (comparação 1:1 contra a baseline, não contra "zero falhas")
3. WHEN os testes E2E do Cypress relevantes rodam após o refactor THEN o sistema SHALL passar nos mesmos cenários que passavam antes
4. WHEN uma verificação manual (Playwright MCP local) percorre os fluxos principais (login, listar clients, criar invoice, work-hours, work-timer) THEN o sistema SHALL renderizar e se comportar identicamente ao comportamento pré-refactor

**Independent Test**: Rodar a suíte de testes antes (baseline) e depois do refactor completo e comparar os dois relatórios; navegar manualmente pelos fluxos principais via Playwright MCP.

---

### P1: API pública por domínio via barrel export ⭐ MVP

**User Story**: Como desenvolvedor consumindo um domínio de fora dele (ex.: a página de dashboard usando algo de `invoices`), quero importar de um único ponto de entrada (`features/invoices`), para não depender de caminhos internos que podem mudar.

**Why P1**: Sem isso, o encapsulamento por domínio é só organizacional, não real — qualquer arquivo interno continuaria importável de qualquer lugar.

**Acceptance Criteria**:

1. WHEN um domínio é migrado THEN o sistema SHALL expor um `index.ts` na raiz de `src/features/<domain>/` re-exportando tudo que é consumido fora da feature
2. WHEN código fora de `src/features/<domain>/` precisa de algo desse domínio THEN o import SHALL vir de `@/features/<domain>` (ou caminho equivalente), nunca de um arquivo interno tipo `@/features/<domain>/components/xyz-internal`
3. WHEN um arquivo é interno ao domínio (não faz parte da API pública) THEN o sistema SHALL não re-exportá-lo no `index.ts`

**Independent Test**: Rodar uma busca (`grep`) por imports de `features/<domain>/` fora do próprio domínio e confirmar que todos batem em `features/<domain>` ou `features/<domain>/index`, nunca em subcaminhos internos.

---

### P2: Documentação de contexto por domínio (README)

**User Story**: Como desenvolvedor (ou agente de IA) chegando pela primeira vez numa feature, quero um README curto explicando do que ela trata e quais são as convenções, para me orientar sem precisar ler todo o código primeiro.

**Why P2**: Acelera onboarding e uso por agentes, mas o refactor de pastas em si (P1) já entrega a maior parte do valor de organização mesmo sem os READMEs.

**Acceptance Criteria**:

1. WHEN uma feature é migrada THEN o sistema SHALL conter um `README.md` na raiz de `src/features/<domain>/` descrevendo: responsabilidade do domínio, principais pontos de entrada (componentes/hooks exportados), e qualquer convenção específica daquele domínio
2. WHEN o README é escrito THEN o sistema SHALL mantê-lo curto (orientado a "o que tem aqui e por onde entrar", não um manual completo)

**Independent Test**: Abrir `src/features/<domain>/README.md` de qualquer domínio migrado e confirmar que descreve responsabilidade + pontos de entrada sem precisar abrir mais nenhum arquivo para entender do que se trata.

---

### P2: Arquivos pequenos e previsíveis

**User Story**: Como desenvolvedor revisando ou modificando um componente, quero que arquivos grandes/multi-responsabilidade sejam quebrados em partes menores e nomeadas de forma consistente, para localizar e alterar só a parte relevante.

**Why P2**: Melhora manutenibilidade e reduz o "raio de blast" de uma mudança, mas não é bloqueante para o objetivo central de co-localização por domínio (P1).

**Acceptance Criteria**:

1. WHEN um arquivo excede o limiar de tamanho/responsabilidade definido em Design (ver Assumptions) THEN o sistema SHALL dividi-lo em arquivos menores dentro da mesma feature, cada um com responsabilidade única
2. WHEN um arquivo é dividido THEN os nomes dos arquivos resultantes SHALL deixar claro o que cada um contém, sem exigir abrir o arquivo pra descobrir
3. WHEN um arquivo grande tem uma razão legítima para não ser dividido (ex.: uma tabela genuinamente coesa) THEN o sistema SHALL documentar a exceção no README da feature em vez de forçar uma divisão artificial

**Independent Test**: Conferir a lista de arquivos candidatos (`analytics/page.tsx` 838 linhas, `loading-skeleton.tsx` 612 linhas, `work-hours-table.tsx` 440 linhas, `invoice-file-upload.tsx` 425 linhas, `address-form.tsx` 402 linhas, `dashboard/overview.tsx` 381 linhas, `create-invoice-form.tsx` 378 linhas, `client-card.tsx` 370 linhas) e confirmar que cada um foi dividido ou tem exceção documentada.

---

### P2: Testes co-localizados

**User Story**: Como desenvolvedor escrevendo ou lendo um teste, quero que ele fique ao lado do arquivo que testa, para não pular entre uma pasta de código e uma pasta `__tests__` separada.

**Why P2**: Ganho de ergonomia e de "agent-friendliness" (menos saltos de contexto), mas não afeta a cobertura de teste em si — é reorganização, não reescrita de testes.

**Acceptance Criteria**:

1. WHEN um arquivo de teste é migrado THEN o sistema SHALL colocá-lo no mesmo diretório do arquivo testado, com o sufixo já usado hoje (`.test.tsx`/`.test.ts`)
2. WHEN a migração de testes termina THEN o sistema SHALL não deixar nenhuma pasta `__tests__/` vazia ou remanescente dentro de `src/features/`
3. WHEN um teste é movido THEN o sistema SHALL manter 100% das asserções originais — só caminhos de import podem mudar

**Independent Test**: Rodar `find src/features -type d -name __tests__` e confirmar que não retorna nada; rodar a suíte de testes e confirmar mesma contagem de testes que a baseline.

---

### P3: CLAUDE.md atualizado com a nova arquitetura

**User Story**: Como desenvolvedor (ou agente) iniciando qualquer tarefa futura no frontend, quero que o `CLAUDE.md` do projeto explique a estrutura feature-based e suas convenções, para seguir o mesmo padrão em features novas.

**Why P3**: É documentação de apoio — o valor já foi entregue pela estrutura em si; isso só evita que a próxima feature seja criada fora do padrão por falta de contexto.

**Acceptance Criteria**:

1. WHEN o refactor é concluído THEN `CLAUDE.md` (raiz do projeto) SHALL descrever a estrutura `src/features/<domain>/`, o padrão de barrel export, e onde ficam os componentes/hooks/libs compartilhados
2. WHEN uma seção antiga de `CLAUDE.md` descreve a estrutura anterior (`components/your-feature/`) THEN o sistema SHALL atualizá-la para refletir a nova convenção

**Independent Test**: Ler a seção de arquitetura frontend do `CLAUDE.md` atualizado e confirmar que bate com a estrutura real do repositório.

---

## Edge Cases

- WHEN um componente é genuinamente compartilhado entre 2+ domínios (ex.: `PageHeader`, `InfoCard`, `BigStatsDisplay`, avatar) THEN o sistema SHALL mantê-lo em `components/` (raiz), nunca duplicado ou movido para dentro de uma única feature
- WHEN um hook/lib é cross-cutting (ex.: `use-toast`, `axios.ts`, `use-safe-hydration`, i18n) THEN o sistema SHALL mantê-lo fora de `features/`
- WHEN uma rota do App Router (`app/[locale]/.../page.tsx`) precisa de lógica/UI de domínio THEN o sistema SHALL delegar essa lógica ao `index.ts` da feature correspondente, mantendo o arquivo de rota fino
- WHEN um import quebra durante a migração (referência a caminho antigo) THEN o sistema SHALL ser pego pelo build/typecheck antes de qualquer commit ser considerado concluído
- WHEN um teste Cypress (E2E) referencia um seletor/texto que não muda de comportamento, só de localização de arquivo fonte THEN o sistema SHALL continuar passando sem alteração de asserção
- WHEN um domínio tem acoplamento ambíguo com outro (ex.: work-hours ↔ work-timer) THEN a decisão de agrupá-los ou não SHALL ser explicitada e justificada no `design.md`, não decidida implicitamente durante a execução

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| FEARCH-01 | P1: Domínio de negócio co-localizado | Design | Pending |
| FEARCH-02 | P1: Nenhuma regressão de comportamento | Design | Pending |
| FEARCH-03 | P1: API pública por domínio via barrel export | Design | Pending |
| FEARCH-04 | P2: Documentação de contexto por domínio (README) | Design | Pending |
| FEARCH-05 | P2: Arquivos pequenos e previsíveis | Design | Pending |
| FEARCH-06 | P2: Testes co-localizados | Design | Pending |
| FEARCH-07 | P3: CLAUDE.md atualizado com a nova arquitetura | Design | Pending |

**ID format:** `FEARCH-[NUMBER]`

**Status values:** Pending → In Design → In Tasks → Implementing → Verified

**Coverage:** 7 total, 0 mapeados a tasks ainda, 7 não mapeados ⚠️ (normal nesta etapa — mapeamento acontece em Design/Tasks)

---

## Success Criteria

- [ ] `src/components/`, `src/hooks/`, `src/services/`, `src/types/` não contêm mais código específico de um único domínio de negócio — só o que é genuinamente compartilhado/cross-cutting
- [ ] Todo domínio de negócio identificado (clients, invoices, projects, work-hours/work-timer, dashboard, analytics, settings, notifications, profile, addresses, auth, admin) tem uma pasta em `src/features/`
- [ ] `pnpm build:frontend`, `pnpm lint` e a suíte de testes rodam com o mesmo resultado (build ok, mesmas falhas pré-existentes, nenhuma nova) que a baseline capturada antes do refactor
- [ ] Verificação manual via Playwright MCP dos fluxos principais não mostra nenhuma regressão visual/funcional
- [ ] `CLAUDE.md` reflete a estrutura final real
