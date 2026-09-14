# Admin

Painel de administração (primeiro usuário por ID do banco é admin automático). Gestão de usuários e visão de atividade recente do sistema.

## Pontos de entrada

- `AdminUsers` — tabela de usuários (promover/rebaixar admin, excluir), usada na aba "Users" de `app/.../admin/page.tsx`
- `AdminActivity` — feed de atividade recente, usada na aba "Recent Activity"
- `useSystemStats`, `useAllUsers`, `useUpdateUserRole`, `useDeleteUser`, `useRecentActivity` — hooks TanStack Query

## Notas

- A aba "Overview" de `app/.../admin/page.tsx` ainda contém a marcação dos cards de estatística inline na rota (não extraída pra esta feature nesta migração) — a rota já delega toda a lógica de usuários/atividade e os dados vêm de `useSystemStats` importado daqui, mas os cards em si continuam na rota. Candidato a uma extração futura (`AdminOverview`), fora do escopo desta task.

Consumidores fora desta feature devem importar de `@/features/admin`.
