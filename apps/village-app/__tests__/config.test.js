import { humanizeVillageSlug } from '../config';

describe('humanizeVillageSlug', () => {
  it('turns a provisioning slug into a display name', () => {
    expect(humanizeVillageSlug('sunset-valley')).toBe('Sunset Valley');
  });

  it('handles underscores and extra whitespace', () => {
    expect(humanizeVillageSlug('  green_hill_commons ')).toBe(
      'Green Hill Commons',
    );
  });

  it('handles a single-word slug', () => {
    expect(humanizeVillageSlug('demo')).toBe('Demo');
  });

  it('returns an empty string for empty input', () => {
    expect(humanizeVillageSlug('')).toBe('');
    expect(humanizeVillageSlug(undefined)).toBe('');
    expect(humanizeVillageSlug(null)).toBe('');
  });
});
