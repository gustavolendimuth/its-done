# Edição de Work Hour — Specification

## Problem Statement

A tela de Work Hours já lista, cria e exclui registros de horas trabalhadas, e o botão "Editar" de cada linha já existe na UI — mas está ligado a um `TODO` (`handleEdit` só faz `console.log`). O backend já expõe `PATCH /work-hours/:id`, mas o `UpdateWorkHourDto` está incompleto (sem `projectId`, sem as mesmas validações de `hours`/`date` do create) e o service não impede editar uma hora já faturada. O usuário não tem hoje nenhuma forma de corrigir um registro (data errada, horas erradas, descrição) sem excluir e recriar a entrada.

## Goals

- [ ] Usuário consegue editar `date`, `hours` e `description` de uma work hour existente a partir do botão "Editar" já presente na tabela.
- [ ] Uma work hour vinculada a uma fatura não cancelada (`PENDING`/`PAID`) não pode ser editada — nem pela UI, nem pela API.
- [ ] O `UpdateWorkHourDto` valida `hours`/`date` com as mesmas regras do create, evitando dados inconsistentes entrarem via PATCH.

## Out of Scope

Excluído explicitamente desta feature. Documentado para prevenir scope creep.

| Feature | Reason |
| --- | --- |
| Trocar `client`/`project` de uma work hour existente | Decisão do usuário: cliente e projeto ficam fixos após a criação; para mudar, exclui e recria a entrada. |
| Editar work hour em lote (bulk edit) | Fora do pedido original; a tabela já opera linha a linha. |
| Recalcular/ajustar automaticamente uma invoice já emitida quando a work hour associada muda | Bloqueado pela regra "não editar hora faturada" — não há caso a tratar. |
| Editar work hour a partir do fluxo do work-timer (`work-session-*-form`) | O timer tem seu próprio fluxo de finalização; esta spec cobre apenas o CRUD manual da tela Work Hours. |
| Auditoria/histórico de alterações (quem editou, quando, valor anterior) | Não pedido; nenhuma outra entidade do projeto tem audit trail hoje. |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Work hour já faturada (invoice `PENDING` ou `PAID`) não pode ser editada | Bloquear na API (400) e desabilitar o botão "Editar" na UI, com tooltip explicando o motivo | Decisão do usuário; evita divergência entre invoice emitida e o registro de horas que a originou | y |
| Campos editáveis | Apenas `date`, `hours`, `description` — `clientId`/`projectId` ficam fora do formulário de edição | Decisão do usuário | y |
| UI de edição | Reaproveitar `WorkHourForm` num modo de edição (nova prop opcional `workHour`), não um componente novo | Decisão do usuário; evita duplicar toda a estrutura de campos/validação já existente | y |
| `WorkHoursTable` precisa saber se uma work hour está faturada para desabilitar o botão | Adicionar `invoiceWorkHours` ao tipo `WorkHourRow` (já vem do backend em `findAll`, só não estava tipado) e computar `isInvoiced` no componente | Menor mudança possível; o dado já trafega, só não é usado | n — assumido por ausência de alternativa mais simples |
| `UpdateWorkHourDto` sem `projectId` | Mantido sem `projectId` (não editável, ver Out of Scope) — mas ganha as mesmas validações de `hours` (`@Min(0.1)`, `@Max(24)`, 2 casas decimais) e `date` (`@Transform` para `Date`) que `CreateWorkHourDto` já tem | Consistência de validação entre create/update; sem isso o PATCH aceita `hours: 999` ou `hours: -5` | n — assumido, alinhado ao goal 3 |
| Backend: onde bloquear a edição de hora faturada | No `WorkHoursService.update`, antes do `prisma.workHour.update`, checando `invoiceWorkHours` com invoice de status `PENDING`/`PAID` via include; lança `BadRequestException` | Mesmo padrão de checagem já usado em `findAvailable` (que filtra por essa mesma condição) | n — assumido por consistência com código existente |
| Mensagem de erro ao tentar editar hora faturada | Toast de erro genérico da feature (`errorSaving`) não é suficiente — precisa de uma mensagem específica traduzida (`cannotEditInvoiced` ou similar) tanto no botão desabilitado (tooltip) quanto no toast de erro se a API rejeitar | UX clara sobre *por que* não pode editar, não só que falhou | n — assumido, dimensão de observabilidade/UX mínima necessária |
| Demais dimensões (idempotência, concorrência, rate limit, lifecycle/expiry, dependência externa) | N/A para este escopo | PATCH síncrono, autenticado por JWT existente, sem chamada a serviço externo, sem necessidade de dedupe (form desabilita o botão de submit durante o `isPending`, padrão já usado no create) | y (assumido, escopo Medium) |

**Open questions:** nenhuma — todas resolvidas ou registradas acima.

---

## User Stories

### P1: Editar dados de uma work hour ⭐ MVP

**User Story**: Como freelancer que já lançou uma hora de trabalho, quero corrigir a data, a quantidade de horas ou a descrição de um registro existente, para não precisar excluir e recriar a entrada quando erro algo.

**Why P1**: É o objetivo central do pedido — o botão "Editar" já existe na UI e está sem função.

**Acceptance Criteria**:

1. WHEN o usuário clica no botão "Editar" de uma work hour não faturada THEN o sistema SHALL abrir o modal de work hour em modo edição, pré-preenchido com `date`, `hours` (formatado `HH:mm`) e `description` daquela entrada, com os campos de cliente e projeto ocultos (fixos, não editáveis).
2. WHEN o usuário altera `date`/`hours`/`description` no modo edição e confirma THEN o sistema SHALL enviar `PATCH /work-hours/:id` com apenas esses três campos, exibir toast de sucesso e fechar o modal.
3. WHEN o PATCH é bem-sucedido THEN o sistema SHALL invalidar as mesmas queries que `useUpdateTimeEntry` já invalida (`timeEntries`, `timeEntries/:id`, `workHours/stats`, `clients/stats`, `dashboard`), refletindo o valor novo na tabela sem reload manual.
4. WHEN o usuário submete o formulário de edição com `hours` fora do intervalo `0.1`–`24` ou com formato inválido (`HH:mm`) THEN o sistema SHALL bloquear o submit no client-side com a mesma mensagem de validação já usada na criação.

**Independent Test**: Editar uma work hour existente não faturada mudando a descrição e as horas; confirmar que a tabela mostra os novos valores e o total de horas recalcula.

---

### P1: Bloquear edição de work hour já faturada ⭐ MVP

**User Story**: Como freelancer, não quero conseguir editar uma hora que já foi usada para gerar uma fatura enviada ao cliente, para não criar divergência entre o valor faturado e o registro de horas.

**Why P1**: Decisão explícita do usuário nesta spec; sem essa trava, a feature de edição introduz um bug de integridade de dados.

**Acceptance Criteria**:

1. WHEN uma work hour está associada a pelo menos uma `invoiceWorkHour` cuja invoice tem status `PENDING` ou `PAID` THEN o botão "Editar" daquela linha na tabela SHALL aparecer desabilitado, com tooltip/aria-label explicando o motivo.
2. WHEN uma work hour está associada apenas a invoices `CANCELED` (ou a nenhuma invoice) THEN o botão "Editar" SHALL permanecer habilitado normalmente.
3. WHEN a API recebe `PATCH /work-hours/:id` para uma work hour associada a invoice `PENDING`/`PAID` (ex.: chamada direta, contornando a UI) THEN o sistema SHALL responder `400 Bad Request` sem alterar o registro.

**Independent Test**: Criar uma work hour, faturá-la (criar invoice PENDING incluindo essa hora), confirmar que o botão "Editar" fica desabilitado na tabela e que um PATCH manual via API retorna 400.

---

### P2: Validação consistente do `UpdateWorkHourDto`

**User Story**: Como mantenedor do backend, quero que `PATCH /work-hours/:id` valide `hours`/`date` com as mesmas regras do `POST /work-hours`, para não permitir dados inconsistentes entrarem só pelo endpoint de update.

**Why P2**: Necessário para o Goal 3, mas não bloqueia a entrega da edição em si via UI (a UI já valida no client) — é uma rede de segurança no backend.

**Acceptance Criteria**:

1. WHEN `PATCH /work-hours/:id` recebe `hours` menor que `0.1`, maior que `24`, ou com mais de 2 casas decimais THEN o sistema SHALL responder `400 Bad Request`.
2. WHEN `PATCH /work-hours/:id` recebe `date` como string ISO THEN o sistema SHALL converter para `Date` (mesmo `@Transform` do create) antes de persistir.

**Independent Test**: Chamar o PATCH diretamente com `hours: 30` e confirmar 400; chamar com `date: "2025-01-01T00:00:00.000Z"` (string) e confirmar que persiste corretamente.

---

## Edge Cases

- WHEN o usuário abre o modal de edição e cancela sem salvar THEN o sistema SHALL fechar o modal sem chamar o PATCH e sem alterar o registro.
- WHEN o PATCH falha por erro de rede/servidor (não relacionado a hora faturada) THEN o sistema SHALL exibir o toast de erro genérico já usado no create (`errorSaving`) e manter o modal aberto com os dados preenchidos.
- WHEN a work hour sendo editada é excluída por outra aba/sessão entre a abertura do modal e o submit THEN o sistema SHALL exibir o erro retornado pela API (404 tratado pelo mesmo fluxo de erro do PATCH) — sem tratamento especial adicional.
- WHEN `description` é apagado (string vazia) no modo edição THEN o sistema SHALL salvar como opcional/vazio, igual ao comportamento já existente no create.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| WHE-01 | P1: Editar dados de uma work hour (AC1, AC2) | Design | Pending |
| WHE-02 | P1: Editar dados de uma work hour (AC3) | Design | Pending |
| WHE-03 | P1: Editar dados de uma work hour (AC4) | Design | Pending |
| WHE-04 | P1: Bloquear edição de work hour já faturada (AC1, AC2) | Design | Pending |
| WHE-05 | P1: Bloquear edição de work hour já faturada (AC3) | Design | Pending |
| WHE-06 | P2: Validação consistente do UpdateWorkHourDto (AC1) | Design | Pending |
| WHE-07 | P2: Validação consistente do UpdateWorkHourDto (AC2) | Design | Pending |

**ID format:** `WHE-NN` (Work Hour Edit)

**Status values:** Pending → In Design → In Tasks → Implementing → Verified

**Coverage:** 7 total, 0 mapped to tasks, 7 unmapped ⚠️ (mapeamento ocorre na fase Tasks)

---

## Success Criteria

- [ ] Botão "Editar" da `WorkHoursTable` abre o modal pré-preenchido e salva alterações via PATCH.
- [ ] Work hour faturada (invoice `PENDING`/`PAID`) não pode ser editada nem pela UI (botão desabilitado) nem pela API (400).
- [ ] `UpdateWorkHourDto` rejeita `hours` fora de `0.1`–`24` / com mais de 2 casas decimais.
- [ ] Nenhuma regressão nos testes existentes de `work-hours.service.spec.ts` e nos testes de `work-hours-table`/`work-hour-form` (se existentes).
