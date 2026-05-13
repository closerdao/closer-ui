import api from './api';

export type LogMetricInput = {
  event: string;
  value?: string;
  point?: number;
  category?: string;
  number?: number;
};

export async function logMetric(input: LogMetricInput): Promise<void> {
  const { event, value, category, number: numberField } = input;
  const point = input.point ?? 1;
  try {
    await api.post('/metric', {
      event,
      ...(value !== undefined ? { value } : {}),
      ...(point !== 1 ? { point } : {}),
      ...(category !== undefined ? { category } : {}),
      ...(numberField !== undefined ? { number: numberField } : {}),
    });
  } catch (error) {
    console.error(`Error tracking metric "${event}":`, error);
  }
}
