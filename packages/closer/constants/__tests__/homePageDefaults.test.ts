import { buildHomePageDefaults } from '../homePageDefaults';
import type { StandardPageVillageData } from '../standardPages';

const village = (
  overrides: Partial<StandardPageVillageData> = {},
): StandardPageVillageData => ({
  platformName: 'Sunset Valley',
  countryName: 'Portugal',
  teamEmail: 'hello@example.com',
  tokenSymbol: '',
  citizenshipTokensRequired: null,
  citizenshipMinStayDays: null,
  features: {
    home: true,
    booking: false,
    events: false,
    volunteering: false,
    token: false,
    citizenship: false,
    subscriptions: false,
    cohousing: false,
    fundraiser: false,
  },
  ...overrides,
});

const types = (doc: { sections: Array<{ type: string }> }) =>
  doc.sections.map((s) => s.type);

const hero = (doc: ReturnType<typeof buildHomePageDefaults>) =>
  doc.sections[0].data.content as Record<string, any>;

describe('buildHomePageDefaults', () => {
  it('names the village in the title, hero and description', () => {
    const doc = buildHomePageDefaults(village());
    expect(doc.slug).toBe('/');
    expect(doc.title).toBe('Sunset Valley');
    expect(hero(doc).title).toBe('Welcome to Sunset Valley');
    expect(hero(doc).eyebrow).toBe('A village in Portugal');
    expect(doc.description).toContain('Sunset Valley');
  });

  it('degrades to neutral copy when the village has no name or country yet', () => {
    const doc = buildHomePageDefaults(
      village({ platformName: '', countryName: '', teamEmail: '' }),
    );
    expect(doc.title).toBe('Welcome');
    expect(hero(doc).title).toBe('Welcome');
    expect(hero(doc).eyebrow).toBe('');
    expect(JSON.stringify(doc)).not.toContain('undefined');
  });

  it('is a hero and a sign-up call when no feature is enabled', () => {
    const doc = buildHomePageDefaults(village());
    expect(types(doc)).toEqual(['hero', 'cta']);
    expect(hero(doc).secondaryCta).toEqual({ text: '', url: '' });
  });

  it('adds a card and a live block for each enabled feature', () => {
    const doc = buildHomePageDefaults(
      village({
        features: {
          ...village().features,
          booking: true,
          events: true,
          volunteering: true,
        },
      }),
    );
    expect(types(doc)).toEqual([
      'hero',
      'features',
      'listingsPreviews',
      'upcomingEvents',
      'volunteerCta',
      'cta',
    ]);
    const cards = (doc.sections[1].data.content as any).items as Array<{
      cta: { url: string };
    }>;
    expect(cards.map((c) => c.cta.url)).toEqual([
      '/stay',
      '/events',
      '/volunteer',
    ]);
    expect(hero(doc).secondaryCta).toEqual({
      text: 'Plan a visit',
      url: '/stay',
    });
  });

  it('points visitors at events when there is nothing to book', () => {
    const doc = buildHomePageDefaults(
      village({ features: { ...village().features, events: true } }),
    );
    expect(hero(doc).secondaryCta.url).toBe('/events');
    expect(types(doc)).toContain('upcomingEvents');
    expect(types(doc)).not.toContain('listingsPreviews');
  });

  it('offers the team email as the closing secondary action', () => {
    const doc = buildHomePageDefaults(village());
    const cta = doc.sections[doc.sections.length - 1].data.content as any;
    expect(cta.primaryLink).toBe('/signup');
    expect(cta.secondaryLink).toBe('mailto:hello@example.com');
  });
});
