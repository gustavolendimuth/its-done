import { format } from "date-fns";

export interface WorkHourRow {
  id: string;
  date: string | Date;
  description?: string;
  hours: number;
  startTime?: string | null;
  endTime?: string | null;
  client?: {
    id: string;
    name?: string;
    company: string;
    email: string;
  };
  project?: {
    id: string;
    name: string;
  };
  task?: {
    id: string;
    title: string;
    link?: string | null;
  };
  createdAt: string | Date;
  invoiceWorkHours?: {
    invoice: {
      id: string;
      status: string;
    };
  }[];
}

export function isWorkHourInvoiced(row: WorkHourRow): boolean {
  return (row.invoiceWorkHours ?? []).some(
    (invoiceWorkHour) => invoiceWorkHour.invoice.status !== "CANCELED"
  );
}

export interface WeekGroup {
  key: string;
  start: Date;
  end: Date;
  entries: WorkHourRow[];
  totalHours: number;
}

export interface MonthGroup {
  key: string;
  date: Date;
  weeks: WeekGroup[];
  totalHours: number;
}

export function groupByMonthAndWeek(entries: WorkHourRow[]): MonthGroup[] {
  const sorted = [...entries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const months: MonthGroup[] = [];

  for (const entry of sorted) {
    const date = new Date(entry.date);
    const monthKey = format(date, "yyyy-MM");
    const weekKey = format(date, "RRRR-'W'II");

    let month = months[months.length - 1];

    if (!month || month.key !== monthKey) {
      month = { key: monthKey, date, weeks: [], totalHours: 0 };
      months.push(month);
    }

    let week = month.weeks[month.weeks.length - 1];

    if (!week || week.key !== weekKey) {
      week = { key: weekKey, start: date, end: date, entries: [], totalHours: 0 };
      month.weeks.push(week);
    }

    week.entries.push(entry);
    week.totalHours += entry.hours;
    week.start = date < week.start ? date : week.start;
    week.end = date > week.end ? date : week.end;
    month.totalHours += entry.hours;
  }

  return months;
}
