export interface Client {
  id: string;
  name?: string;
  email: string;
  phone?: string;
  company: string;
  /** Fallback hourly rate used to bill WorkHours that have no Project. */
  hourlyRate?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClientDto {
  name?: string;
  email: string;
  phone?: string;
  company: string;
  hourlyRate?: number;
}

export interface UpdateClientDto {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  hourlyRate?: number;
}

export interface ClientSpecificStats {
  totalHours: number;
  totalValue: number;
  paidValue: number;
  pendingValue: number;
  canceledValue: number;
  totalInvoices: number;
}

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
