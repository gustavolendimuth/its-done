# Notifications

Sino de notificações no topbar e a lista de notificações do usuário (marcar como lida, excluir, contagem de não lidas).

## Pontos de entrada

- `NotificationBell` — ícone com badge de contagem, usado em `components/layout/topbar.tsx`
- `NotificationList` — lista renderizada dentro do `NotificationBell`
- `useNotifications`, `useUnreadNotifications`, `useUnreadNotificationCount`, `useCreateNotification`, `useUpdateNotification`, `useDeleteNotification`, `useMarkNotificationAsRead`, `useMarkAllNotificationsAsRead` — hooks TanStack Query

## Convenção

Único domínio que estava em PascalCase (`NotificationBell.tsx`/`NotificationList.tsx`); renomeado para kebab-case (`notification-bell.tsx`/`notification-list.tsx`) nesta migração, alinhando com o resto do projeto.

Consumidores fora desta feature devem importar de `@/features/notifications`.
