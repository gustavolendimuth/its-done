# Bug: cadastro por e-mail/senha quebrado (404 `Cannot POST /auth/register`)

**Severity**: Critical (cadastro de novos usuários 100% inoperante)
**Status**: Fixed (validado ao vivo via Playwright: cadastro → auto-login → redirect `/work-hours`)
**Found during**: investigação do bug "widget de cronômetro sumiu" (branch `refactor/frontend-feature-architecture`), reprodução ao vivo via Playwright
**Affected file**: `apps/frontend/src/app/[locale]/register/page.tsx:62-63`

## Symptom

Preencher o formulário em `/register` e clicar em "Cadastrar" sempre falha com:

```
Cannot POST /auth/register
```

Confirmado ao vivo (dev local, `docker-compose.dev.yml`): a requisição vai para
`http://localhost:3002/auth/register` e o backend responde 404, porque a rota real é
`http://localhost:3002/api/auth/register` (o backend usa o prefixo global `/api`).

## Root cause

```ts
// apps/frontend/src/app/[locale]/register/page.tsx:61-64
const response = await fetch(
  `${process.env.NEXT_PUBLIC_API_URL}/auth/register`,
  { method: "POST", ... }
);
```

O código usa `process.env.NEXT_PUBLIC_API_URL` cru, sem o prefixo `/api`. Todo o resto do
frontend não faz isso diretamente — usa `getApiUrl()` (`apps/frontend/src/lib/utils.ts:33`),
que:

- normaliza a URL (remove barra final, aplica fallback se a env var estiver ausente/inválida),
- garante o sufixo `/api` (`ensureApiPrefix`),
- é a mesma função usada pelo Axios (`src/lib/axios.ts`) e pelo NextAuth
  (`route.ts` do `[...nextauth]`, que já usa `getApiUrl()` corretamente em `/auth/login` e
  `/auth/google`).

Ou seja: `register/page.tsx` é o único ponto de cadastro por credenciais que não passa pelo
helper central, e por isso é o único quebrado.

## Por que não foi pego antes

- Não há teste de integração/E2E cobrindo o submit real do formulário de `/register` contra o
  backend (só há testes de validação de campo/schema, se existirem).
- `pnpm build` não executa o `fetch` em tempo de build.
- O login via Google (`GoogleProvider`) e o login por credenciais de usuários já existentes
  funcionam normalmente, então o fluxo de cadastro por e-mail/senha é fácil de não notar em
  testes manuais do dia a dia.

## Suggested fix

Trocar a chamada raw por `getApiUrl()`, igual ao resto do app:

```ts
import { getApiUrl } from "@/lib/utils";

// ...
const response = await fetch(`${getApiUrl()}/auth/register`, { ... });
```

Mudança de 1 linha (+ import). Depois de aplicar, validar manualmente o fluxo completo:
cadastrar → auto-login via `signIn("credentials", ...)` → redirect para `/work-hours`.
