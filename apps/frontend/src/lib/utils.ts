import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Normaliza URLs do Railway adicionando https:// se necessário
 * @param url - URL que pode ou não ter protocolo
 * @returns URL completa com https://
 */
export function normalizeUrl(url: string | undefined): string {
  if (!url) return "";

  // Se já tem protocolo, retorna como está
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  // Se é localhost, adiciona http://
  if (url.includes("localhost") || url.includes("127.0.0.1")) {
    return `http://${url}`;
  }

  // Para URLs do Railway ou outros domínios, adiciona https://
  return `https://${url}`;
}

/**
 * Obtém a URL da API normalizada para uso no frontend
 */
export function getApiUrl(): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
  return normalizeUrl(apiUrl);
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
