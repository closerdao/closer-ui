import snapshot from '../generated/appConfig.snapshot.json';
import { buildMergedConfig } from './config.utils';

export type ConfigSnapshotRow = {
  slug: string;
  value: Record<string, unknown>;
};

function rowValueToRecord(value: unknown): Record<string, unknown> {
  if (
    value != null &&
    typeof value === 'object' &&
    !Array.isArray(value)
  ) {
    return value as Record<string, unknown>;
  }
  return {};
}

export function keyedSnapshotToConfigRows(
  raw: Record<string, unknown>,
): ConfigSnapshotRow[] {
  const legacy = raw.results;
  if (Array.isArray(legacy)) {
    const rows: ConfigSnapshotRow[] = [];
    for (const item of legacy) {
      if (
        !item ||
        typeof item !== 'object' ||
        typeof (item as { slug?: string }).slug !== 'string'
      ) {
        continue;
      }
      const { slug, value } = item as { slug: string; value?: unknown };
      rows.push({ slug, value: rowValueToRecord(value) });
    }
    return rows;
  }

  return Object.entries(raw).map(([slug, value]) => ({
    slug,
    value: rowValueToRecord(value),
  }));
}

export function getBuildTimeKeyedConfig(): Record<
  string,
  Record<string, unknown>
> {
  return buildMergedConfig(
    keyedSnapshotToConfigRows(snapshot as Record<string, unknown>),
  );
}

export function getBuildTimeConfigValue(
  slug: string,
): Record<string, unknown> | null {
  const keyed = getBuildTimeKeyedConfig();
  const v = keyed[slug];
  if (v == null || typeof v !== 'object') return null;
  return v as Record<string, unknown>;
}
