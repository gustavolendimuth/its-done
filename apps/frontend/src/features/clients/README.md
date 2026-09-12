# Clients

Cadastro e gestão de clientes, incluindo os endereços de cada cliente (`Address` pertence a `Client` 1:N no backend — sem rota própria, por isso `addresses` vive como subpasta aqui em vez de ser uma feature separada).

## Pontos de entrada (tudo via `@/features/clients`)

- `ClientCard`, `ClientForm`, `ClientsBigStats` — UI de `app/[locale]/(authenticated)/clients/page.tsx`
- `ClientAddresses`, `ClientShareMenu` — usados internamente por `ClientCard`/`EditClientModal`
- `AddressForm`, `EditAddressForm` — usados por `components/ui/address-combobox.tsx`
- `useClients`, `useClient`, `useCreateClient`, `useUpdateClient`, `useDeleteClient`, tipo `Client` (`clients.ts`) — consumidos por vários outros domínios (projects, invoices, work-hours, dashboard, analytics, topbar)
- `useClientStats`, `useClientSpecificStats` (`client-stats.ts`)
- `useAddresses`, `useAddress`, `useClientAddresses`, `useCreateAddress`, `useUpdateAddress`, `useDeleteAddress`, `useSetPrimaryAddress`, tipo `Address` (`addresses.ts`)

Consumidores fora desta feature devem importar de `@/features/clients`, nunca de um caminho interno (`./components/*`, `./clients`, `./addresses`, `./client-stats`, `./types`).

## Notas de split

- `client-card.tsx` (originalmente 370 linhas) teve o menu de compartilhamento (copiar link, WhatsApp, email) extraído pra `client-share-menu.tsx` — era uma responsabilidade claramente separável do card em si.
- `address-form.tsx`/`edit-address-form.tsx` (402/359 linhas) tinham as constantes `ADDRESS_TYPES`/`BRAZILIAN_STATES` duplicadas byte-a-byte; extraídas pra `addresses/address-constants.ts`.

## Achados durante a migração (pré-existentes, fora de escopo corrigir aqui)

- `EditClientModal` não tem nenhum consumidor no app hoje (só o próprio teste) — órfão, exportado no barrel por completude mas não usado em nenhuma tela.
- `clients.ts` e `addresses.ts` definem seus próprios tipos `Client`/`Address` internamente (mais completos que os de `types.ts` — ex.: incluem `hourlyRate`, `currency`, `number`, `complement`). `types.ts` (consolidado de `types/client.ts` + `types/address.ts`) só é usado hoje pelos componentes internos desta feature; o barrel exporta os tipos de `clients.ts`/`addresses.ts` (os realmente consumidos fora da feature), não os de `types.ts`.
- `clients.ts` também define seu próprio `useClientStats(params)` (com filtro de data) e seu próprio `Address`, nenhum dos dois consumido em lugar nenhum — duplicatas mortas da versão de `client-stats.ts`/`addresses.ts` que é a realmente usada.
