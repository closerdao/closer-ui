export function normalizeDiscountCode(
  code: string | null | undefined,
): string {
  if (code == null) return '';
  return String(code).trim().toUpperCase();
}
