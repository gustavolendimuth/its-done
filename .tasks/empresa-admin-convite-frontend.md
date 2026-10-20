# Confirmação de Convite de Administrador (frontend)

> Build this with **tlc-implement**.
> Every criterion below becomes a check with a proof, referenced by its number. Nothing under
> `Unresolved` gets settled while building.

## Intent

MW-20 expõe `POST /api/empresa-admin/auth/invite` (autenticado, cria o convite) e
`POST /api/empresa-admin/auth/invite/confirm` (público, cria o segundo `EmpresaAdmin`), e o
disparo do convite já existe na aba Vínculos do dashboard (MW-24). Mas o email de convite
(`sendEmpresaAdminInviteEmail`, `apps/backend/src/notifications/notifications.service.ts:191-215`)
aponta pra `/empresa-admin/invite?token=...`, página que não existe no frontend — quem recebe o
convite e clica no link cai em 404 e nunca vira Administrador.

Com a mudança, existe uma página que recebe o token do convite, permite definir a senha, e loga a
pessoa direto no dashboard da Empresa que a convidou.

5 criterios em 1 slice · 0 one-way doors · 0 open

## Criteria

1. When alguém acessa `/empresa-admin/invite?token=<token>`, define uma senha e envia, then é
   feito `POST /api/empresa-admin/auth/invite/confirm` com esse `token`; em sucesso (`201`), a sessão
   fica autenticada (mesmo mecanismo de cookie do login, via proxy) e a pessoa é redirecionada pra
   `/empresa-admin/dashboard`.
2. If o `token` da URL está ausente, expirado ou inválido, then a tela mostra erro, sem tentar
   submeter o form.
3. If o backend responde `409` (email já em uso por outro `EmpresaAdmin`), then a tela mostra a
   mensagem de erro devolvida e não redireciona.
4. If o backend responde `404` (Empresa do convite não existe mais - ex.: nunca acontece hoje, mas
   é o shape de erro já definido em `confirmEmpresaAdminInvite`), then a tela mostra a mensagem de
   erro devolvida.
5. Always, a página não exige estar logado como nenhum tipo de conta (`User` ou `EmpresaAdmin`) pra
   ser acessada - o convite por si só é a prova de identidade, mesmo padrão do fluxo de Ativação.

## Out of scope

- Reenvio de convite expirado a partir dessa página - já existe a ação de revogar/recriar convite
  na aba Vínculos do dashboard (MW-24); esta página só consome um token já emitido.
- Notificação de volta pra quem convidou avisando que o convite foi aceito - não pedido em MW-20
  nem MW-16.

## Observable

| Surface | Decision | Landing |
| --- | --- | --- |
| screen `/empresa-admin/invite` | token ausente/inválido | 2 |
| screen `/empresa-admin/invite` | error state (409/404) | 3, 4 |
| screen `/empresa-admin/invite` | loading state | existing - mesmo padrão de `isSubmitting` já usado em `login/page.tsx` |
| screen `/empresa-admin/invite` | unauthorised state | 5 - n/a por design, rota pública |
| API `POST /api/empresa-admin/auth/invite/confirm` | quem pode chamar | existing - pública, throttle 5/min (MW-27), inalterado |

## Swept

- validation: existing - `class-validator` em `ConfirmEmpresaAdminInviteDto`, inalterado
- failure modes: 2, 3, 4
- idempotency and retry: n/a - reenviar o mesmo token duas vezes já falha no backend com `409` (email já criado na primeira tentativa), sem mudança nesta task
- authorization: existing - endpoint já público por design (MW-20), inalterado
- concurrency and ordering: n/a - sem estado compartilhado novo além do já coberto pelo backend
- data lifecycle: n/a - token de convite já expira em 1h no backend, inalterado
- external-dependency failure: existing - falha do Resend já é tratada (retorna `false`, loga erro) em `sendEmpresaAdminInviteEmail`, sem mudança de contrato
- state transitions: n/a - criação do segundo `EmpresaAdmin` já é responsabilidade do backend (MW-20)
- observability: n/a - sem requisito novo além do logging já existente

## Impact

| Front | What changes |
|---|---|
| domain | nenhum termo novo; reaproveita `EmpresaAdmin.invitedById` já definido em MW-20 |
| stored data | nada a migrar - nenhuma mudança de schema |

## Decided

`None - página nova consumindo um endpoint já existente, sem nenhuma decisão de schema, contrato
público novo ou dependência nova.`

## Surface

| Route | In | Out | Status | Criteria |
|---|---|---|---|---|
| `POST /api/empresa-admin/auth/invite/confirm` | `token`, `password` | `admin` (`access_token` interceptado pelo proxy) | `201`, `400`, `404`, `409` | 1, 2, 3, 4 |

## Sources

- MW-20 (Jira, https://gustavolendimuth.atlassian.net/browse/MW-20) - AC original cobre só o
  endpoint; nenhuma tela foi pedida explicitamente.
- Investigação desta conversa - `sendEmpresaAdminInviteEmail`
  (apps/backend/src/notifications/notifications.service.ts:191-215) já gera a URL
  `/empresa-admin/invite?token=`; confirmado que a página não existe (`find apps/frontend/src/app/[locale]/empresa-admin` só lista `login/` e `dashboard/`).

Esta task é o registro da decisão. Se um documento vinculado divergir depois, perguntar antes de
construir.

## Unresolved

`None`
