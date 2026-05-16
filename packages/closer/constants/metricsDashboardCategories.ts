export const METRICS_DASHBOARD_CATEGORIES = [
  'booking',
  'wallet',
  'token',
  'signup',
  'login',
  'events',
  'blog',
  'affiliate',
  'dashboard',
  'setting',
  'co-housing',
  'fundraiser',
  'subscriptions',
  'citizenship',
] as const;

export type MetricsDashboardCategory =
  (typeof METRICS_DASHBOARD_CATEGORIES)[number];
