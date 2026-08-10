export function financeApplicationIdFromCreateResponse(data: unknown): string {
  if (!data || typeof data !== 'object') {
    return '';
  }
  const body = data as Record<string, unknown>;
  const tryFrom = (value: unknown): string => {
    if (typeof value === 'string') {
      return value;
    }
    if (Array.isArray(value)) {
      const first = value[0];
      if (typeof first === 'string') {
        return first;
      }
      if (
        first &&
        typeof first === 'object' &&
        first !== null &&
        '_id' in first
      ) {
        const id = (first as { _id?: unknown })._id;
        return typeof id === 'string' ? id : '';
      }
      return '';
    }
    if (value && typeof value === 'object' && '_id' in value) {
      const id = (value as { _id?: unknown })._id;
      return typeof id === 'string' ? id : '';
    }
    return '';
  };

  const directId = body._id;
  if (typeof directId === 'string') {
    return directId;
  }

  const raw = body.results ?? body.result;
  const fromResults = tryFrom(raw);
  if (fromResults) {
    return fromResults;
  }
  if (raw && typeof raw === 'object' && raw !== null && 'value' in raw) {
    return tryFrom((raw as { value?: unknown }).value);
  }
  return '';
}
