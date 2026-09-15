export const firstQueryValue = (
  value: string | string[] | undefined,
): string | undefined => {
  if (typeof value === 'string') {
    return value;
  }
  if (Array.isArray(value)) {
    return value[0];
  }
  return undefined;
};

export const STRIPE_CONNECT_RETURN_TO_ALLOWED_PATHS = [
  '/admin/config',
  '/village/onboarding',
] as const;

export type StripeConnectQueryStatus = 'pending' | 'success' | 'failed';

export const resolveStripeConnectReturnTo = (
  raw: string | null | undefined,
): string => {
  if (!raw || typeof raw !== 'string') {
    return '/admin/config';
  }
  const trimmed = raw.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.includes('://')) {
    return '/admin/config';
  }
  try {
    const parsed = new URL(trimmed, 'https://example.invalid');
    if (parsed.origin !== 'https://example.invalid') {
      return '/admin/config';
    }
    if (
      !STRIPE_CONNECT_RETURN_TO_ALLOWED_PATHS.includes(
        parsed.pathname as (typeof STRIPE_CONNECT_RETURN_TO_ALLOWED_PATHS)[number],
      )
    ) {
      return '/admin/config';
    }
    return parsed.pathname;
  } catch {
    return '/admin/config';
  }
};

export const withStripeConnectQuery = (
  returnTo: string,
  status: StripeConnectQueryStatus,
): string => {
  const params = new URLSearchParams();
  if (returnTo === '/admin/config') {
    params.set('config', 'payment');
  }
  params.set('stripeConnect', status);
  return `${returnTo}?${params.toString()}`;
};

export const stripeConnectQueryFromConnectStatus = (
  connectStatus?: string,
): StripeConnectQueryStatus => {
  if (connectStatus === 'active') {
    return 'success';
  }
  return 'pending';
};
