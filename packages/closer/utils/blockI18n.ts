import { sanitizeBlockHtml } from './sanitizeBlockHtml';

export const BLOCK_I18N_PREFIX = '_i18n_';

export type BlockI18nTranslate = (
  key: string,
  values?: Record<string, string | number | Date>,
) => string;

export type BlockI18nValues = Record<string, string | number | Date>;

const DEFAULT_BLOCK_I18N_VALUES: BlockI18nValues = {
  reserveToken: 'cEUR',
};

export function extractBlockI18nKey(
  value: string | undefined | null,
): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  if (!trimmed.startsWith(BLOCK_I18N_PREFIX)) return null;
  const key = trimmed.slice(BLOCK_I18N_PREFIX.length);
  if (!/^[A-Za-z0-9_]+$/.test(key)) return null;
  return key;
}

const resolveTranslation = (
  key: string,
  t: BlockI18nTranslate,
  values?: BlockI18nValues,
): string => {
  try {
    const resolved = t(key, { ...DEFAULT_BLOCK_I18N_VALUES, ...values });
    if (resolved == null || resolved === '') return key;
    return resolved;
  } catch {
    return key;
  }
};

export function resolveEditorI18nText(
  value: string | undefined | null,
  t: BlockI18nTranslate,
  values?: BlockI18nValues,
): string {
  if (value == null) return '';
  const wholeKey = extractBlockI18nKey(value);
  if (wholeKey != null) {
    return resolveTranslation(wholeKey, t, values);
  }
  if (!value.includes(BLOCK_I18N_PREFIX)) return value;
  return value.replace(/_i18n_([A-Za-z0-9_]+)/g, (_match, key: string) =>
    resolveTranslation(key, t, values),
  );
}

export function resolveBlockText(
  value: string | undefined | null,
  t: BlockI18nTranslate,
  values?: BlockI18nValues,
): string {
  return resolveEditorI18nText(value, t, values);
}

export function resolveBlockHtml(
  value: string | undefined | null,
  t: BlockI18nTranslate,
  values?: BlockI18nValues,
): string {
  return sanitizeBlockHtml(resolveEditorI18nText(value, t, values));
}

export function materializeI18nValue(
  value: unknown,
  t: BlockI18nTranslate,
  values?: BlockI18nValues,
): unknown {
  if (typeof value === 'string') {
    return resolveEditorI18nText(value, t, values);
  }
  if (Array.isArray(value)) {
    return value.map((item) => materializeI18nValue(item, t, values));
  }
  if (value != null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nested]) => [
        key,
        materializeI18nValue(nested, t, values),
      ]),
    );
  }
  return value;
}
