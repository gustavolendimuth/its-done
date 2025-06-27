// ===== ENTIDADES PRINCIPAIS =====

// Helper type para campos de data que podem vir como Date do Prisma ou string das APIs
export type DateField = string | Date;

export interface User {
  id: string;
  email: string;
  name: string;
  password: string;
  googleId?: string;
  role: "USER" | "ADMIN";
  createdAt: DateField;
  updatedAt: DateField;
  _count?: {
    clients?: number;
    projects?: number;
    workHours?: number;
  };
}

export interface Client {
  id: string;
  name?: string;
  email: string;
  phone?: string;
  company: string;
  userId: string;
  createdAt: DateField;
  updatedAt: DateField;
  user?: User;
  workHours?: WorkHour[];
  invoices?: Invoice[];
  addresses?: Address[];
  projects?: Project[];
  _count?: {
    workHours?: number;
    invoices?: number;
    projects?: number;
  };
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  clientId: string;
  userId: string;
  createdAt: DateField;
  updatedAt: DateField;
  client?: Client;
  user?: User;
  workHours?: WorkHour[];
  _count?: {
    workHours?: number;
  };
}

export interface WorkHour {
  id: string;
  date: string;
  description?: string;
  hours: number;
  userId: string;
  clientId: string;
  projectId?: string;
  createdAt: DateField;
  updatedAt: DateField;
  user?: User;
  client?: Client;
  project?: Project;
}

export interface Address {
  id: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  type: string;
  isPrimary: boolean;
  clientId: string;
  createdAt: DateField;
  updatedAt: DateField;
  client?: Client;
}

export interface Settings {
  id: string;
  userId: string;
  alertHours: number;
  notificationEmail?: string;
  createdAt: DateField;
  updatedAt: DateField;
  user?: User;
}

export interface Invoice {
  id: string;
  number?: string;
  clientId: string;
  fileUrl?: string;
  amount: number;
  status: "PENDING" | "PAID" | "CANCELED";
  description?: string;
  createdAt: DateField;
  updatedAt: DateField;
  client?: Client;
  invoiceWorkHours?: InvoiceWorkHour[];
}

export interface InvoiceWorkHour {
  id: string;
  invoiceId: string;
  workHourId: string;
  createdAt: DateField;
  invoice?: Invoice;
  workHour?: WorkHour;
}

export interface NotificationLog {
  id: string;
  userId: string;
  type: "HOURS_THRESHOLD" | "INVOICE_UPLOADED" | "WELCOME";
  threshold: number;
  totalHours: number;
  sentAt: DateField;
  user?: User;
}

export interface TimeEntry {
  id: string;
  date: string;
  description?: string;
  hours: number;
  clientId: string;
  projectId?: string;
  client?: {
    id: string;
    name?: string;
    company: string;
    email: string;
  };
  project?: {
    id: string;
    name: string;
    description?: string;
  };
  invoiceWorkHours?: {
    invoice: {
      id: string;
      status: string;
      number?: string;
      createdAt: string;
    };
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTimeEntryDto {
  date: string;
  description?: string;
  hours: number;
  clientId: string;
  projectId?: string;
}
