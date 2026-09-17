/**
 * The code as a string, whatever shape it arrives in.
 *
 * A stay or a ticket comes back carrying the whole matched discount rather
 * than the code that was sent to it, and stringifying that object renders
 * "[object Object]" where the guest expects their code.
 */
export function normalizeDiscountCode(
  code: string | { code?: string | null } | null | undefined,
): string {
  if (code == null) return '';
  if (typeof code === 'object') {
    return typeof code.code === 'string' ? code.code.trim().toUpperCase() : '';
  }
  return String(code).trim().toUpperCase();
}
