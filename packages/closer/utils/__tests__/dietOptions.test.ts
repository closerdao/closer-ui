import { getCachedConfig } from '../cachedConfig.helpers';
import { DEFAULT_DIET_OPTIONS, getDietOptions, toSingleDiet } from '../dietOptions';

jest.mock('../cachedConfig.helpers', () => ({
  getCachedConfig: jest.fn(),
}));

const mockConfig = getCachedConfig as unknown as jest.Mock;

const configReturning = (configs: Record<string, unknown>) => (slug: string) =>
  configs[slug] ?? null;

describe('diet options', () => {
  beforeEach(() => jest.clearAllMocks());

  it('reads the list an admin set under Booking config', () => {
    mockConfig.mockImplementation(
      configReturning({ booking: { diet: 'Vegan, Halal , Other' } }),
    );

    expect(getDietOptions()).toEqual([
      { label: 'Vegan', value: 'Vegan' },
      { label: 'Halal', value: 'Halal' },
      { label: 'Other', value: 'Other' },
    ]);
  });

  it('falls back to a list left over under Volunteering config', () => {
    mockConfig.mockImplementation(
      configReturning({
        booking: { diet: '' },
        volunteering: { diet: 'Vegetarian, Vegan' },
      }),
    );

    expect(getDietOptions().map((option) => option.value)).toEqual([
      'Vegetarian',
      'Vegan',
    ]);
  });

  it('falls back to the defaults when neither config has a list', () => {
    mockConfig.mockImplementation(configReturning({}));

    expect(getDietOptions().map((option) => option.value)).toEqual(
      DEFAULT_DIET_OPTIONS,
    );
  });
});

describe('toSingleDiet', () => {
  it('takes the first entry of a profile saved by the old multi-select', () => {
    expect(toSingleDiet(['Vegan', 'Gluten-free'])).toBe('Vegan');
    expect(toSingleDiet('Vegan,Gluten-free')).toBe('Vegan');
  });

  it('passes a single value through and handles nothing saved', () => {
    expect(toSingleDiet('Halal')).toBe('Halal');
    expect(toSingleDiet(undefined)).toBe('');
    expect(toSingleDiet([])).toBe('');
  });
});
