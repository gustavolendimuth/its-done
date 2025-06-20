import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Converte horas decimais para formato hh:mm
 * Exemplo: 1.5 -> "01:30", 8.25 -> "08:15"
 */
export function formatHoursToHHMM(hours: number): string {
  if (typeof hours !== "number" || isNaN(hours)) {
    return "00:00";
  }

  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;

  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}
