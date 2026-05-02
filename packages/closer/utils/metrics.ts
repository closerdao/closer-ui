import api from './api';

export type LogMetricInput = {
  event: string;
  value?: string;
  point?: number;
  category?: string;
  number?: number;
};

export async function logMetricIfAuthenticated(
  user: { _id?: string } | null | undefined,
  input: LogMetricInput,
): Promise<void> {
  if (!user?._id) {
    return;
  }
  await logMetric(input);
}

export async function logMetric(input: LogMetricInput): Promise<void> {
  const {
    event,
    value,
    point = 1,
    category = 'engagement',
    number: numberField,
  } = input;
  try {
    await api.post('/metric', {
      event,
      ...(value !== undefined ? { value } : {}),
      point,
      category,
      ...(numberField !== undefined ? { number: numberField } : {}),
    });
  } catch (error) {
    console.error(`Error tracking metric "${event}":`, error);
  }
}
