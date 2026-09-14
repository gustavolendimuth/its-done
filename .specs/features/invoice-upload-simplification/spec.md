# Invoice Upload Simplification Specification

## Problem Statement

No formulário de criação de invoice (`create-invoice-form.tsx`), o botão "Prepare File for Upload"
não faz nenhum upload — é um stub que apenas loga e mostra um toast de sucesso falso
(`handleFileUpload`, linhas 129-148). O upload real de arquivo só acontece dentro do `onSubmit`
(disparado pelo botão "Create Invoice"), que já cria a invoice e sobe o arquivo corretamente. O
botão intermediário é confuso e redundante — parece quebrado porque não faz nada visível.

## Root Cause (investigado)

- `create-invoice-form.tsx:129-148` (`handleFileUpload`, passado como `onUpload` pro componente
  compartilhado `InvoiceFileUpload`) é dead code funcional: nunca chama `uploadFileMutation`.
- O upload de verdade já existe e funciona em `create-invoice-form.tsx:150-196` (`onSubmit`):
  cria a invoice, depois faz upload do `selectedFile` se houver.
- Bug 100% client-side, sem branch de ambiente (`process.env`, URLs, etc.) → comportamento
  idêntico em localhost e produção. Não é bug de infraestrutura.
- Achado relacionado, já resolvido (não faz parte deste fix): componente morto
  `invoice-upload-form.tsx` continha `z.instanceof(FileList)` no escopo de módulo, quebrando SSR
  real (`/dashboard`, `/invoices`, `/analytics` com 500) sempre que o bundle era avaliado no
  servidor. Já foi deletado e removido do barrel (`index.ts`) nas mudanças não commitadas desta
  branch (`refactor/frontend-feature-architecture`).

## Goals

- [ ] Remover o botão "Prepare File for Upload" e o stub `handleFileUpload` do
      `create-invoice-form.tsx`.
- [ ] O único ponto de ação continua sendo "Create Invoice": cria a invoice e, se houver arquivo
      selecionado, sobe o arquivo na mesma operação (comportamento já existente em `onSubmit`,
      não precisa de lógica nova).
- [ ] Componente compartilhado `InvoiceFileUpload` ganha um jeito de esconder seu próprio botão
      de upload quando usado apenas pra seleção/staging de arquivo (sem quebrar os outros
      consumidores).

## Out of Scope

| Item | Motivo |
| ---- | ------ |
| `edit-invoice-form.tsx` | Já tem um botão de upload funcional e legítimo — a invoice já existe, então subir o arquivo é uma ação independente e imediata, não um stub. |
| `invoice-upload-modal.tsx` | Mesmo caso: upload pra invoice já existente, botão já funcional. |
| Mudanças de backend (`upload.service.ts`, `invoices.service.ts`) | Fluxo de upload real já funciona corretamente; bug é só de UI/lógica morta no frontend. |
| Re-teste de produção real (via browser contra URL deployada) | Causa raiz é lógica client-side sem branch de ambiente; comportamento em prod é idêntico ao de localhost por construção do código, não carece de teste ao vivo contra prod. |

---

## Assumptions & Open Questions

| Assumption / decisão | Default escolhido | Motivo | Confirmado? |
| --------------------- | --------------- | --------- | ---------- |
| Nome do prop novo em `InvoiceFileUpload` | `showUploadButton?: boolean` (default `true`) | Segue o padrão dos outros flags booleanos do componente (`showInvoiceNumber`, `compact`, `disabled`) | n (assumido) |
| `onUpload`/`isUploading`/`uploadButtonText` viram opcionais na interface | Sim | Só fazem sentido quando `showUploadButton` é `true`; `create-invoice-form` não precisa mais passá-los | n (assumido) |
| Texto de descrição do card de upload na tela de criação | Mantém o texto atual ("Upload the official invoice document after generating it...") | Já comunica corretamente que o upload acontece depois; não é o problema relatado | n (assumido) |

**Open questions:** nenhuma — resolvidas ou registradas acima.

---

## User Stories

### P1: Criar invoice com upload de arquivo em uma única ação ⭐ MVP

**User Story**: Como usuário criando uma invoice, quero selecionar o arquivo da nota fiscal e
clicar em "Create Invoice" uma única vez, sem precisar de um passo extra que não faz nada visível.

**Why P1**: É o bug relatado — o botão extra parece quebrado e confunde o usuário.

**Acceptance Criteria**:

1. WHEN o usuário abre o formulário de criar invoice THEN o sistema SHALL exibir a área de
   seleção de arquivo sem nenhum botão de "Prepare File for Upload" ou equivalente.
2. WHEN o usuário seleciona um arquivo e clica em "Create Invoice" THEN o sistema SHALL criar a
   invoice e, em seguida, subir o arquivo selecionado para essa invoice (mesmo comportamento hoje
   existente em `onSubmit`).
3. WHEN o upload do arquivo falhar após a invoice já ter sido criada THEN o sistema SHALL manter o
   comportamento atual: invoice criada com sucesso, toast de aviso informando que o upload falhou
   e pode ser feito depois (via `edit-invoice-form.tsx`/`invoice-upload-modal.tsx`).
4. WHEN o usuário não seleciona nenhum arquivo THEN o sistema SHALL criar a invoice normalmente,
   sem tentar upload (comportamento já existente).

**Independent Test**: Preencher o formulário de criar invoice com um arquivo selecionado, clicar
"Create Invoice" uma vez, e verificar que a invoice é criada com o arquivo já anexado (sem clicar
em nenhum botão intermediário).

---

## Edge Cases

- WHEN o `InvoiceFileUpload` é usado em `edit-invoice-form.tsx`/`invoice-upload-modal.tsx` (prop
  não passado) THEN o sistema SHALL continuar exibindo o botão de upload normalmente
  (retrocompatibilidade via default `true`).

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----------- | ------ | ------- |
| INVUP-01 | P1 | Execute | Pending |
| INVUP-02 | P1 | Execute | Pending |
| INVUP-03 | P1 | Execute | Pending |
| INVUP-04 | P1 | Execute | Pending |

**Coverage:** 4 total, 4 mapeadas pra tasks (inline, sem tasks.md formal — escopo Medium), 0 sem cobertura.

---

## Success Criteria

- [ ] Nenhum botão "Prepare File for Upload" (ou texto equivalente) visível no formulário de criar invoice.
- [ ] Criar invoice com arquivo selecionado resulta em invoice criada + arquivo anexado numa única interação do usuário.
- [ ] `edit-invoice-form.tsx` e `invoice-upload-modal.tsx` continuam funcionando sem alteração de comportamento.
