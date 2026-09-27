# Auto-cadastro e recuperação de senha do Administrador da Empresa (frontend)

> Build this with **tlc-implement**.
> Every criterion below becomes a check with a proof, referenced by its number. Nothing under
> `Unresolved` gets settled while building.

## Intent

MW-18 já expõe `POST /api/empresa-admin/auth/register`, `POST /api/empresa-admin/auth/forgot-password`
e `POST /api/empresa-admin/auth/reset-password`, mas o frontend só tem a tela de login
(`/empresa-admin/login`) — sem link pra cadastro, sem link pra "esqueci minha senha", e sem as
páginas que esses dois fluxos precisam. Quem não tem credencial hoje só consegue criar uma
Empresa+Administrador ou recuperar a senha chamando a API diretamente (curl/Postman); ninguém sem
acesso à API consegue usar a feature. Pior: quem recebe o email de reset de senha cai numa página
quebrada — `NotificationsService.sendPasswordResetEmail` é compartilhado com o `auth/` de `User` e
sempre aponta pra `/reset-password?token=`, página que sempre chama `POST /auth/reset-password`
(endpoint de `User`, que rejeita o claim `actorType: 'EMPRESA_ADMIN'` do token).

Com a mudança, a tela de login ganha links "Criar conta" e "Esqueci minha senha"; auto-cadastro e
recuperação de senha passam a ter páginas próprias sob `/empresa-admin/*`, cada uma chamando o
endpoint de `empresa-admin` correspondente, e o email de reset do Administrador aponta pra uma URL
que existe e funciona.

7 criterios em 3 slices · 1 one-way door · 1 open, dos quais 0 bloqueiam

## Criteria

### Auto-cadastro

1. When alguém acessa `/empresa-admin/register`, preenche nome da empresa, email e senha, e envia o
   form, then é feito `POST /api/empresa-admin/auth/register` e, em `201`, a sessão fica autenticada
   (mesmo mecanismo de cookie do login, via proxy) e a pessoa é redirecionada pra
   `/empresa-admin/dashboard` — sem passo extra de login manual, espelhando o que já acontece hoje
   em `login/page.tsx`.
2. If o backend responde `409` (email já usado por outro `EmpresaAdmin`), then o form mostra a
   mensagem de erro devolvida pelo backend e permanece na página, sem limpar os campos já
   preenchidos.
3. Always, a tela de login (`/empresa-admin/login`) mostra um link "Criar conta" apontando pra
   `/empresa-admin/register`.

### Recuperação de senha

4. When alguém acessa `/empresa-admin/forgot-password` e envia um email, then é feito
   `POST /api/empresa-admin/auth/forgot-password` e a tela mostra a mesma mensagem genérica que o
   backend devolve ("If the email exists...") independente de o email existir, sem revelar se a
   conta existe.
5. When alguém acessa `/empresa-admin/reset-password?token=<token>`, define uma nova senha (com
   confirmação) e envia, then é feito `POST /api/empresa-admin/auth/reset-password` com esse
   `token`; em sucesso, a tela mostra confirmação e redireciona pra `/empresa-admin/login`.
6. If o `token` da URL está ausente, expirado ou inválido, then a tela mostra erro e um link pra
   `/empresa-admin/forgot-password`, sem tentar submeter o form — mesmo padrão da página
   `/reset-password` de `User` hoje (`apps/frontend/src/app/[locale]/reset-password/page.tsx:82-113`).
7. Always, o email de recuperação de senha do Administrador é gerado por um método próprio de
   notificação (não `sendPasswordResetEmail` compartilhado) cuja URL aponta pra
   `${FRONTEND_URL}/empresa-admin/reset-password?token=...` — nunca pra `/reset-password`.

## Out of scope

- Qualquer mudança no fluxo de forgot/reset-password do `User` comum (`/reset-password`,
  `/auth/forgot-password`, `/auth/reset-password`) — permanece exatamente como está.
- Login automático após um reset de senha bem-sucedido — `resetPassword` no backend devolve só
  `{message}` (sem `access_token`), então a pessoa loga manualmente depois, igual ao fluxo de
  `User`.
- Validação de força de senha além do mínimo já existente no backend (`RegisterEmpresaAdminDto`,
  `ResetPasswordEmpresaAdminDto`) — nenhuma regra nova de senha é introduzida aqui.

## Observable

| Surface | Decision | Landing |
| --- | --- | --- |
| screen `/empresa-admin/register` | loading state | existing - padrão de `isSubmitting` já usado em `login/page.tsx` |
| screen `/empresa-admin/register` | error state | 2 |
| screen `/empresa-admin/register` | empty state | n/a - form sem lista, nada a exibir vazio |
| screen `/empresa-admin/register` | unauthorised state | n/a - rota pública, sem guard |
| screen `/empresa-admin/forgot-password` | loading/error state | existing - mesmo padrão de mutation com toast/alert já usado em `login/page.tsx` |
| screen `/empresa-admin/reset-password` | token ausente/inválido | 6 |
| screen `/empresa-admin/reset-password` | loading state | existing - mesmo padrão da página `/reset-password` de `User` |
| API `POST /api/empresa-admin/auth/register` | error shape e códigos | existing - `409` já implementado no service, inalterado |
| API `POST /api/empresa-admin/auth/forgot-password` | quem pode chamar | existing - pública, já com throttle 5/min (MW-27) |
| API `POST /api/empresa-admin/auth/reset-password` | rate limit | existing - throttle 5/min (MW-27), inalterado |

## Swept

- validation: existing - `class-validator` nos DTOs (`RegisterEmpresaAdminDto`, `ResetPasswordEmpresaAdminDto`), inalterado
- failure modes: 2, 6
- idempotency and retry: n/a - reenviar o form de forgot-password várias vezes é seguro hoje (mesma mensagem genérica, sem efeito colateral observável)
- authorization: existing - `register`/`forgot-password`/`reset-password` já são públicos no controller, `activate`/`invite` fora de escopo aqui
- concurrency and ordering: n/a - cada request é independente, sem estado compartilhado novo
- data lifecycle: n/a - nenhuma entidade nova; token de reset já expira em 1h no backend, inalterado
- external-dependency failure: existing - falha do Resend já é tratada (retorna `false`, loga erro) em `sendPasswordResetEmail`/futuro método próprio, sem mudança de contrato
- state transitions: n/a - `EmpresaAdmin` não ganha máquina de estados nesta task
- observability: n/a - usa o mesmo `console.log`/`console.error` já presente em `notifications.service.ts`, nenhum novo requisito

## Impact

| Front | What changes |
|---|---|
| domain | nenhum termo novo; reaproveita `EmpresaAdmin`, `access_token`, `admin` já definidos em MW-18 |
| stored data | nada a migrar - nenhuma mudança de schema |

## Decided

| Decision | Shape | Alternative rejected |
|---|---|---|
| Email de reset do Administrador usa um método de notificação próprio (ex.: `sendEmpresaAdminPasswordResetEmail`), não o `sendPasswordResetEmail` genérico | Novo método em `NotificationsService`, mesma assinatura `(email, name, token)`, URL fixa em `/empresa-admin/reset-password` | Adicionar um parâmetro de URL/tipo ao `sendPasswordResetEmail` existente - rejeitado porque esse método já é consumido por `auth/` de `User` sem esse parâmetro, e mudar sua assinatura é breaking change pro chamador existente sem necessidade |

## Surface

| Route | In | Out | Status | Criteria |
|---|---|---|---|---|
| `POST /api/empresa-admin/auth/register` | `company`, `email`, `password` | `admin` (`access_token` interceptado pelo proxy) | `201`, `409` | 1, 2 |
| `POST /api/empresa-admin/auth/forgot-password` | `email` | `message` | `200` | 4 |
| `POST /api/empresa-admin/auth/reset-password` | `token`, `newPassword` | `message` | `200`, `400` | 5, 6 |

## Sources

- MW-18 (Jira, https://gustavolendimuth.atlassian.net/browse/MW-18) - AC original: "Fluxo de
  forgot-password/reset-password funciona pra Administrador, reaproveitando o padrão de token do
  `auth/` atual" - cumprido no backend, não no frontend.
- Investigação desta conversa - `sendPasswordResetEmail` (apps/backend/src/notifications/notifications.service.ts:97-163)
  é compartilhado entre `User` e `EmpresaAdmin` e sempre aponta pra `/reset-password`; confirmado
  lendo `apps/frontend/src/features/auth/auth.service.ts:72-81` que a página genérica chama
  `POST /auth/reset-password` (endpoint de `User`).

Esta task é o registro da decisão. Se um documento vinculado divergir depois, perguntar antes de
construir.

## Unresolved

| # | Kind | Question | Until answered |
|---|---|---|---|
| 1 | open | O cadastro (`/empresa-admin/register`) deve ficar acessível a partir de algum lugar fora da tela de login (ex.: link na landing pública, no `/login` de `User`)? | Critério 3 assume, como default, só o link a partir da própria tela de login de Empresa; ver task separada de "entrada visível" pra decisão de descoberta mais ampla |

