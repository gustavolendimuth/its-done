export interface Company {
  id: string;
  /** Nullable column: the API sends `null`, not an omitted key, when unset. */
  name?: string | null;
  email: string;
  /** Nullable column: the API sends `null`, not an omitted key, when unset. */
  phone?: string | null;
  company: string;
  /** Fallback hourly rate used to bill WorkHours that have no Project. */
  hourlyRate?: number | null;
  /** True when the Company has at least one active CompanyAdmin (MW-25). */
  hasActiveAdmin?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCompanyDto {
  name?: string;
  email: string;
  phone?: string;
  company: string;
  hourlyRate?: number;
}

export interface UpdateCompanyDto {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  hourlyRate?: number;
}

export interface CompanySpecificStats {
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
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateAddressDTO = Omit<Address, "id" | "createdAt" | "updatedAt">;
export type UpdateAddressDTO = Partial<CreateAddressDTO>;
