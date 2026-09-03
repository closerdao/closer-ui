/**
 * The shipped standard-page defaults are rendered for every village, so they
 * must carry no village's identity (#951). Anything that names the village
 * goes through a `{{placeholder}}`, and every placeholder must resolve.
 */
import { createSection } from '../../components/PageEditor/blockDefaults';
import type { SectionType } from '../../types/page';
import {
  STANDARD_PAGES,
  STANDARD_PAGE_DEFAULTS,
  buildDefaultStandardPageDoc,
  interpolateVillageData,
  type StandardPageVillageData,
} from '../standardPages';

const BRAND_PATTERN =
  /tdf|traditional\s*dream|closer\.earth|oasa|abela|alentejo|enseada|delesque|traditionaldreamfactory|gitbook\.io|t\.me\/|docs\.google\.com|@gmail\.com|_i18n_/i;

const neutralVillage: StandardPageVillageData = {
  platformName: '',
  countryName: '',
  teamEmail: '',
  tokenSymbol: '',
  citizenshipTokensRequired: null,
  citizenshipMinStayDays: null,
  features: {
    home: true,
    booking: true,
    events: true,
    volunteering: true,
    token: true,
    citizenship: true,
    subscriptions: true,
    cohousing: true,
    fundraiser: true,
  },
};

const configuredVillage: StandardPageVillageData = {
  ...neutralVillage,
  platformName: 'Sunset Valley',
  countryName: 'Portugal',
  teamEmail: 'hello@example.com',
  tokenSymbol: 'SUN',
  citizenshipTokensRequired: 30,
  citizenshipMinStayDays: 14,
};

describe('standard-page defaults are village-neutral', () => {
  const slugs = Object.keys(STANDARD_PAGES);

  it('ships defaults for every standard page and nothing else', () => {
    expect(slugs).toContain('/');
    expect(slugs).not.toContain('/team');
    expect(slugs).not.toContain('/press');
    expect(slugs).not.toContain('/dataroom');
    // `/` is generated, every other page comes from the JSON.
    expect(Object.keys(STANDARD_PAGE_DEFAULTS).sort()).toEqual(
      slugs.filter((slug) => slug !== '/').sort(),
    );
  });

  it.each(Object.keys(STANDARD_PAGE_DEFAULTS))(
    'raw defaults for %s carry no village identity',
    (slug) => {
      expect(JSON.stringify(STANDARD_PAGE_DEFAULTS[slug])).not.toMatch(
        BRAND_PATTERN,
      );
    },
  );

  it.each(slugs)('%s resolves every placeholder for a configured village', (slug) => {
    const doc = buildDefaultStandardPageDoc(slug, configuredVillage);
    expect(doc).not.toBeNull();
    const serialized = JSON.stringify(doc);
    expect(serialized).not.toMatch(/\{\{/);
    expect(serialized).not.toMatch(BRAND_PATTERN);
  });

  it.each(slugs)('%s still reads correctly for an unconfigured village', (slug) => {
    const serialized = JSON.stringify(
      buildDefaultStandardPageDoc(slug, neutralVillage),
    );
    expect(serialized).not.toMatch(/\{\{/);
    expect(serialized).not.toMatch(/undefined|null tokens|\s{2,}/);
  });

  it('fills the village name and token symbol into the copy', () => {
    const stay = buildDefaultStandardPageDoc('/stay', configuredVillage);
    expect(stay?.title).toBe('Stay at Sunset Valley');
    const token = JSON.stringify(
      buildDefaultStandardPageDoc('/token', configuredVillage),
    );
    expect(token).toContain('$SUN');
    const citizenship = JSON.stringify(
      buildDefaultStandardPageDoc('/citizenship', configuredVillage),
    );
    expect(citizenship).toContain('Hold 30+ $SUN');
    expect(citizenship).toContain('Spend 14 days on the land');
  });

  it('falls back to sentences that still scan when nothing is configured', () => {
    const token = JSON.stringify(
      buildDefaultStandardPageDoc('/token', neutralVillage),
    );
    expect(token).toContain('Ready to buy our village tokens?');
    const citizenship = JSON.stringify(
      buildDefaultStandardPageDoc('/citizenship', neutralVillage),
    );
    expect(citizenship).toContain('Hold the required our village tokens');
    expect(citizenship).toContain('Spend time on the land');
  });

  it('interpolates nested structures and drops unknown placeholders', () => {
    const out = interpolateVillageData(
      { a: ['{{platformName}} x', { b: '{{nope}}!' }] },
      configuredVillage,
    );
    expect(out).toEqual({ a: ['Sunset Valley x', { b: '!' }] });
  });
});

describe('editor block defaults are village-neutral', () => {
  const blockTypes: SectionType[] = [
    'hero',
    'gallery',
    'reviews',
    'volunteerCta',
    'fundraiserPromo',
    'teamStructure',
    'teamMembers',
    'teamDepartments',
    'teamPartners',
    'teamGovernance',
    'teamJoinCta',
    'pressStats',
    'pressPublications',
    'pressHighlights',
    'pressPodcasts',
    'pressContact',
    'dataroom',
  ];

  it.each(blockTypes)('new %s block carries no village identity', (type) => {
    expect(JSON.stringify(createSection(type))).not.toMatch(BRAND_PATTERN);
  });
});
