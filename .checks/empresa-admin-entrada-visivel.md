# Ponto de entrada visível pro login da Empresa

Sources:

- `.tasks/empresa-admin-entrada-visivel.md` - critérios, boundary, sweep, unresolved
- Jira MW-32 - ratifica os mesmos 2 critérios, sem informação adicional

## Out of scope

- Link no menu autenticado do Colaborador (`main-layout.tsx`/`nav.tsx`) - mistura papéis sem uma
  decisão de UX (Unresolved 1 da task)
- Landing pública/institucional fora da aplicação - fora do repositório

## Landing

Toca só `apps/frontend/src/features/auth/login-form.tsx` (link novo) e os dois arquivos de
mensagens i18n (`en.json`, `pt-BR.json`), reusando o padrão de link já existente ali
(`forgotPassword`/`signUp`, `<a href>` com `text-primary hover:underline`) e o namespace
`auth.login` já consumido via `useTranslations`.

`None - link estático numa tela existente, reusando padrão de markup e i18n já presentes no
arquivo, não é uma decisão de uma via.`

## Checks

### S1 - Link visível em /login · 3 files · 94 KB · ~24k

**C1** - `/login` renderiza um link de texto (equivalente a "É administrador de uma empresa?
Entre aqui") cujo `href` é `/empresa-admin/login`
Proof: `cd apps/frontend && npx jest login-form.test.tsx -t "pointing to /empresa-admin/login"`

**C2** - O link está presente no DOM renderizado sem qualquer sessão/autenticação mockada (mesmo
harness que já renderiza o resto de `/login` sem auth)
Proof: `cd apps/frontend && npx jest login-form.test.tsx -t "without any session mocked"`

## Swept

- validation: n/a - link estático, sem input
- failure modes: n/a - link estático, sem chamada de rede própria
- idempotency and retry: n/a - navegação, não há escrita
- authorization: existing - `/login` e `/empresa-admin/login` já são públicas, nenhuma mudança de
  guard
- concurrency and ordering: n/a - sem estado compartilhado
- data lifecycle: n/a - nenhuma entidade envolvida
- external-dependency failure: n/a - nenhuma dependência externa nova
- state transitions: n/a - nenhuma máquina de estados envolvida
- observability: n/a - sem requisito novo

## Coverage

- Sem sets de enumeração declarados nesta task (2 critérios, sem tabela/enum/lista de casos) -
  nada a recompor aqui.
- C1 e C2 rodam sobre o mesmo `render(<LoginForm />)`, sem nenhuma sessão/mock de auth injetada -
  o harness já prova "sem autenticação" para as duas asserções (href e presença) ao mesmo tempo.
