/**
 * Resolves the hourly rate to bill a WorkHour at: the Project's rate takes
 * precedence when present, falling back to the Company's default rate, and
 * finally to 0 when neither is set.
 */
export function resolveHourlyRate(
  project?: { hourlyRate?: number | null } | null,
  company?: { hourlyRate?: number | null } | null,
): number {
  return project?.hourlyRate ?? company?.hourlyRate ?? 0;
}
