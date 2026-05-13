import type { LinkedMetricObjectType } from '../types/metrics';

import api from './api';

export type LogMetricInput = {
  event: string;
  value?: string;
  point?: number;
  category?: string;
  number?: number;
  linkedObjectType?: LinkedMetricObjectType;
  linkedObjectId?: string;
};

export function linkedMetricFields(
  linkedObjectType: LinkedMetricObjectType,
  linkedObjectId: string | number | undefined | null,
): Partial<Pick<LogMetricInput, 'linkedObjectType' | 'linkedObjectId'>> {
  if (
    linkedObjectId === undefined ||
    linkedObjectId === null ||
    linkedObjectId === ''
  ) {
    return {};
  }
  return { linkedObjectType, linkedObjectId: String(linkedObjectId) };
}

export async function logMetric(input: LogMetricInput): Promise<void> {
  const {
    event,
    value,
    category,
    number: numberField,
    linkedObjectType,
    linkedObjectId,
  } = input;
  const point = input.point ?? 1;
  try {
    await api.post('/metric', {
      event,
      ...(value !== undefined ? { value } : {}),
      ...(point !== 1 ? { point } : {}),
      ...(category !== undefined ? { category } : {}),
      ...(numberField !== undefined ? { number: numberField } : {}),
      ...(linkedObjectType !== undefined && linkedObjectId !== undefined
        ? { linkedObjectType, linkedObjectId }
        : {}),
    });
  } catch (error: unknown) {
    const err = error as {
      response?: { status?: number; headers?: { 'retry-after'?: string } };
    };
    if (err?.response?.status === 429) {
      const ra = err.response.headers?.['retry-after'];
      console.warn(
        `Metric rate limited (429) for "${event}".`,
        ra !== undefined ? `Retry-After: ${ra}` : '',
      );
      return;
    }
    console.error(`Error tracking metric "${event}":`, error);
  }
}
