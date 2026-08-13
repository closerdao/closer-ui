/**
 * #990 — no fallback timezone.
 *
 * getAppConfigFromEnv must never invent a timezone: when
 * NEXT_PUBLIC_DEFAULT_TIMEZONE is unset the key is omitted entirely, so a
 * spread of this object cannot clobber a timezone supplied by the app's own
 * config, and nothing downstream silently inherits Europe/Lisbon.
 */
import { getAppConfigFromEnv, resolveTimeZone } from '../appConfigFromEnv';

describe('getAppConfigFromEnv — DEFAULT_TIMEZONE', () => {
  const prev = process.env.NEXT_PUBLIC_DEFAULT_TIMEZONE;

  afterEach(() => {
    if (prev === undefined) {
      delete process.env.NEXT_PUBLIC_DEFAULT_TIMEZONE;
    } else {
      process.env.NEXT_PUBLIC_DEFAULT_TIMEZONE = prev;
    }
  });

  it('omits DEFAULT_TIMEZONE when the env var is unset', () => {
    delete process.env.NEXT_PUBLIC_DEFAULT_TIMEZONE;
    const config = getAppConfigFromEnv('someapp');
    expect('DEFAULT_TIMEZONE' in config).toBe(false);
  });

  it('omits DEFAULT_TIMEZONE when the env var is empty', () => {
    process.env.NEXT_PUBLIC_DEFAULT_TIMEZONE = '';
    const config = getAppConfigFromEnv('someapp');
    expect('DEFAULT_TIMEZONE' in config).toBe(false);
  });

  it('passes the env var through when set', () => {
    process.env.NEXT_PUBLIC_DEFAULT_TIMEZONE = 'America/Chicago';
    expect(getAppConfigFromEnv('someapp').DEFAULT_TIMEZONE).toBe(
      'America/Chicago',
    );
  });

  it('does not clobber a config-supplied timezone when spread last', () => {
    delete process.env.NEXT_PUBLIC_DEFAULT_TIMEZONE;
    const merged = {
      DEFAULT_TIMEZONE: 'Asia/Tokyo',
      ...getAppConfigFromEnv('someapp'),
    };
    expect(merged.DEFAULT_TIMEZONE).toBe('Asia/Tokyo');
  });
});

describe('resolveTimeZone', () => {
  const OLD = process.env.NEXT_PUBLIC_DEFAULT_TIMEZONE;
  afterEach(() => {
    if (OLD === undefined) delete process.env.NEXT_PUBLIC_DEFAULT_TIMEZONE;
    else process.env.NEXT_PUBLIC_DEFAULT_TIMEZONE = OLD;
  });

  it('prefers the village config over env and app fallback', () => {
    process.env.NEXT_PUBLIC_DEFAULT_TIMEZONE = 'Europe/Berlin';
    expect(
      resolveTimeZone({ TIME_ZONE: 'Atlantic/Azores' }, 'Europe/Lisbon'),
    ).toBe('Atlantic/Azores');
  });

  it('falls through empty config to the env var', () => {
    process.env.NEXT_PUBLIC_DEFAULT_TIMEZONE = 'Europe/Berlin';
    expect(resolveTimeZone({}, 'Europe/Lisbon')).toBe('Europe/Berlin');
  });

  it('uses the app-supplied literal only as last resort', () => {
    delete process.env.NEXT_PUBLIC_DEFAULT_TIMEZONE;
    expect(resolveTimeZone(null, 'Europe/Lisbon')).toBe('Europe/Lisbon');
  });

  it('returns undefined with no config, env, or app fallback — never invents one', () => {
    delete process.env.NEXT_PUBLIC_DEFAULT_TIMEZONE;
    expect(resolveTimeZone(undefined)).toBeUndefined();
    expect(resolveTimeZone({ TIME_ZONE: '' })).toBeUndefined();
  });
});
