# MW-31 — Auto-cadastro e recuperação de senha do Administrador da Empresa (frontend)

Profile: light (no `tlc-implement` block in the project's CLAUDE.md → default). Handoff: on,
default 150k budget — not needed here, single batch (see `## Handoff`).

Sources:

- [MW-31](https://gustavolendimuth.atlassian.net/browse/MW-31) (Jira) - AC original, inclui os
  dois links na tela de login ("Criar conta" e "Esqueci minha senha")
- `.tasks/empresa-admin-cadastro-recuperacao-senha.md` - critérios 1-7, Decided, Swept, Surface
- MW-18 (Jira) - endpoints de backend já existentes que esta task consome, inalterados
- Esta conversa - critério 8 adicionado por decisão do usuário: a task só cobria "Criar conta"
  (critério 3), deixando "Esqueci minha senha" do AC original descoberto; usuário confirmou
  adicionar

## Out of scope

- Qualquer mudança no fluxo de forgot/reset-password do `User` comum (`/reset-password`,
  `/auth/forgot-password`, `/auth/reset-password`) - permanece exatamente como está
- Login automático após reset de senha bem-sucedido - backend devolve só `{message}`, sem
  `access_token`; a pessoa loga manualmente depois, igual ao fluxo de `User`
- Validação de força de senha além do mínimo já existente nos DTOs do backend - nenhuma regra
  nova é introduzida aqui

## Landing

Toca `apps/frontend/src/app/[locale]/empresa-admin/{register,forgot-password,reset-password}/`
(3 páginas novas), `apps/frontend/src/features/empresa-admin/` (novo hook de mutations +
`register` no contexto de auth existente) e `apps/backend/src/notifications/notifications.service.ts`
(novo método de email). Reaproveita o padrão de `empresa-admin/login/page.tsx` (useState simples,
sem react-hook-form/zod — convenção própria de `/empresa-admin/*`, diferente do `/reset-password`
de `User`) e o mecanismo de cookie httpOnly do proxy (`app/api/empresa-admin/[...path]/route.ts`),
que já grava qualquer `access_token` vindo do backend, login ou register.

| One-way door | Literal shape | Alternative rejected |
| --- | --- | --- |
| Email de reset do Administrador ganha método próprio `sendEmpresaAdminPasswordResetEmail` em `NotificationsService` | Novo método, mesma assinatura `(email, name, token)` do `sendPasswordResetEmail` existente, URL fixa em `/empresa-admin/reset-password` | Adicionar parâmetro de URL/tipo ao `sendPasswordResetEmail` genérico - rejeitado porque já é consumido por `auth/` de `User` sem esse parâmetro; mudar a assinatura é breaking change pro chamador existente sem necessidade (decisão já registrada na task fonte, carregada aqui) |

- Nada mais neste change é difícil de reverter - 3 páginas novas seguindo um padrão existente, um
  método de notificação novo isolado do genérico

## Checks

### S1 - Auto-cadastro · 5 files · ~10k

**C1** - Ao preencher empresa/email/senha em `/empresa-admin/register` e enviar, é feito
`POST /api/empresa-admin/auth/register`; em sucesso a sessão fica autenticada (mesmo cookie
httpOnly do proxy usado no login) e a pessoa é redirecionada direto pra
`/empresa-admin/dashboard`, sem passo extra de login manual
Proof: `apps/frontend/src/app/[locale]/empresa-admin/register/page.test.tsx::"registers, authenticates through the same session mechanism as login, and redirects straight to the dashboard"`

**C2** - Se o backend responde `409` (email já usado), o form mostra a mensagem de erro devolvida
e permanece na página, sem limpar os campos já preenchidos
Proof: `apps/frontend/src/app/[locale]/empresa-admin/register/page.test.tsx::"shows the backend's 409 error message and keeps the entered fields"`

**C3** - A tela de login sempre mostra um link "Criar conta" apontando pra
`/empresa-admin/register`
Proof: `apps/frontend/src/app/[locale]/empresa-admin/login/page.test.tsx::"shows a Criar conta link to /empresa-admin/register"`

**C4** - A tela de login sempre mostra um link "Esqueci minha senha" apontando pra
`/empresa-admin/forgot-password` (critério adicionado - fecha o AC original do Jira)
Proof: `apps/frontend/src/app/[locale]/empresa-admin/login/page.test.tsx::"shows an Esqueci minha senha link to /empresa-admin/forgot-password"`

### S2 - Recuperação de senha: pedido · 4 files · ~8k

**C5** - Ao acessar `/empresa-admin/forgot-password` e enviar um email, é feito
`POST /api/empresa-admin/auth/forgot-password` e a tela mostra a mesma mensagem genérica que o
backend devolve, independente de o email existir
Proof: `apps/frontend/src/app/[locale]/empresa-admin/forgot-password/page.test.tsx::"submits the email and always shows the backend's generic message"`

### S3 - Recuperação de senha: redefinição · 6 files · ~20k

**C6** - Ao acessar `/empresa-admin/reset-password?token=<token>`, definir nova senha (com
confirmação) e enviar, é feito `POST /api/empresa-admin/auth/reset-password` com esse token; em
sucesso a tela mostra confirmação e redireciona pra `/empresa-admin/login`
Proof: `apps/frontend/src/app/[locale]/empresa-admin/reset-password/page.test.tsx::"submits the new password with the token, shows confirmation and redirects to login"`

**C7** - Se o token da URL está ausente, o form nunca é submetido (a tela já mostra erro e o link
pra `/empresa-admin/forgot-password` no primeiro render); se o backend rejeita o token como
expirado/inválido ao submeter, a mesma tela de erro substitui o form
Proof: `apps/frontend/src/app/[locale]/empresa-admin/reset-password/page.test.tsx::"shows an error and a link back to forgot-password when the token is missing"`
Proof: `apps/frontend/src/app/[locale]/empresa-admin/reset-password/page.test.tsx::"shows an error from the backend and a link back to forgot-password when the token is invalid or expired"`

**C8** - O email de recuperação de senha do Administrador é gerado por um método de notificação
próprio (não `sendPasswordResetEmail` compartilhado com `User`), com URL apontando pra
`${FRONTEND_URL}/empresa-admin/reset-password?token=...`, nunca pra `/reset-password`
Proof: `apps/backend/src/notifications/notifications.service.spec.ts::"sendEmpresaAdminPasswordResetEmail points to /empresa-admin/reset-password, never /reset-password"`
Proof: `apps/backend/src/empresa-admin/empresa-admin-auth.service.spec.ts::"forgotPassword calls sendEmpresaAdminPasswordResetEmail, not the shared sendPasswordResetEmail"`

## Swept

- validation: existing - `class-validator` nos DTOs de backend, inalterado (fora do escopo desta
  task, que é só frontend + 1 método de notificação)
- failure modes: C2, C7
- idempotency and retry: n/a - reenviar o form de forgot-password várias vezes é seguro hoje
  (mesma mensagem genérica, sem efeito colateral observável) - herdado da task fonte
- authorization: existing - `register`/`forgot-password`/`reset-password` já são públicos no
  controller, inalterado
- concurrency and ordering: n/a - cada request é independente, sem estado compartilhado novo
- data lifecycle: n/a - nenhuma entidade nova; token de reset já expira em 1h no backend,
  inalterado
- external-dependency failure: existing - falha do Resend já é tratada (retorna `false`, loga
  erro) no padrão de `sendEmail`; o novo método herda o mesmo `try/catch`
- state transitions: n/a - `EmpresaAdmin` não ganha máquina de estados nesta task
- observability: n/a - usa o mesmo padrão de `console.log`/`console.error` já presente em
  `notifications.service.ts`

- Claims naming a status code, route ou response shape: C1 (`201`, redirect), C2 (`409`), C6
  (`200`, redirect), C7 (form não submete) - cada um tem proof que cruza a fronteira (render +
  submit via testing-library, não teste de unidade isolado da função)

## Handoff

S1-S3 = 5+4+6 = 15 arquivos, ~38k estimado (chute a partir do tamanho dos arquivos irmãos já
existentes - `notifications.service.ts` sozinho tem 25KB/~6k tokens) - tudo num único batch, bem
abaixo do budget de 150k. Sem handoff entre agentes nesta feature.
