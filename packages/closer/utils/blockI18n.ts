export const BLOCK_I18N_PREFIX = '_i18n_';

export function extractBlockI18nKey(
  value: string | undefined | null,
): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  if (!trimmed.startsWith(BLOCK_I18N_PREFIX)) return null;
  const key = trimmed.slice(BLOCK_I18N_PREFIX.length).trim();
  return key.length > 0 ? key : null;
}

export function resolveBlockText(
  value: string | undefined | null,
  t: (key: string) => string,
): string {
  if (value == null) return '';
  const key = extractBlockI18nKey(value);
  if (key == null) return value;
  return t(key);
}

export function resolveBlockHtml(
  value: string | undefined | null,
  t: (key: string) => string,
): string {
  if (value == null) return '';
  const key = extractBlockI18nKey(value);
  if (key == null) return value;
  return t(key);
}
