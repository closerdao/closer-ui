/**
 * #946 — a new village must not inherit TDF's identity from schema defaults.
 *
 * Walks every slug's every field in `configDescription`, collects every
 * `.default` (recursing into arrays and objects, so list defaults like the
 * fundraiser packages are covered), and asserts the collected values contain
 * no village-specific identity: brand names, live Stripe price ids, analytics
 * ids, personal emails, Google Docs/Sheets links.
 *
 * Policy defaults (enabled flags, VAT rate, percentages, durations) are
 * deliberately allowed — they are behavior, not branding.
 */
import { configDescription } from '../config';
import {
  getDefaultConfigValue,
  synthesizeTypeZeroDefault,
} from '../utils/config.utils';

const BRAND_PATTERN =
  /tdf|traditional\s*dream|closer\.earth|oasa|treehousedao|moos|per-auset|earthbound|abela|price_[A-Za-z0-9]{20,}|G-[A-Z0-9]{6,}|@gmail\.com|docs\.google\.com|substack\.com/i;

/** Values that trip the pattern but are not brand identity. Keep empty unless
 * a false positive genuinely appears. */
const ALLOW_LIST: string[] = [];

const collectDefaults = (
  node: unknown,
  path: string,
  out: Array<{ path: string; value: unknown }>,
): void => {
  if (node === null || node === undefined) return;
  if (Array.isArray(node)) {
    node.forEach((el, i) => collectDefaults(el, `${path}[${i}]`, out));
    return;
  }
  if (typeof node === 'object') {
    Object.entries(node as Record<string, unknown>).forEach(([key, value]) => {
      if (key === 'default') {
        out.push({ path: `${path}.default`, value });
      }
      collectDefaults(value, `${path}.${key}`, out);
    });
    return;
  }
};

describe('configDescription schema defaults', () => {
  const collected: Array<{ path: string; value: unknown }> = [];
  configDescription.forEach((desc) =>
    collectDefaults(desc.value, desc.slug, collected),
  );

  it('collects defaults from the schema (sanity check on the walker)', () => {
    expect(collected.length).toBeGreaterThan(50);
  });

  it.each(collected.map((c) => [c.path, c.value] as const))(
    'default at %s carries no village identity',
    (path, value) => {
      const serialized = JSON.stringify(value) ?? '';
      const withoutAllowed = ALLOW_LIST.reduce(
        (acc, allowed) => acc.split(allowed).join(''),
        serialized,
      );
      expect(withoutAllowed).not.toMatch(BRAND_PATTERN);
    },
  );

  it('fundraiser has no default milestones or packages', () => {
    const fundraiser = getDefaultConfigValue('fundraiser', configDescription);
    expect(fundraiser.milestones).toEqual([]);
    expect(fundraiser.packages).toEqual([]);
  });

  it('general identity fields resolve to neutral empty values', () => {
    const general = getDefaultConfigValue('general', configDescription);
    [
      'appName',
      'platformName',
      'semanticUrl',
      'platformLegalAddress',
      'legalEntityName',
      'legalStreetAddress',
      'legalPostalCode',
      'legalCity',
      'legalCountry',
      'country',
      'teamEmail',
      'instagramUrl',
      'facebookUrl',
      'twitterUrl',
      'locationLat',
      'locationLon',
      'visitorsGuide',
      'faqsGoogleSheetId',
      'expenseCategories',
    ].forEach((key) => {
      expect(general[key]).toBe('');
    });
  });

  it('token bookingToken resolves to a neutral empty value', () => {
    // bookingToken moved from the removed `web3` section to `token` on develop;
    // it must stay default-free so no village inherits another's token symbol.
    const token = getDefaultConfigValue('token', configDescription);
    expect(token.bookingToken).toBe('');
  });

  it('policy defaults are preserved (not zeroed)', () => {
    const payment = getDefaultConfigValue('payment', configDescription);
    expect(payment.vatRate).toBe(0.23);
    const general = getDefaultConfigValue('general', configDescription);
    expect(general.enabled).toBe(true);
    expect(general.minVouchingStayDuration).toBe(14);
    const booking = getDefaultConfigValue('booking', configDescription);
    expect(booking.discountsWeekly).toBe(0.3);
  });

  it('getDefaultConfigValue never yields undefined for a described field', () => {
    configDescription.forEach((desc) => {
      const defaults = getDefaultConfigValue(desc.slug, configDescription);
      Object.entries(defaults).forEach(([, value]) => {
        expect(value).not.toBeUndefined();
      });
    });
  });
});

describe('synthesizeTypeZeroDefault', () => {
  it('maps each declared type to its neutral zero', () => {
    expect(synthesizeTypeZeroDefault('text')).toBe('');
    expect(synthesizeTypeZeroDefault('select')).toBe('');
    expect(synthesizeTypeZeroDefault('image')).toBe('');
    expect(synthesizeTypeZeroDefault('number')).toBe(0);
    expect(synthesizeTypeZeroDefault('boolean')).toBe(false);
    expect(synthesizeTypeZeroDefault('vat-by-product-type')).toEqual({});
    expect(synthesizeTypeZeroDefault('multiselect')).toEqual([]);
    expect(synthesizeTypeZeroDefault([{ title: 'text' }])).toEqual([]);
  });
});
