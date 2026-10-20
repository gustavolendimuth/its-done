# Ativação de uma Empresa existente (frontend)

> Build this with **tlc-implement**.
> Every criterion below becomes a check with a proof, referenced by its number. Nothing under
> `Unresolved` gets settled while building.

## Intent

MW-19 expõe `POST /api/company-admin/auth/activate/:companyId/request` e
`POST /api/company-admin/auth/activate/confirm` no backend, mas não existia nenhuma tela nem link
em lugar nenhum da aplicação pra usar esse fluxo. O email de confirmação
(`sendCompanyActivationEmail`, `apps/backend/src/notifications/notifications.service.ts`) apontava
pra `/company-admin/activate?token=...`, página que não existia: quem clicava caía em 404. O
primeiro passo (`POST .../activate/:companyId/request`) também exige um `companyId` que ninguém
tinha como obter: nem a tela do Colaborador (`/companies`) nem o Portal Público
(`/client-dashboard/[clientId]`) expunham esse id ou iniciavam a ativação. Uma Empresa faturada
por um Colaborador não tinha como descobrir que podia ativar a própria conta.

Com a mudança, `/company-admin/activate/request?companyId=` pede a ativação e
`/company-admin/activate?token=` confirma com o token do email, definindo a senha do primeiro
Administrador. Dois pontos de entrada levam ao pedido: o menu de compartilhar do card da Empresa
(Colaborador) e um banner no Portal Público (a própria Empresa).

8 criterios em 3 slices · 2 one-way doors · 1 open, dos quais 0 bloqueiam

## Criteria

### Pedido de ativação

1. When alguém acessa `/company-admin/activate/request?companyId=<id>`, preenche email (e
   opcionalmente domínio) e envia, then é feito
   `POST /api/company-admin/auth/activate/:companyId/request` com esse `companyId`; em sucesso, a
   tela esconde o form e mostra que um link de confirmação foi enviado, sem revelar se o
   `companyId`/email combinam com o registro (mesmo padrão de não revelar existência de conta já
   usado em forgot-password). Domínio em branco não é enviado.
2. If `companyId` está ausente da URL, then a tela mostra erro e não tenta submeter o form.
3. If o backend responde `400`, `404` ou `409` (email ou domínio não provam posse, Empresa
   desconhecida, Empresa já ativada), then o form mostra a mensagem devolvida e permanece na
   página.

### Confirmação de ativação

4. When alguém acessa `/company-admin/activate?token=<token>`, define uma senha (com confirmação)
   e envia, then é feito `POST /api/company-admin/auth/activate/confirm` com `{ token, password }`;
   em sucesso (`201`), a página autentica com `signIn("credentials")` usando o email do
   `admin` devolvido (mesmo padrão da página de registro) e redireciona pra
   `/company-admin/dashboard`. Se a conta foi criada mas o login automático falha, a tela avisa e
   manda entrar pelo login, sem navegar.
5. If o `token` está ausente na URL, then a tela mostra erro, sem form e sem tentar submeter.
   Senhas diferentes também não submetem.
6. If o backend responde `400` (token inválido ou expirado) ou `409` (Empresa já ativada, ou email
   já em uso por outro `CompanyAdmin`), then a tela mostra a mensagem devolvida e um link pra
   `/login`.

### Pontos de entrada

7. When a Empresa não tem Administrador (`hasActiveAdmin === false`), then o menu de compartilhar
   do card da Empresa em `/companies` oferece copiar link, WhatsApp e email pra
   `/company-admin/activate/request?companyId=<id>`. Empresa com Administrador (ou com
   `hasActiveAdmin` desconhecido) não mostra esses itens.
8. When alguém abre `/client-dashboard/[clientId]` e
   `GET /public/company/:companyId/activation-status` responde `hasActiveAdmin: false`, then a
   página mostra um banner com link pra página de pedido. O banner fica oculto durante o
   carregamento, em erro e quando a Empresa já tem Administrador.

## Out of scope

- Qualquer UI pra listar/buscar Empresas sem Administrador ativo a partir da visão de plataforma -
  fora do MVP; o Colaborador ou a própria Empresa chegam ao pedido pelos pontos de entrada do
  critério 7 e 8.
- Verificação de domínio via DNS/TXT - já fora de escopo desde o mapa original (MW-6, MW-9).
- Página `/company-admin/invite` - pertence a MW-29.
- Idioma do email (template do backend é em inglês) enquanto as páginas são em português.

## Observable

| Surface | Decision | Landing |
| --- | --- | --- |
| screen `/company-admin/activate/request` | empty state (sem `companyId`) | 2 |
| screen `/company-admin/activate/request` | error state | 3 |
| screen `/company-admin/activate/request` | loading state | existing - mesmo padrão de `isSubmitting` já usado em `company-admin/register/page.tsx` |
| screen `/company-admin/activate` | token ausente | 5 |
| screen `/company-admin/activate` | error state (400/409) | 6 |
| screen `/company-admin/activate` | loading state | existing - mesmo padrão de `isSubmitting` já usado em `company-admin/register/page.tsx` |
| menu de compartilhar do card da Empresa | itens de ativação visíveis só sem Administrador | 7 |
| banner em `/client-dashboard/[clientId]` | visível só sem Administrador; oculto em loading e erro | 8 |
| API `POST .../activate/:companyId/request` | quem pode chamar | existing - pública, throttle 20/min (MW-27), inalterado |
| API `POST .../activate/confirm` | quem pode chamar | existing - pública, throttle 10/min (MW-27), inalterado |
| API `GET /public/company/:companyId/activation-status` | quem pode chamar | 8 - pública, sem auth, mesmo padrão das rotas públicas de invoices |

## Swept

- validation: existing - `class-validator` nos DTOs (`RequestCompanyActivationDto`, `ConfirmCompanyActivationDto`), inalterado
- failure modes: 3, 5, 6, 8
- idempotency and retry: n/a - reenviar o pedido de ativação já é seguro hoje (backend rejeita Empresa já ativada, sem efeito colateral novo); o endpoint de status é leitura
- authorization: existing - os dois endpoints de ativação já são públicos por design (MW-19), inalterado. O endpoint de status também é público: qualquer pessoa com o UUID da Empresa descobre se ela tem Administrador. Aceito, porque o Portal Público já expõe as invoices da Empresa pra quem tem o mesmo UUID. Além do throttle global de 60 req/min por IP, o endpoint não tem limite próprio
- concurrency and ordering: existing, com lacuna - `assertCompanyNotActivated` é um `count` seguido de `create`, sem transação nem unique em `CompanyAdmin.companyId` (só `email` é unique). Rejeita ativações em sequência (409), mas dois confirms simultâneos com emails diferentes podem passar os dois. Comportamento do MW-19, fora do escopo desta task
- data lifecycle: n/a - token de ativação já expira em 1h no backend, inalterado
- external-dependency failure: existing - falha do Resend já é tratada (retorna `false`, loga erro) em `sendCompanyActivationEmail`, sem mudança de contrato. Novo: falha do `signIn` depois da conta criada (4) e falha do endpoint de status (8, banner oculto)
- state transitions: 7 e 8 - menu e banner seguem `hasActiveAdmin`. A transição "Empresa sem Administrador → Empresa ativada" continua no backend (MW-19)
- observability: n/a - sem requisito novo além do logging já existente

## Impact

| Front | What changes |
|---|---|
| domain | nenhum termo novo; reaproveita `Empresa`, `CompanyAdmin` já definidos em MW-17/MW-19 |
| stored data | nada a migrar - nenhuma mudança de schema |
| API contract | novo endpoint público `GET /public/company/:companyId/activation-status`, consumido pelo menu e pelo banner |

## Decided

| Decision | Shape | Alternative rejected |
|---|---|---|
| Página de pedido de ativação recebe o `companyId` via query string, não via path segment | `/company-admin/activate/request?companyId=<id>` | Path segment (`/company-admin/activate/request/:companyId`) - a query string é mais barata de gerar num link copiado à mão e não é um contrato público versionado |
| Pontos de entrada (decidido em 2026-09-19): os dois, menu de compartilhar do card da Empresa e banner no Portal Público | menu: copiar, WhatsApp e email; banner: link pra página de pedido | Só o menu - a Empresa não teria como chegar sozinha. Só o banner - o Colaborador não teria como mandar o link |
| Como o menu e o banner sabem se a Empresa tem Administrador | `GET /public/company/:companyId/activation-status` -> `200 { hasActiveAdmin: boolean }`, `404` pra Empresa desconhecida, sem auth | Estender o payload de invoices - acopla ativação a invoices e exige varrer todas as invoices pra responder um booleano |

## Surface

| Route | In | Out | Status | Criteria |
|---|---|---|---|---|
| `POST /api/company-admin/auth/activate/:companyId/request` | `email`, `domain?` | `message` (formato existente) | `200`, `400`, `404`, `409` | 1, 2, 3 |
| `POST /api/company-admin/auth/activate/confirm` | `token`, `password` | `admin` (`access_token` interceptado pelo proxy) | `201`, `400`, `404`, `409` | 4, 5, 6 |
| `GET /public/company/:companyId/activation-status` | - | `{ hasActiveAdmin: boolean }` | `200`, `404` | 7, 8 |

## Sources

- MW-19 (Jira, https://gustavolendimuth.atlassian.net/browse/MW-19) - AC original cobre só o
  endpoint; nenhuma tela foi pedida explicitamente, mas o email de confirmação já implementado
  (MW-19/notifications) pressupõe uma página em `/company-admin/activate`.
- Investigação desta conversa - `sendCompanyActivationEmail`
  (`apps/backend/src/notifications/notifications.service.ts`) gera a URL
  `/company-admin/activate?token=`; busca em `apps/frontend/src/app/[locale]/(authenticated)/companies/`
  e `client-dashboard/[clientId]/page.tsx` por "ativar"/"activate" não retornou nenhuma ocorrência.
- Plano de implementação (MW-28) - `docs/superpowers/plans/2026-09-19-mw-28-company-activation-frontend.md`
  fixa escopo, rotas, textos e testes; aqui ficam só os critérios.

Esta task é o registro da decisão. Se um documento vinculado divergir depois, perguntar antes de
construir.

## Unresolved

| # | Kind | Question | Until answered |
|---|---|---|---|
| 2 | open | Depois de confirmar a ativação e cair no dashboard, faz sentido mostrar um aviso explicando que Convite Pendente/Domínio Autorizado ainda precisam ser configurados (a aba Vínculos já existe, ver MW-24)? | Nenhum aviso novo foi assumido; a pessoa cai direto no dashboard vazio, mesmo comportamento de um cadastro novo via MW-18 |
