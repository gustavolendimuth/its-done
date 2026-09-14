/**
 * Rounds a decimal hours value to the nearest multiple of `incrementMinutes`.
 * `incrementMinutes <= 0` means rounding is off: the input is returned unchanged.
 * Ties round up (e.g. exactly half an increment rounds to the higher multiple),
 * matching `Math.round`'s behaviour.
 */
export function roundHoursToIncrement(
  hours: number,
  incrementMinutes: number,
): number {
  if (!incrementMinutes || incrementMinutes <= 0) {
    return hours;
  }

  const totalMinutes = hours * 60;
  const roundedMinutes =
    Math.round(totalMinutes / incrementMinutes) * incrementMinutes;

  return Math.round((roundedMinutes / 60) * 100) / 100;
}
