export { ClientCard } from "./components/client-card";
export { ClientForm } from "./components/client-form";
export { ClientsBigStats } from "./components/clients-big-stats";
export { EditClientModal } from "./components/edit-client-modal";
export { ClientAddresses } from "./components/client-addresses";
export { ClientShareMenu } from "./components/client-share-menu";
export { ClientsPageSkeleton } from "./components/clients-page-skeleton";
export { AddressForm } from "./components/addresses/address-form";
export { EditAddressForm } from "./components/addresses/edit-address-form";

export {
  useClients,
  useClient,
  useCreateClient,
  useUpdateClient,
  useDeleteClient,
  type Client,
  type CreateClientDto,
  type UpdateClientDto,
} from "./clients";
export {
  useClientStats,
  useClientSpecificStats,
  type ClientStats,
} from "./client-stats";
export {
  useAddresses,
  useAddress,
  useClientAddresses,
  useCreateAddress,
  useUpdateAddress,
  useDeleteAddress,
  useSetPrimaryAddress,
  type Address,
  type CreateAddressDto,
  type UpdateAddressDto,
} from "./addresses";
