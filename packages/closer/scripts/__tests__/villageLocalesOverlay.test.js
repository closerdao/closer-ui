/**
 * Village locale bundles: base languages + village-owned config overlay.
 *
 * The village bundle is built for every base locale, with base-en underlaid
 * beneath partial translations, and a village's own `locales` config bucket
 * (fetched into generated/appConfig.snapshot.json at build) merged on top.
 * An absent bucket must produce exactly today's pure-base bundle, and a
 * malformed bucket must warn and be skipped — never fail the build.
 */
const fs = require('fs');
const path = require('path');

const {
  APP_LOCALES,
  BASE_LOCALES,
  listBaseLocales,
  mergeMessages,
  readVillageLocalesOverlay,
} = require('../syncBuildLocales.cjs');
const { resolveVillageI18n } = require('../villageI18n.cjs');

const LOCALES_ROOT = path.join(__dirname, '..', '..', 'locales');

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));

const silentLog = () => ({ warn: jest.fn() });

describe('listBaseLocales', () => {
  it('finds every base-<locale>.json with en first', () => {
    expect(BASE_LOCALES[0]).toBe('en');
    expect(BASE_LOCALES).toEqual(
      expect.arrayContaining(['en', 'pt', 'pl']),
    );
    expect(new Set(BASE_LOCALES).size).toBe(BASE_LOCALES.length);
  });

  it('builds the village bundle for every base locale', () => {
    expect(APP_LOCALES.village).toEqual(BASE_LOCALES);
  });

  it('is derived from the locales directory', () => {
    expect(listBaseLocales(LOCALES_ROOT)).toEqual(BASE_LOCALES);
  });
});

describe('readVillageLocalesOverlay', () => {
  it('returns an empty overlay when the bucket is absent', () => {
    const log = silentLog();
    expect(readVillageLocalesOverlay({}, log)).toEqual({});
    expect(readVillageLocalesOverlay({ general: {} }, log)).toEqual({});
    expect(readVillageLocalesOverlay(null, log)).toEqual({});
    expect(readVillageLocalesOverlay(undefined, log)).toEqual({});
    expect(log.warn).not.toHaveBeenCalled();
  });

  it('extracts per-locale messages from a well-formed bucket', () => {
    const log = silentLog();
    const overlay = readVillageLocalesOverlay(
      {
        locales: {
          en: { stay_title: 'Book a bed in our forest' },
          pt: { stay_title: 'Reserve uma cama' },
        },
      },
      log,
    );
    expect(overlay).toEqual({
      en: { stay_title: 'Book a bed in our forest' },
      pt: { stay_title: 'Reserve uma cama' },
    });
    expect(log.warn).not.toHaveBeenCalled();
  });

  it('warns and skips a malformed bucket without throwing', () => {
    for (const bad of ['nope', 42, ['en'], true]) {
      const log = silentLog();
      expect(readVillageLocalesOverlay({ locales: bad }, log)).toEqual({});
      expect(log.warn).toHaveBeenCalledTimes(1);
    }
  });

  it('warns and skips a malformed locale entry, keeping valid ones', () => {
    const log = silentLog();
    const overlay = readVillageLocalesOverlay(
      { locales: { en: { a: 'A' }, pt: ['not', 'messages'] } },
      log,
    );
    expect(overlay).toEqual({ en: { a: 'A' } });
    expect(log.warn).toHaveBeenCalledTimes(1);
  });

  it('warns and skips non-string message values, keeping string ones', () => {
    const log = silentLog();
    const overlay = readVillageLocalesOverlay(
      { locales: { en: { good: 'kept', bad: { nested: true }, n: 3 } } },
      log,
    );
    expect(overlay).toEqual({ en: { good: 'kept' } });
    expect(log.warn).toHaveBeenCalledTimes(2);
  });
});

describe('mergeMessages for the village bundle', () => {
  it('absent overlay: en bundle is exactly base-en (identical to today)', () => {
    const baseEn = readJson(path.join(LOCALES_ROOT, 'base-en.json'));
    expect(mergeMessages('village', 'en')).toEqual(baseEn);
    expect(mergeMessages('village', 'en', {})).toEqual(baseEn);
  });

  it('non-en bundles underlay base-en so no key is ever missing', () => {
    const baseEn = readJson(path.join(LOCALES_ROOT, 'base-en.json'));
    for (const locale of BASE_LOCALES.filter((l) => l !== 'en')) {
      const merged = mergeMessages('village', locale);
      const missing = Object.keys(baseEn).filter((key) => !(key in merged));
      expect({ locale, missing }).toEqual({ locale, missing: [] });
    }
  });

  it('non-en bundles prefer the base translation over the en underlay', () => {
    const basePt = readJson(path.join(LOCALES_ROOT, 'base-pt.json'));
    const merged = mergeMessages('village', 'pt');
    for (const key of Object.keys(basePt).slice(0, 25)) {
      expect(merged[key]).toBe(basePt[key]);
    }
  });

  it('config overlay wins over base for its locale only', () => {
    const overlay = {
      en: { stay_title: 'Custom stay title' },
      pt: { stay_title: 'Título personalizado' },
    };
    expect(mergeMessages('village', 'en', overlay).stay_title).toBe(
      'Custom stay title',
    );
    expect(mergeMessages('village', 'pt', overlay).stay_title).toBe(
      'Título personalizado',
    );
    const baseEn = readJson(path.join(LOCALES_ROOT, 'base-en.json'));
    const { stay_title: _custom, ...restMerged } = mergeMessages(
      'village',
      'en',
      overlay,
    );
    const { stay_title: _base, ...restBase } = baseEn;
    expect(restMerged).toEqual(restBase);
  });

  it('never applies the overlay or en underlay to legacy apps', () => {
    const overlay = { en: { stay_title: 'Village-only string' } };
    const baseEn = readJson(path.join(LOCALES_ROOT, 'base-en.json'));
    const tdfOverlay = readJson(path.join(LOCALES_ROOT, 'tdf', 'en.json'));
    expect(mergeMessages('tdf', 'en', overlay)).toEqual({
      ...baseEn,
      ...tdfOverlay,
    });
  });
});

describe('resolveVillageI18n', () => {
  it('defaults to en when no language is configured', () => {
    expect(resolveVillageI18n({})).toEqual({
      locales: BASE_LOCALES,
      defaultLocale: 'en',
    });
    expect(resolveVillageI18n({ general: {} })).toEqual({
      locales: BASE_LOCALES,
      defaultLocale: 'en',
    });
  });

  it('uses general.language as the default locale when a bundle exists', () => {
    expect(resolveVillageI18n({ general: { language: 'pt' } })).toEqual({
      locales: BASE_LOCALES,
      defaultLocale: 'pt',
    });
    expect(
      resolveVillageI18n({ general: { language: ' PL ' } }).defaultLocale,
    ).toBe('pl');
  });

  it('warns and falls back to en for a language with no base bundle', () => {
    const log = silentLog();
    expect(
      resolveVillageI18n({ general: { language: 'xx' } }, log),
    ).toEqual({ locales: BASE_LOCALES, defaultLocale: 'en' });
    expect(log.warn).toHaveBeenCalledTimes(1);
  });

  it('tolerates malformed snapshots', () => {
    const log = silentLog();
    // `undefined` is excluded: it would trigger the default parameter, which
    // reads whatever snapshot happens to be on disk.
    for (const bad of [null, 'nope', 42, { general: { language: 7 } }]) {
      expect(resolveVillageI18n(bad, log).defaultLocale).toBe('en');
    }
  });
});
