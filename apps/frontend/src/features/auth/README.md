# Auth

Login, esqueci minha senha e redefinição de senha. `register` usa NextAuth (`signIn`) diretamente e não consome esta feature hoje.

## Pontos de entrada

- `LoginForm` — usado em `app/[locale]/login/page.tsx`
- `useLogin`, `useRegister`, `useForgotPassword`, `useResetPassword`, `useLogout`, `useMe` — hooks TanStack Query, usados por `login`/`forgot-password`/`reset-password`

## Notas

- `password.service.ts` (ex-`services/password.ts`) migrou pra cá por afinidade semântica, mas **não tem nenhum consumidor no frontend hoje** — não é re-exportado no `index.ts`. Ele também define um `useResetPassword` próprio, com o mesmo nome do `useResetPassword` de `auth.service.ts` (usado de verdade); não são a mesma função, e mantê-los separados evita colisão no barrel.

Consumidores fora desta feature devem importar de `@/features/auth`.
