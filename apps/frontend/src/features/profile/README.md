# Profile

Edição do perfil do usuário logado (nome, telefone, avatar) — acessível pelo popover no topbar.

## Pontos de entrada

- `ProfilePopover` — popover com o avatar + formulário de edição, usado por `components/ui/enhanced-user-avatar.tsx` (avatar é compartilhado entre domínios; a edição de perfil em si pertence a esta feature)
- `ProfileForm` — formulário de edição, renderizado dentro do `ProfilePopover`
- `useProfile`, `useUpdateProfile` — hooks TanStack Query do perfil

## Notas

- `user.service.ts` (ex-`services/user.ts`) migrou por afinidade semântica, mas **não tem nenhum consumidor no frontend hoje** — não é re-exportado no `index.ts` por não fazer parte da API pública ativa da feature (ver `.specs/features/frontend-architecture-refactor/design.md`, Risks & Concerns).
- Existiam dois arquivos de teste para o service de perfil (`profile.test.tsx` e `profile.test.ts`, este último um subconjunto/duplicata do primeiro) — pré-existente, não criado por este refactor. Ambos foram preservados como estavam (`profile.service.test.tsx` e `profile.service.test.ts`), sem mesclar ou remover, para não alterar comportamento/cobertura.
- Há uma dependência circular pré-existente entre esta feature e `components/ui/enhanced-user-avatar.tsx` (`ProfilePopover` usa `EnhancedUserAvatar`, que usa `ProfilePopover`) — não introduzida por este refactor, apenas preservada.

Consumidores fora desta feature devem importar de `@/features/profile`.
