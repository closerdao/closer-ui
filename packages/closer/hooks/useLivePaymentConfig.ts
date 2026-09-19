import { useEffect, useState } from 'react';

import { PaymentConfig } from '../types/api';
import api from '../utils/api';
import { getCachedConfig } from '../utils/cachedConfig.helpers';
import { getResolvedStripeConnectedAccountId } from '../utils/stripeConnect.helpers';

function connectGatingKey(config: PaymentConfig | null): string {
  if (!config) {
    return '';
  }
  return [
    getResolvedStripeConnectedAccountId(config) || '',
    String(Boolean(config.cardPayment)),
    config.connectStatus ?? '',
    String(config.webhookLive !== false),
  ].join('\0');
}

export function parseLivePaymentConfigValue(
  payload: unknown,
): PaymentConfig | null {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return null;
  }
  const results = (payload as { results?: unknown }).results;
  if (!results || typeof results !== 'object' || Array.isArray(results)) {
    return null;
  }
  const value = (results as { value?: unknown }).value;
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as PaymentConfig;
}

export function overlayLivePaymentConfig(
  snapshot: PaymentConfig | null,
  live: PaymentConfig | null,
): PaymentConfig | null {
  if (!live) {
    return snapshot;
  }
  if (!snapshot) {
    return live;
  }
  const merged = { ...snapshot, ...live };
  if (connectGatingKey(snapshot) === connectGatingKey(merged)) {
    return snapshot;
  }
  return merged;
}

export function useLivePaymentConfig(): PaymentConfig | null {
  const snapshot = (getCachedConfig('payment') ?? null) as PaymentConfig | null;
  const [live, setLive] = useState<PaymentConfig | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get('/config/payment', {
        cache: false,
      } as Parameters<typeof api.get>[1])
      .then((res) => {
        const parsed = parseLivePaymentConfigValue(res?.data);
        if (!cancelled && parsed) {
          setLive(parsed);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  return overlayLivePaymentConfig(snapshot, live);
}
