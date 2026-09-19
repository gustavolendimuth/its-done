# Login unificado: uma sessão só para User e CompanyAdmin

## Contexto

`/login` autentica só `User` (NextAuth, provider `credentials` + Google). Quem administra
uma Company entra por `/company-admin/login`, uma tela à parte que fala com
`/company-admin/auth/login` e guarda o JWT num cookie httpOnly próprio
(`company_admin_token`), fora do NextAuth. O pedido original: usar o login geral também
para `CompanyAdmin`, redirecionando para a área certa depois de autenticar.

`User` e `CompanyAdmin` são tabelas independentes (ADR-0002), sem FK entre si e sem
vínculo declarado hoje: nada impede o mesmo email existir nas duas com senhas diferentes.

Comparando os dois mecanismos de sessão apareceu uma assimetria que muda o design: o
`accessToken` do `User` é hoje exposto ao client. `lib/axios.ts` chama `getSession()` no
browser e lê `session.accessToken` para montar o header `Authorization` manualmente — o
JWT do backend passa por JS de página, alcançável por qualquer XSS no app. O mecanismo do
`CompanyAdmin` não tem esse problema: todo tráfego passa por
`app/api/company-admin/[...path]/route.ts`, que injeta o Bearer token a partir do cookie
httpOnly, server-side; o browser nunca vê o token.

Este spec unifica sessão e corrige essa exposição ao mesmo tempo — a alternativa (manter
os dois mecanismos separados e só trocar o formulário) carregaria a falha de exposição
para o `CompanyAdmin` também, ou deixaria a inconsistência como está.

## Decisões

- **Identidade continua separada** (ADR-0002 se mantém): `CompanyAdmin` não vira um
  `User` com role. O que muda é o transporte da sessão, não a modelagem do domínio.
- **Um email não pode existir como `User` e `CompanyAdmin` ao mesmo tempo.** Hoje nada
  impede isso; passa a ser validado nos pontos de criação das duas tabelas.
- **NextAuth vira a sessão única**, com um `actorType` (`USER` | `COMPANY_ADMIN`)
  carregado no JWT interno. Mantém o provider Google (só para `USER` — `CompanyAdmin`
  não ganha login Google neste spec).
- **O `accessToken` do backend nunca mais é exposto ao client**, para nenhum dos dois
  actor types. Sai do objeto `Session` que `useSession()`/`getSession()` devolvem no
  browser; fica só no JWT interno do NextAuth, lido server-side.
- **Um proxy same-origin único** (generalização do padrão já usado por
  `company-admin/[...path]/route.ts`) passa a intermediar toda chamada autenticada do
  frontend, para os dois actor types.
- **`/company-admin/login` e o link dedicado saem.** `/login` vira o único ponto de
  entrada para os dois tipos de conta. `/company-admin/register`,
  `/company-admin/forgot-password` e `/company-admin/reset-password` continuam existindo
  como estão — só o link "voltar ao login" dentro deles passa a apontar para `/login`.

## Arquitetura

```
/login (form único)
   |
   v
signIn("credentials", { redirect: false })
   |
   v
authorize() no [...nextauth]/route.ts
   |-- tenta POST /auth/login (User)
   |-- se falhar, tenta POST /company-admin/auth/login (CompanyAdmin)
   |
   v
jwt() grava { actorType, accessToken } no JWT interno do NextAuth
   (session() NÃO repassa accessToken para o client)
   |
   v
client lê actorType via getSession() e decide o destino:
   USER -> /work-hours · COMPANY_ADMIN -> /company-admin/dashboard
   |
   v
toda chamada autenticada -> /api/backend/[...path]/route.ts
   (lê o JWT interno server-side via getToken(), injeta Bearer, encaminha)
```

## Componentes tocados

### Backend

Nenhuma mudança de contrato HTTP. `/auth/login` e `/company-admin/auth/login` continuam
existindo e respondendo do mesmo jeito — o `authorize()` do NextAuth passa a chamar os
dois em sequência, do lado do frontend.

| Arquivo | Mudança |
| --- | --- |
| `auth/auth.service.ts` — `register()` | Antes de criar o `User`, checa se o email já existe em `CompanyAdmin`; rejeita com `ConflictException` se existir. |
| `auth/auth.service.ts` — `googleAuth()` | No branch que cria `User` novo, mesma checagem contra `CompanyAdmin` antes de criar. |
| `company-admin/company-admin-auth.service.ts` — `register()` | `assertEmailNotTaken()` passa a checar `User` além de `CompanyAdmin`. |
| `company-admin/company-admin-auth.service.ts` — `confirmCompanyActivation()`, `confirmCompanyAdminInvite()` | Mesma extensão de `assertEmailNotTaken()` (método compartilhado, ganha o checagem uma vez só). |

### Frontend

| Arquivo | Mudança |
| --- | --- |
| `app/api/auth/[...nextauth]/route.ts` | `authorize()` tenta `/auth/login`, cai para `/company-admin/auth/login` se falhar; erro genérico se as duas falharem. `jwt()` grava `actorType` + `accessToken` no token interno. `session()` para de repassar `accessToken` — só expõe `actorType` e os campos de perfil. |
| `types/next-auth.d.ts` | `Session.user` ganha `actorType`; `accessToken` sai do tipo `Session` (continua só em `JWT`). `role` vira opcional — só existe para `actorType: 'USER'`. |
| `app/api/backend/[...path]/route.ts` (novo) | Generaliza `app/api/company-admin/[...path]/route.ts`: usa `getToken()` do `next-auth/jwt` em vez do cookie custom, e mantém o mesmo tratamento de binário/JSON que o proxy atual já tem — sem a interceptação de `access_token` na resposta, que só fazia sentido porque o proxy antigo também servia de endpoint de login. Login não passa mais por este proxy: acontece dentro de `authorize()`, direto no route handler do NextAuth. |
| `lib/axios.ts` | `baseURL` vira `/api/backend`; remove o interceptor que lê `getSession()`/monta o header `Authorization` no client, e os `console.log` de debug. |
| `lib/company-admin-axios.ts`, `lib/company-admin-session.ts`, `app/api/company-admin/[...path]/route.ts`, `app/api/company-admin/logout/route.ts` | Removidos — o proxy genérico e o `signOut()` do NextAuth cobrem os dois casos. |
| `features/company-admin/use-company-admin-auth.tsx` | Removido. A área da empresa passa a usar `useSession()` como o resto do app. |
| `app/[locale]/company-admin/layout.tsx` | Deixa de prover um contexto próprio; vira um guard comum, checando `session.user.actorType === 'COMPANY_ADMIN'` e redirecionando para `/login` quando não bate. |
| `features/auth/login-form.tsx` | `signIn("credentials", { redirect: false })`; no sucesso, lê `actorType` (via `getSession()`) e decide entre `/work-hours` e `/company-admin/dashboard`. Remove o link para `/company-admin/login`. |
| `app/[locale]/company-admin/login/page.tsx` (+ teste) | Removido. |
| `app/[locale]/company-admin/register/page.tsx`, `forgot-password/page.tsx`, `reset-password/page.tsx` | Só o link "voltar ao login" passa de `/company-admin/login` para `/login`. |
| `app/[locale]/(authenticated)/admin/page.tsx` e qualquer outro consumidor de `session.user.role` | Precisa tolerar `role` ausente (sessão de `COMPANY_ADMIN` não tem role de plataforma) — checagem já deveria ser `session.user.role === 'ADMIN'`, sem assumir que o campo sempre existe. |

## Fluxo de dados: login de CompanyAdmin

1. Pessoa preenche email e senha em `/login`.
2. `signIn("credentials", { redirect: false })` dispara `authorize()`.
3. `authorize()` chama `POST /auth/login`: falha (email não é `User`).
4. `authorize()` chama `POST /company-admin/auth/login`: sucede. Devolve
   `{ id, email, name: email, actorType: 'COMPANY_ADMIN', accessToken }` para o NextAuth
   (`CompanyAdmin` não tem campo `name` — usa o email como placeholder; o dashboard já
   busca os dados da Company separadamente, via suas próprias chamadas autenticadas).
5. `jwt()` grava `accessToken` e `actorType` no JWT interno do NextAuth.
6. `session()` devolve ao client só `{ user: { id, email, name, actorType }, expires }` —
   sem `accessToken`.
7. `LoginForm` lê `actorType === 'COMPANY_ADMIN'` e navega para `/company-admin/dashboard`.
8. Cada chamada dali em diante (ex.: `GET /company-admin/dashboard/summary`) passa por
   `/api/backend/company-admin/dashboard/summary`, que chama `getToken()` server-side,
   pega o `accessToken` do JWT interno e injeta `Authorization: Bearer`.

Login de `User` (senha ou Google) segue o mesmo caminho, só que `authorize()` já sucede
no passo 3 e `actorType` fica `'USER'`.

## Erros e segurança

- `authorize()` só retorna `null` (login inválido) se as duas tentativas falharem — a
  mensagem no formulário é genérica, não revela em qual tabela o email existe.
- Um `User` errando a senha aciona só `/auth/login`; só dispara a segunda tentativa
  (`/company-admin/auth/login`) quando o email realmente não existe como `User` — o
  throttle de 10/min por IP do endpoint de `CompanyAdmin` não é gasto por engano em todo
  erro de senha de `User`.
- 401 do proxy genérico redireciona para `/login` nos dois casos, substituindo os dois
  comportamentos divergentes de hoje (`/login` vs `/company-admin/login`).
- Verificação manual obrigatória antes de considerar pronto: abrir a aba Network do
  browser, logar como `User` e como `CompanyAdmin`, e confirmar que nenhuma resposta JSON
  devolvida ao client contém `accessToken` — nem em `/api/auth/session`, nem em nenhuma
  resposta do proxy.

## Sequenciamento

1. Backend: checagem de email único cruzando `User`/`CompanyAdmin` nos 5 pontos de
   criação listados acima (roda antes do resto — reduz o risco de a unificação de
   sessão topar com um email já duplicado nas duas tabelas).
2. Frontend: `[...nextauth]/route.ts` (actorType + accessToken fora da `Session`) e
   `types/next-auth.d.ts`.
3. Frontend: proxy genérico `app/api/backend/[...path]/route.ts` e migração de
   `lib/axios.ts` para usá-lo.
4. Frontend: `LoginForm` (fallback sequencial + redirect por actorType), remoção de
   `/company-admin/login`.
5. Frontend: `company-admin/layout.tsx` vira guard comum; remove
   `EmpresaAdminAuthProvider`/`use-company-admin-auth.tsx`,
   `lib/company-admin-axios.ts`, `lib/company-admin-session.ts`, e as rotas de proxy e
   logout antigas do `CompanyAdmin`.
6. Ajusta os links "voltar ao login" em `register`/`forgot-password`/`reset-password` do
   `company-admin` e qualquer consumidor de `session.user.role` que não tolere `role`
   ausente.
7. Roda a suíte completa e a verificação manual descrita acima.

Cada passo fecha compilando e com os testes daquele trecho passando antes do próximo.

## Testes

Sem mudança de contrato no backend — as specs de `auth.service` e
`company-admin-auth.service` ganham só os casos novos de email duplicado cruzado (2-3
casos por serviço).

No frontend, o grosso do trabalho é reescrever os testes que hoje mockam
`EmpresaAdminAuthProvider`/`company-admin-axios` para mockar `next-auth/react` — mesmo
padrão que `login-form.test.tsx` já usa. Afeta `company-admin/dashboard/page.test.tsx`,
`register/page.test.tsx`, `forgot-password/page.test.tsx`, `reset-password/page.test.tsx`,
e o teste do `login-form.tsx` ganha os casos de fallback para `CompanyAdmin`.

Manual, via `pnpm preview:start`: login de `User` (senha e Google), login de
`CompanyAdmin`, tentativa com senha errada nos dois, tentativa com email que não existe
em nenhuma tabela, e a checagem de Network descrita acima.

## Riscos

- Maior superfície tocada do que o pedido original: o transporte de toda chamada
  autenticada do app muda de base URL e perde o interceptor client-side. Mitigado pelo
  proxy genérico ser praticamente uma cópia do que já roda em produção para
  `CompanyAdmin` — não é código novo e não testado, é o mesmo padrão aplicado de novo.
- Perder o `EmpresaAdminAuthProvider` remove qualquer lógica de refresh/expiração que
  ele tivesse além do redirect em 401 — conferir se há algo além disso antes de apagar
  (pela leitura atual do arquivo, não há: o `axios.ts` genérico já tem o mesmo tratamento
  de 401).
- Sem dado de produção nem usuário real nesta branch (mesma situação registrada no spec
  de rename) — não há sessão ativa de ninguém para migrar nem cookie antigo para
  invalidar em produção.

## Fora de escopo

- Refresh token / rotação de token — os dois mecanismos atuais já são "JWT de vida longa
  em cookie, reverificado a cada request"; este spec não muda esse modelo, só onde o
  token fica exposto.
- Login Google para `CompanyAdmin`.
- Unificar `forgot-password`/`reset-password` de `User` e `CompanyAdmin` numa tela só —
  as duas telas de `CompanyAdmin` continuam existindo, só com o link de volta ajustado.
- Qualquer mudança em `Colaborador`/convite/domínio autorizado.
- O arquivo `.tasks/unificar-autenticacao-colaborador-empresa.md`, encontrado durante
  este brainstorming, propõe unificar só a UI mantendo os dois mecanismos de sessão
  separados — decisão incompatível com a deste spec. Descartado a pedido do usuário; não
  foi tocado nem apagado.
