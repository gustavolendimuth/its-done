# Projects

Projetos de um cliente, cada um com `hourlyRate` usado no cálculo de invoices.

## Pontos de entrada

- `ProjectCard`, `ProjectCreateDialog`, `ProjectEditDialog`, `ProjectsBigStats` — UI da tela `app/[locale]/(authenticated)/projects/page.tsx`
- `useProjects`, `useProject`, `useCreateProject`, `useUpdateProject`, `useDeleteProject` — hooks TanStack Query
- Tipos `Project`, `CreateProjectData`, `UpdateProjectData`

Consumidores fora desta feature (ex.: `components/ui/project-combobox.tsx`) devem importar de `@/features/projects`, nunca de um arquivo interno.
