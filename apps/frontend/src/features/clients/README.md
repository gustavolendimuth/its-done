# Clients

Cadastro e gestão de clientes, incluindo os endereços de cada cliente (`Address` pertence a `Client` 1:N no backend — sem rota própria, por isso `addresses` vive como subpasta aqui em vez de ser uma feature separada).

## Pontos de entrada

- `ClientCard`, `ClientForm`, `ClientsBigStats`, `EditClientModal`, `ClientAddresses`, `ClientShareMenu` — UI de `app/[locale]/(authenticated)/clients/**`
- `AddressForm`, `EditAddressForm` (`components/addresses/`) — usados por `components/ui/address-combobox.tsx`
- `useClients`, `useCreateClient`, `useUpdateClient` (`clients.ts`) — hooks TanStack Query pra `Client`, consumidos por vários outros domínios (projects, invoices, work-hours, dashboard, analytics, topbar) via `@/features/clients`
- `useClientStats`, `useClientSpecificStats` (`client-stats.ts`)
- `useClientAddresses`, `useCreateAddress`, `useUpdateAddress` (`addresses.ts`)
- Tipos `Client`, `CreateClientDto`, `UpdateClientDto`, `ClientSpecificStats`, `Address`, `CreateAddressDTO`, `UpdateAddressDTO` (`types.ts`)

Consumidores fora desta feature devem importar de `@/features/clients`, nunca de um arquivo interno.

## Notas

- `client-card.tsx` (originalmente 370 linhas) teve o menu de compartilhamento (copiar link, WhatsApp, email) extraído pra `client-share-menu.tsx` — era uma responsabilidade claramente separável do card em si.
- `address-form.tsx`/`edit-address-form.tsx` (402/359 linhas) tinham as constantes `ADDRESS_TYPES`/`BRAZILIAN_STATES` duplicadas byte-a-byte; extraídas pra `addresses/address-constants.ts`.
- `services/clients.ts` e `services/addresses.ts` definem seus próprios tipos `Client`/`Address` internamente (mais completos que os de `types.ts`, ex.: incluem `hourlyRate`, `currency`, `number`, `complement`) — inconsistência pré-existente entre esses e `types.ts`, fora do escopo deste refactor corrigir.
