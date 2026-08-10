export interface ParsedSubscriptionPerk {
  title: string;
  description?: string;
}

export const parseSubscriptionPerks = (
  perksValue?: string,
): ParsedSubscriptionPerk[] => {
  const normalized = (perksValue || '').replace(/\r\n/g, '\n').trim();

  if (!normalized) {
    return [];
  }

  if (normalized.includes('\n\n')) {
    return normalized
      .split(/\n{2,}/)
      .map((block) => block.trim())
      .filter(Boolean)
      .map((block) => {
        const lines = block
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean);

        return {
          title: lines[0] || '',
          description: lines.slice(1).join(' '),
        };
      })
      .filter((perk) => perk.title);
  }

  if (normalized.includes(',')) {
    return normalized
      .split(',')
      .map((perk) => perk.trim())
      .filter(Boolean)
      .map((title) => ({ title }));
  }

  return normalized
    .split('\n')
    .map((perk) => perk.trim())
    .filter(Boolean)
    .map((title) => ({ title }));
};
