# Fix: confirmação de Domínio Autorizado usa email/página de reset de senha errados

> Build this with **tlc-implement**.
> Every criterion below becomes a check with a proof, referenced by its number. Nothing under
> `Unresolved` gets settled while building.

## Intent

`DominiosAutorizadosService.requestConfirmation` (`apps/backend/src/empresa-admin/dominios-autorizados.service.ts:75-114`)
gera um token com `type: 'domain-confirmation'` mas dispara o email chamando
`NotificationsService.sendPasswordResetEmail` (comentário no próprio código, linha 102-104: "Reuses
the existing password-reset email infrastructure... no dedicated email template was added"). Esse
método sempre aponta pra `/reset-password?token=...` — a página de reset de senha do `User` comum,
que sempre chama `POST /auth/reset-password`. Esse endpoint verifica o payload do token contra o
model `User` e rejeita o claim `actorType: 'EMPRESA_ADMIN'`/`type: 'domain-confirmation'` do token
de domínio. Resultado: o Administrador que clica no link do próprio email de confirmação de
domínio recebe um erro genérico de token inválido e o Domínio Autorizado nunca sai de `PENDING` por
esse caminho — a única forma de confirmar hoje é chamar `POST /api/empresa-admin/domains/confirm`
diretamente na API. O texto do email também diz "reset your password", o que não corresponde à ação
real (confirmar um domínio).

Com a mudança, o Administrador recebe um email com o assunto/corpo corretos e um link que leva a
uma página que existe e chama o endpoint certo, deixando o domínio `CONFIRMED`.

4 criterios em 1 slice · 1 one-way door · 0 open

## Criteria

1. When um Administrador pede confirmação de um Domínio Autorizado
   (`POST /api/empresa-admin/domains/:id/confirm`), then o email enviado ao próprio email de login
   do Administrador usa um template próprio ("Confirm Authorized Domain" ou equivalente, não "Reset
   Your Password") com um link pra `${FRONTEND_URL}/empresa-admin/domains/confirm?token=<token>`.
2. When o Administrador acessa `/empresa-admin/domains/confirm?token=<token>` com um token válido e
   `PENDING`, then é feito `POST /api/empresa-admin/domains/confirm` com esse `token`; em sucesso, a
   tela mostra que o domínio foi confirmado.
3. If o `token` está ausente, expirado, inválido, ou o domínio já não está `PENDING`, then a tela
   mostra a mensagem de erro devolvida pelo backend, sem tentar reenviar a confirmação
   automaticamente.
4. Always, a página não exige sessão de Administrador ativa pra funcionar — o endpoint
   `POST /api/empresa-admin/domains/confirm` já é público hoje (o token por si só é a prova), e isso
   não muda.

## Out of scope

- Mudar o formato do token de confirmação de domínio (`DOMAIN_CONFIRMATION_TOKEN_TYPE`) - já correto
  no backend, o bug é só a entrega (email) e o consumo (página inexistente).
- Reenviar confirmação de domínio automaticamente quando expira - já existe a ação de gerar nova
  confirmação (`POST /api/empresa-admin/domains/:id/confirm`) na aba Vínculos do dashboard (MW-24).

## Observable

| Surface | Decision | Landing |
| --- | --- | --- |
| screen `/empresa-admin/domains/confirm` | error state (token inválido/expirado/não-pendente) | 3 |
| screen `/empresa-admin/domains/confirm` | loading state | existing - mesmo padrão de spinner já usado em `login/page.tsx` |
| screen `/empresa-admin/domains/confirm` | unauthorised state | 4 - n/a por design, rota pública |
| API `POST /api/empresa-admin/domains/confirm` | contrato (payload, resposta) | existing - inalterado, só passa a ser efetivamente alcançado |

## Swept

- validation: existing - checagem de `type`/`actorType`/status `PENDING` já implementada em `DominiosAutorizadosService.confirm`, inalterada
- failure modes: 3
- idempotency and retry: existing - confirmar um domínio já `CONFIRMED` de novo já falha com `400` (`status !== 'PENDING'`) no backend, sem mudança nesta task
- authorization: existing - endpoint já público por design (MW-22), inalterado
- concurrency and ordering: n/a - sem estado compartilhado novo além do já coberto pelo backend
- data lifecycle: n/a - token de confirmação de domínio já expira em 1h no backend, inalterado
- external-dependency failure: existing - falha do Resend já é tratada (retorna `false`, loga erro), mesmo padrão do novo método de notificação
- state transitions: n/a - transição `PENDING → CONFIRMED` já é responsabilidade do backend (MW-22), esta task só corrige como se chega até ela
- observability: n/a - sem requisito novo além do logging já existente

## Impact

| Front | What changes |
|---|---|
| domain | nenhum termo novo; reaproveita `DominioAutorizado.status` já definido em MW-22 |
| stored data | nada a migrar - nenhuma mudança de schema |

## Decided

| Decision | Shape | Alternative rejected |
|---|---|---|
| Confirmação de domínio ganha um método de notificação próprio (ex.: `sendDominioAutorizadoConfirmationEmail`), no mesmo padrão de `sendEmpresaActivationEmail`/`sendEmpresaAdminInviteEmail` já existentes no arquivo | Novo método em `NotificationsService`, assinatura `(adminEmail, domain, token)`, URL fixa em `/empresa-admin/domains/confirm` | Continuar reaproveitando `sendPasswordResetEmail` só trocando a URL - rejeitado porque o texto do email ("Reset Your Password") ficaria semanticamente errado pra quem está confirmando um domínio, não resetando senha |

## Surface

| Route | In | Out | Status | Criteria |
|---|---|---|---|---|
| `POST /api/empresa-admin/domains/confirm` | `token` | `DominioAutorizado` atualizado (formato existente) | `200`, `400`, `404` | 2, 3 |

## Sources

- MW-22 (Jira, https://gustavolendimuth.atlassian.net/browse/MW-22) - AC original: "Domínio fica
  com status pendente até ser confirmado via o próprio email de login do Administrador" - o
  endpoint cumpre, a entrega (email) e o consumo (página) não.
- Investigação desta conversa - `dominios-autorizados.service.ts:102-109` (comentário do próprio
  autor confirma o reuso deliberado da infra de reset de senha); `apps/frontend/src/features/auth/auth.service.ts:72-81`
  confirma que a página `/reset-password` sempre chama `POST /auth/reset-password` (endpoint de
  `User`, não de `EmpresaAdmin`).

Esta task é o registro da decisão. Se um documento vinculado divergir depois, perguntar antes de
construir.

## Unresolved

`None`
