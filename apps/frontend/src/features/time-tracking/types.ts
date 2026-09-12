export interface WorkHour {
  id: string;
  date: string;
  description: string;
  hours: number;
  client?: {
    id: string;
    name: string;
    email: string;
    company?: string;
  };
  project?: {
    id: string;
    name: string;
  };
}

export interface InvoiceWorkHour {
  id: string;
  workHour: WorkHour;
}
