import { format, isValid } from 'date-fns';

/**
 * date-fns' `format` throws a RangeError on an invalid Date (e.g. a missing or
 * unparseable timestamp from the API) instead of returning a string — which crashes
 * the whole page when nothing catches it. Use this anywhere a value from the API is
 * formatted directly, instead of `format(new Date(value), ...)`.
 */
export function safeFormat(value: unknown, fmt: string, fallback = '—'): string {
  if (!value) return fallback;
  const d = new Date(value as string | number | Date);
  return isValid(d) ? format(d, fmt) : fallback;
}
