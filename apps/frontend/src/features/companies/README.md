# Companies

Cadastro e gestão de empresas (companies), incluindo os endereços de cada empresa (`Address` pertence a `Company` 1:N no backend — sem rota própria, por isso `addresses` vive como subpasta aqui em vez de ser uma feature separada).

## Pontos de entrada (tudo via `@/features/companies`)

- `CompanyCard`, `CompanyForm`, `CompaniesBigStats` — UI de `app/[locale]/(authenticated)/companies/page.tsx`
- `CompanyAddresses`, `CompanyShareMenu` — usados internamente por `CompanyCard`/`EditCompanyModal`
- `AddressForm`, `EditAddressForm` — usados por `components/ui/address-combobox.tsx`
- `useCompanies`, `useCompany`, `useCreateCompany`, `useUpdateCompany`, `useDeleteCompany`, tipo `Company` (`companies.ts`) — consumidos por vários outros domínios (projects, invoices, work-hours, dashboard, analytics, topbar)
- `useCompanyStats`, `useCompanySpecificStats` (`company-stats.ts`)
- `useAddresses`, `useAddress`, `useCompanyAddresses`, `useCreateAddress`, `useUpdateAddress`, `useDeleteAddress`, `useSetPrimaryAddress`, tipo `Address` (`addresses.ts`)

Consumidores fora desta feature devem importar de `@/features/companies`, nunca de um caminho interno (`./components/*`, `./companies`, `./addresses`, `./company-stats`, `./types`).

## Notas de split

- `company-card.tsx` (originalmente 370 linhas) teve o menu de compartilhamento (copiar link, WhatsApp, email) extraído pra `company-share-menu.tsx` — era uma responsabilidade claramente separável do card em si.
- `address-form.tsx`/`edit-address-form.tsx` (402/359 linhas) tinham as constantes `ADDRESS_TYPES`/`BRAZILIAN_STATES` duplicadas byte-a-byte; extraídas pra `addresses/address-constants.ts`.

## Achados durante a migração (pré-existentes, fora de escopo corrigir aqui)

- `EditCompanyModal` não tem nenhum consumidor no app hoje (só o próprio teste) — órfão, exportado no barrel por completude mas não usado em nenhuma tela.
- `companies.ts` e `addresses.ts` definem seus próprios tipos `Company`/`Address` internamente (mais completos que os de `types.ts` — ex.: incluem `hourlyRate`, `currency`, `number`, `complement`). `types.ts` (consolidado de `types/client.ts` + `types/address.ts`) só é usado hoje pelos componentes internos desta feature; o barrel exporta os tipos de `companies.ts`/`addresses.ts` (os realmente consumidos fora da feature), não os de `types.ts`.
- `companies.ts` também define seu próprio `useCompanyStats(params)` (com filtro de data) e seu próprio `Address`, nenhum dos dois consumido em lugar nenhum — duplicatas mortas da versão de `company-stats.ts`/`addresses.ts` que é a realmente usada.
