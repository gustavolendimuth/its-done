export interface Address {
  id: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isPrimary: boolean;
  clientId: string;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateAddressDTO = Omit<Address, "id" | "createdAt" | "updatedAt">;
export type UpdateAddressDTO = Partial<CreateAddressDTO>;
