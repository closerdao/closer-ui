/**
 * `buildStandardPageVillageData` was split out of `getStandardPageVillageData`
 * so `/first-steps` can seed a page from config the admin has only just saved.
 *
 * The build-time snapshot is frozen at `next build`, so without this a page
 * created during setup would interpolate `{{platformName}}` from whatever the
 * build knew — on a fresh village, nothing at all.
 */
import {
  buildStandardPageVillageData,
  getStandardPageVillageData,
} from '../../constants/standardPages';

const noFeatures = {};

describe('buildStandardPageVillageData', () => {
  it('reads the sources it is handed rather than the snapshot', () => {
    const village = buildStandardPageVillageData({
      general: {
        platformName: 'Traditional Dream Factory',
        country: 'PT',
        teamEmail: 'space@tdf.com',
      },
      token: { bookingToken: '$TDF' },
      citizenship: { tokensRequired: 30, minVouchingStayDuration: 14 },
      featureConfig: noFeatures,
    });

    expect(village.platformName).toBe('Traditional Dream Factory');
    expect(village.teamEmail).toBe('space@tdf.com');
    expect(village.tokenSymbol).toBe('TDF');
    expect(village.citizenshipTokensRequired).toBe(30);
    expect(village.citizenshipMinStayDays).toBe(14);
  });

  it('resolves the country code to an English display name', () => {
    expect(
      buildStandardPageVillageData({
        general: { country: 'PT' },
        token: {},
        citizenship: {},
        featureConfig: noFeatures,
      }).countryName,
    ).toBe('Portugal');
  });

  it('leaves unset values blank rather than inventing them', () => {
    const village = buildStandardPageVillageData({
      general: {},
      token: {},
      citizenship: {},
      featureConfig: noFeatures,
    });
    expect(village.platformName).toBe('');
    expect(village.countryName).toBe('');
    expect(village.teamEmail).toBe('');
    expect(village.tokenSymbol).toBe('');
    expect(village.citizenshipTokensRequired).toBeNull();
  });

  it('rejects a country code that is not two letters', () => {
    expect(
      buildStandardPageVillageData({
        general: { country: 'Portugal' },
        token: {},
        citizenship: {},
        featureConfig: noFeatures,
      }).countryName,
    ).toBe('');
  });

  it('derives a feature map from the config it is given', () => {
    const village = buildStandardPageVillageData({
      general: {},
      token: {},
      citizenship: {},
      featureConfig: { events: { enabled: true } },
    });
    // The home page is never gated; events follows the config it was handed.
    expect(village.features.home).toBe(true);
    expect(village.features.events).toBe(true);
    expect(village.features.cohousing).toBe(false);
  });
});

describe('getStandardPageVillageData', () => {
  it('still returns a complete village shape from the snapshot', () => {
    const village = getStandardPageVillageData();
    expect(village).toEqual(
      expect.objectContaining({
        platformName: expect.any(String),
        countryName: expect.any(String),
        teamEmail: expect.any(String),
        tokenSymbol: expect.any(String),
        features: expect.any(Object),
      }),
    );
  });
});
