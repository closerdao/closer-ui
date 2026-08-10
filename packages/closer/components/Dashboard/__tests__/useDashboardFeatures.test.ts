import { fromJS } from 'immutable';

import { configRowsToKeyedConfig } from '../useDashboardFeatures';

describe('configRowsToKeyedConfig', () => {
  it('keys plain config rows by slug', () => {
    expect(
      configRowsToKeyedConfig([
        { slug: 'booking', value: { enabled: false } },
        { slug: 'events', value: { enabled: true } },
      ]),
    ).toEqual({
      booking: { enabled: false },
      events: { enabled: true },
    });
  });

  it('reads the Immutable list the platform store holds', () => {
    const rows = fromJS([{ slug: 'booking', value: { enabled: false } }]);

    expect(configRowsToKeyedConfig(rows)).toEqual({
      booking: { enabled: false },
    });
  });

  it('skips rows without a usable slug, and normalises odd values', () => {
    expect(
      configRowsToKeyedConfig([
        { slug: '', value: { enabled: true } },
        { value: { enabled: true } },
        null,
        { slug: 'booking', value: null },
        { slug: 'events', value: ['nope'] },
      ]),
    ).toEqual({ booking: {}, events: {} });
  });

  it('returns an empty map before the request lands', () => {
    expect(configRowsToKeyedConfig(undefined)).toEqual({});
    expect(configRowsToKeyedConfig(null)).toEqual({});
    expect(configRowsToKeyedConfig({ not: 'a list' })).toEqual({});
  });

  it('lets a live row switch a feature off against a stale snapshot', () => {
    // The build-time snapshot is fetched at deploy time and can disagree with
    // the API the app is talking to — live rows have to win.
    const snapshot = { booking: { enabled: true }, TIME_ZONE: 'Europe/Lisbon' };
    const live = configRowsToKeyedConfig([
      { slug: 'booking', value: { enabled: false } },
    ]);

    const merged = { ...snapshot, ...live };

    expect(merged.booking).toEqual({ enabled: false });
    expect(merged.TIME_ZONE).toBe('Europe/Lisbon');
  });
});
