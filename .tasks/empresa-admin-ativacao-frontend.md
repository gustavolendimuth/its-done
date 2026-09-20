# Ativação de uma Empresa existente (frontend)

> Build this with **tlc-implement**.
> Every criterion below becomes a check with a proof, referenced by its number. Nothing under
> `Unresolved` gets settled while building.

## Intent

MW-19 expõe `POST /api/empresa-admin/auth/activate/:empresaId/request` e
`POST /api/empresa-admin/auth/activate/confirm` no backend, mas não existe nenhuma tela nem link em
lugar nenhum da aplicação pra usar esse fluxo. O email de confirmação
(`sendEmpresaActivationEmail`, `apps/backend/src/notifications/notifications.service.ts:169-189`) já
aponta pra `/empresa-admin/activate?token=...`, mas essa página não existe — quem clica cai em 404.
Além disso, o primeiro passo do fluxo (`POST .../activate/:empresaId/request`) exige um `empresaId`
que hoje ninguém tem como obter: não existe busca, link ou botão em nenhuma tela do Colaborador
(`/empresas`) nem no Portal Público (`/client-dashboard/[id]`) que exponha esse id ou inicie a
ativação. Resultado: uma empresa que um Colaborador fatura não tem nenhuma forma de descobrir que
pode ativar sua própria conta, e mesmo sabendo o `empresaId` de outra forma, o link do email de
confirmação não funciona.

Com a mudança, existe uma página pra pedir a ativação (dado um `empresaId`) e uma página pra
confirmar com o token recebido por email, definindo a senha do primeiro Administrador.

7 criterios em 2 slices · 1 one-way door · 2 open, dos quais 1 bloqueia

## Criteria

### Pedido de ativação

1. When alguém acessa `/empresa-admin/activate/request?empresaId=<id>`, preenche email (e
   opcionalmente domínio) e envia, then é feito
   `POST /api/empresa-admin/auth/activate/:empresaId/request` com esse `empresaId`; em sucesso, a
   tela mostra confirmação de que um email de verificação foi enviado, sem revelar se o
   `empresaId`/email combinam com o registro (mesmo padrão de não revelar existência de conta já
   usado em forgot-password).
2. If `empresaId` está ausente da URL, then a tela mostra erro e não tenta submeter o form.
3. If o backend responde `400` (Empresa já ativada, ou email/domínio não provam posse), then o form
   mostra a mensagem de erro devolvida e permanece na página.

### Confirmação de ativação

4. When alguém acessa `/empresa-admin/activate?token=<token>`, define uma senha e envia, then é
   feito `POST /api/empresa-admin/auth/activate/confirm` com esse `token`; em sucesso (`201`), a
   sessão fica autenticada (mesmo mecanismo de cookie do login, via proxy) e a pessoa é
   redirecionada pra `/empresa-admin/dashboard`.
5. If o `token` está ausente, expirado ou inválido, then a tela mostra erro, sem tentar submeter o
   form.
6. If o backend responde `409`/`400` (Empresa já ativada nesse meio-tempo, ou email já em uso por
   outro `EmpresaAdmin`), then a tela mostra a mensagem de erro devolvida.

## Out of scope

- Qualquer UI pra listar/buscar Empresas sem Administrador ativo a partir da visão de plataforma -
  fora do MVP; o Colaborador ou a própria Empresa já precisam saber o `empresaId` por algum canal.
- Verificação de domínio via DNS/TXT - já fora de escopo desde o mapa original (MW-6, MW-9).

## Observable

| Surface | Decision | Landing |
| --- | --- | --- |
| screen `/empresa-admin/activate/request` | empty state (sem `empresaId`) | 2 |
| screen `/empresa-admin/activate/request` | error state | 3 |
| screen `/empresa-admin/activate/request` | loading state | existing - mesmo padrão de `isSubmitting` já usado em `login/page.tsx` |
| screen `/empresa-admin/activate` | token ausente/inválido | 5 |
| screen `/empresa-admin/activate` | error state (409/400) | 6 |
| screen `/empresa-admin/activate` | loading state | existing - mesmo padrão de `isSubmitting` já usado em `login/page.tsx` |
| API `POST .../activate/:empresaId/request` | quem pode chamar | existing - pública, throttle 20/min (MW-27), inalterado |
| API `POST .../activate/confirm` | quem pode chamar | existing - pública, throttle 10/min (MW-27), inalterado |

## Swept

- validation: existing - `class-validator` nos DTOs (`RequestEmpresaActivationDto`, `ConfirmEmpresaActivationDto`), inalterado
- failure modes: 3, 5, 6
- idempotency and retry: n/a - reenviar o pedido de ativação várias vezes já é seguro hoje (backend rejeita Empresa já ativada, sem efeito colateral novo)
- authorization: existing - ambos os endpoints já são públicos por design (MW-19), inalterado
- concurrency and ordering: n/a - `assertEmpresaNotActivated` no backend já serializa a corrida entre dois pedidos de ativação simultâneos pra mesma Empresa, sem mudança nesta task
- data lifecycle: n/a - token de ativação já expira em 1h no backend, inalterado
- external-dependency failure: existing - falha do Resend já é tratada (retorna `false`, loga erro) em `sendEmpresaActivationEmail`, sem mudança de contrato
- state transitions: n/a - transição "Empresa sem Administrador → Empresa ativada" já é responsabilidade do backend (MW-19), esta task só consome os endpoints existentes
- observability: n/a - sem requisito novo além do logging já existente

## Impact

| Front | What changes |
|---|---|
| domain | nenhum termo novo; reaproveita `Empresa`, `EmpresaAdmin` já definidos em MW-17/MW-19 |
| stored data | nada a migrar - nenhuma mudança de schema |

## Decided

| Decision | Shape | Alternative rejected |
|---|---|---|
| Página de pedido de ativação recebe o `empresaId` via query string (`?empresaId=`), não via path segment | `/empresa-admin/activate/request?empresaId=<id>` | Path segment (`/empresa-admin/activate/request/:empresaId`) - decisão forçada pela ausência de uma rota Next.js dinâmica equivalente já criada; query string é mais barato de gerar a partir de um link copiado manualmente (ver Unresolved 1) e não é um contrato público versionado |

## Surface

| Route | In | Out | Status | Criteria |
|---|---|---|---|---|
| `POST /api/empresa-admin/auth/activate/:empresaId/request` | `email`, `domain?` | `message` (formato existente) | `200`, `400`, `404` | 1, 2, 3 |
| `POST /api/empresa-admin/auth/activate/confirm` | `token`, `password` | `admin` (`access_token` interceptado pelo proxy) | `201`, `400`, `404`, `409` | 4, 5, 6 |

## Sources

- MW-19 (Jira, https://gustavolendimuth.atlassian.net/browse/MW-19) - AC original cobre só o
  endpoint; nenhuma tela foi pedida explicitamente, mas o email de confirmação já implementado
  (MW-19/notifications) pressupõe uma página em `/empresa-admin/activate`.
- Investigação desta conversa - `sendEmpresaActivationEmail`
  (apps/backend/src/notifications/notifications.service.ts:169-189) já gera a URL
  `/empresa-admin/activate?token=`; busca em `apps/frontend/src/app/[locale]/(authenticated)/empresas/`
  e `client-dashboard/[clientId]/page.tsx` por "ativar"/"activate" não retornou nenhuma ocorrência.

Esta task é o registro da decisão. Se um documento vinculado divergir depois, perguntar antes de
construir.

## Unresolved

| # | Kind | Question | Until answered |
|---|---|---|---|
| 1 | blocks | Como um representante da Empresa descobre o `empresaId` pra acessar `/empresa-admin/activate/request`? Hoje nenhuma tela (nem `/empresas` do Colaborador, nem o Portal Público `/client-dashboard/[id]`) expõe esse id ou um link de ativação pronto. | Sem essa decisão, os critérios 1-3 ficam implementáveis mas inalcançáveis por qualquer pessoa fora de quem sabe manipular a URL manualmente - a feature de Ativação continua de fato inutilizável de ponta a ponta. Default recomendado: adicionar uma ação "Ativar Empresa" no card de cada Empresa sem Administrador ativo na tela `/empresas` do Colaborador, que copia/compartilha o link `/empresa-admin/activate/request?empresaId=...` (mesmo padrão de "copiar link" já usado no Portal Público, ver `apps/backend/CLAUDE.md` seção "Client Dashboard (Public)"). |
| 2 | open | Depois de confirmar a ativação e cair no dashboard, faz sentido mostrar um aviso explicando que Convite Pendente/Domínio Autorizado ainda precisam ser configurados (a aba Vínculos já existe, ver MW-24)? | Nenhum aviso novo foi assumido; a pessoa cai direto no dashboard vazio, mesmo comportamento de um cadastro novo via MW-18 |

