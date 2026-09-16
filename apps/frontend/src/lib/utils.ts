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
  // Helper to detect invalid or placeholder values (e.g., ${{Backend}})
  const isInvalid = (val: unknown): boolean => {
    if (typeof val !== "string") return true;
    const v = val.trim();
    if (!v || v === "undefined" || v === "null") return true;
    if (/\$\{\{.*\}\}/.test(v)) return true;
    return false;
  };

  // API_URL (server-only, e.g. Docker/Railway internal network) takes priority
  // when running server-side; it's never inlined into the browser bundle since
  // it lacks the NEXT_PUBLIC_ prefix, so client-side this is always undefined.
  let chosen = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL;
  if (isInvalid(chosen)) chosen = "https://backend-its-done.up.railway.app";

  // Ensure we always target the backend API prefix (/api)
  const ensureApiPrefix = (url: string): string => {
    const cleaned = url.replace(/\/$/, "");
    if (/\/api$/i.test(cleaned)) return cleaned;
    return `${cleaned}/api`;
  };

  const normalized = ensureApiPrefix(normalizeUrl(chosen));

  console.log("🌐 API URL Configuration:", {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    normalizedApiUrl: normalized,
  });

  return normalized;
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

/**
 * Resolves the hourly rate to bill a WorkHour/TimeEntry at: the Project's
 * rate takes precedence when present, falling back to the Client's default
 * rate, and finally to 0 when neither is set. Mirrors the backend's
 * resolveHourlyRate (apps/backend/src/work-hours/utils/resolve-hourly-rate.util.ts).
 */
export function resolveHourlyRate(
  project?: { hourlyRate?: number | null } | null,
  client?: { hourlyRate?: number | null } | null
): number {
  return project?.hourlyRate ?? client?.hourlyRate ?? 0;
}

/**
 * Formata tempo relativo usando o sistema de traduções do projeto
 * @param date - Data para calcular o tempo relativo
 * @param t - Função de tradução
 * @returns String formatada do tempo relativo
 */
export function formatTimeAgo(
  date: Date,
  t: (key: string, values?: Record<string, string | number>) => string
): string {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  
  type TimeUnit = "minute" | "hour" | "day" | "week" | "month" | "year";

  const UNIT_MINUTES: {key: TimeUnit, minutes: number}[] = [
    { key: "year", minutes: 525600 },
    { key: "month", minutes: 43200 },
    { key: "week", minutes: 10080 },
    { key: "day", minutes: 1440 },
    { key: "hour", minutes: 60 },
    { key: "minute", minutes: 1 },
  ];

  for (const unit of UNIT_MINUTES) {
    const count = Math.floor(diffInMinutes / unit.minutes);
    if (count >= 1) {
      return t(`timeAgo.${unit.key}${count > 1 ? "s" : ""}`, { count });
    }
  }
  return t("timeAgo.justNow");
}
