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

_Pendente — preenchido ao final de toda a execução (Fase 11)._
