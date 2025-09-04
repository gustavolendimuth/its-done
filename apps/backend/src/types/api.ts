// ===== TIPOS DE API E SERVIÇOS =====

export interface ApiError {
  message: string;
  status?: number;
  response?: {
    data?: {
      message: string;
    };
  };
}

export interface Activity {
  workHours: import('./entities').WorkHour[];
  invoices: import('./entities').Invoice[];
  newUsers: import('./entities').User[];
}

export interface AdminStats {
  totalUsers: number;
  totalClients: number;
  totalProjects: number;
  totalHours: number;
  totalInvoices: number;
  totalRevenue: number;
}

export interface DashboardStats {
  totalUsers: number;
  totalClients: number;
  totalProjects: number;
  totalHours: number;
  totalInvoices: number;
  totalRevenue: number;
}

export interface ReportFilters {
  startDate?: string;
  endDate?: string;
  clientId?: string;
  userId?: string;
}

export interface HoursReport {
  totalHours: number;
  billableHours: number;
  nonBillableHours: number;
  workHours: import('./entities').WorkHour[];
}

export interface InvoiceReport {
  totalInvoices: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  invoices: import('./entities').Invoice[];
}

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export interface UploadOptions {
  allowedTypes?: string[];
  maxSize?: number;
  folder?: string;
}

export interface UserResponse {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN';
  createdAt: import('./entities').DateField;
  updatedAt: import('./entities').DateField;
}
