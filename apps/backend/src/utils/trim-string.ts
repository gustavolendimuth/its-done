import { Transform } from 'class-transformer';

/**
 * Trims leading/trailing whitespace from string values so validators (and the
 * stored value) see the trimmed text. Non-string values (undefined, null,
 * numbers) pass through untouched and are left for the validators to reject.
 * Needs the global ValidationPipe `transform: true`.
 */
export function TrimString(): PropertyDecorator {
  return Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  );
}
