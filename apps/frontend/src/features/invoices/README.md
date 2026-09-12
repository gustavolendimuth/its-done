# Invoices

Geração e gestão de invoices a partir de `WorkHour`s (ver `AD` sobre cálculo: `total = Σ(workHour.hours × workHour.project.hourlyRate)`). Maior domínio do frontend em número de arquivos (11 componentes originais).

## Pontos de entrada (tudo via `@/features/invoices`)

- `InvoiceCard`, `ClientInvoiceCard`, `InvoicesBigStats` — UI de `app/[locale]/(authenticated)/invoices/page.tsx` e `features/dashboard/overview.tsx`
- `InvoiceSearchFilters`, `useInvoiceFilters` (+ tipos `SortBy`, `FilterStatus`, `InvoiceFilters`) — busca/filtro/ordenação reutilizados entre a página de invoices e o overview do dashboard
- `CreateInvoiceForm`, `EditInvoiceForm`, `InvoiceUploadModal`, `InvoiceUploadForm`, `InvoiceFileUpload` — formulários e upload de arquivo
- `WorkHoursSelector`, `WorkHoursSelectionSummary` — seleção de `WorkHour`s pra compor uma invoice, consomem `@/features/time-tracking`
- `useInvoices`, `useInvoice`, `useCreateInvoice`, `useUpdateInvoice`, `useDeleteInvoice`, `useUploadInvoiceFile`, `useClientInvoices`, `useDownloadInvoice`, `invoicesService`, tipo `Invoice` (`invoices.ts`)
- `useInvoiceStats`, tipo `InvoiceStats` (`invoice-stats.ts`)

Consumidores fora desta feature devem importar de `@/features/invoices`, nunca de um caminho interno (`./components/*`, `./invoices`, `./invoice-stats`, `./types`).

## Notas de split

- `invoice-file-upload.tsx` (425 linhas) foi avaliado e **mantido sem split**: é um único widget coeso de upload drag-and-drop com dois modos de render (`compact`/full) que compartilham os mesmos handlers — não é multi-responsabilidade, é um componente com bastante JSX. Dividir aumentaria a indireção sem reduzir complexidade real.
- Os demais arquivos grandes (`create-invoice-form.tsx`, `edit-invoice-form.tsx`) não foram divididos — são formulários coesos (um formulário, várias seções do mesmo formulário), consistente com o critério do `design.md` de só dividir quando há responsabilidades genuinamente separáveis.
