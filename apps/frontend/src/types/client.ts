export interface Client {
  id: string;
  name?: string;
  email: string;
  phone?: string;
  company: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClientDto {
  name?: string;
  email: string;
  phone?: string;
  company: string;
}

export interface UpdateClientDto {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
}

export interface ClientSpecificStats {
  totalHours: number;
  totalValue: number;
  paidValue: number;
  pendingValue: number;
  canceledValue: number;
  totalInvoices: number;
}
