# Settings

Preferências do usuário: limite de alerta de horas (`alertHours`) e e-mail de notificação (`notificationEmail`).

## Pontos de entrada

- `SettingsForm` — formulário de edição das preferências, usado em `app/[locale]/(authenticated)/settings/page.tsx`
- `useSettings`, `useUpdateSettings` — hooks TanStack Query pra ler/atualizar as preferências

Consumidores fora desta feature devem importar de `@/features/settings`, nunca de um arquivo interno.
