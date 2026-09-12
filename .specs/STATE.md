# STATE

## Decisions

### AD-001
- **Decision**: Funcionalidades que precisam funcionar sem conexão (ex.: timers, contadores, ações do usuário que não podem se perder) usam arquitetura local-first no frontend web: IndexedDB (via lib leve `idb`) como fonte da verdade imediata no dispositivo, com uma outbox de eventos timestampados sincronizada com o backend via um endpoint único de aplicação de eventos, idempotente por `eventId` gerado no cliente.
- **Reason**: Preparar terreno para uma futura versão mobile do produto — o mesmo padrão de "estado local + outbox + sync" se transporta conceitualmente pra um app nativo, mesmo que a implementação em si (IndexedDB) não seja reaproveitada 1:1.
- **Trade-off**: Mais complexidade do que uma API online-only simples (é preciso resolver conflito de estado entre dispositivos, idempotência de eventos, e replicar regras de negócio sensíveis a tempo tanto no cliente quanto no servidor).
- **Scope**: Frontend web (`apps/frontend`) — funcionalidades que precisam sobreviver a perda de conexão. Não se aplica a formulários/telas que já assumem conexão (ex.: telas de CRUD comuns do dashboard).
- **Date**: 2026-09-12
- **Status**: active

## Handoff

- **Feature**: work-timer (`.specs/features/work-timer/`) — **CONCLUÍDA**
- **Phase / Task**: Execute — todas as 24 tasks + 5 fix tasks (rodada 1) implementadas e commitadas; Verifier independente retornou PASS na rodada 2 de verificação (`.specs/features/work-timer/validation.md`)
- **Completed**: spec.md, context.md, design.md, tasks.md (24 tasks + 5 fixes), validation.md (PASS, rodada 2/3) — feature pronta, nenhuma task pendente
- **In-progress**: nenhum
- **Next step**: nenhum obrigatório. Pendências opcionais não-bloqueantes documentadas em `validation.md`: (1) gerar chaves VAPID reais e rodar UAT interativo do push/service worker em staging antes de confiar nisso em produção; (2) 4 gaps menores de precisão de teste (não afetam funcionamento); (3) considerar investigar a suíte de testes do frontend com 226 falhas pré-existentes (não relacionadas a esta feature, mas relevante pro projeto)
- **Blockers**: none
- **Uncommitted files**: none — tudo commitado localmente em `main` (não enviado ao remoto)
- **Branch**: main
