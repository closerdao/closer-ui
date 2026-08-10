import { useEffect, useMemo } from 'react';

import { usePlatform } from '../../contexts/platform';
import { useConfig } from '../../hooks/useConfig';
import {
  DashboardFeatures,
  resolveDashboardFeatures,
} from './dashboardFeatures';

/**
 * `useConfig()` is backed by `generated/appConfig.snapshot.json`, which is
 * fetched from the API at build time. That is fine for public pages, but on the
 * dashboard it means an admin who switches a feature off in
 * /dashboard/admin/config keeps seeing its blocks until the app is rebuilt —
 * and in local development the committed snapshot can disagree with the API the
 * dev server is actually talking to.
 *
 * So the dashboard reads the live config rows and layers them over the
 * snapshot, falling back to the snapshot until the request lands.
 */
export const configRowsToKeyedConfig = (
  rows: unknown,
): Record<string, Record<string, unknown>> => {
  if (!rows) return {};
  const list =
    typeof (rows as { toJS?: () => unknown }).toJS === 'function'
      ? (rows as { toJS: () => unknown }).toJS()
      : rows;
  if (!Array.isArray(list)) return {};

  const keyed: Record<string, Record<string, unknown>> = {};
  for (const row of list) {
    const slug = (row as { slug?: unknown })?.slug;
    if (typeof slug !== 'string' || !slug) continue;
    const value = (row as { value?: unknown }).value;
    keyed[slug] =
      value != null && typeof value === 'object' && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : {};
  }
  return keyed;
};

export interface DashboardConfigState {
  features: DashboardFeatures;
  /** Snapshot config with any live config rows layered on top. */
  config: any;
}

export const useDashboardFeatures = (): DashboardConfigState => {
  const snapshotConfig = useConfig();
  const { platform }: any = usePlatform();

  useEffect(() => {
    // Cached by the platform store, so this is one request per dashboard visit.
    Promise.resolve(platform?.config?.get?.()).catch(() => undefined);
  }, []);

  const liveRows = platform?.config?.find?.();

  return useMemo(() => {
    const config = { ...snapshotConfig, ...configRowsToKeyedConfig(liveRows) };
    return { features: resolveDashboardFeatures(config), config };
  }, [snapshotConfig, liveRows]);
};
