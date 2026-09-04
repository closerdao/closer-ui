import {
  buildDefaultStandardPageDoc,
  getStandardPageDefinition,
} from '../../constants/standardPages';
import type { PageDoc } from '../../types/page';
import { mergeEditorPages } from '../standardPages';
import {
  canRenderDefaultStandardPage,
  resolveStandardOrDbPage,
  upgradeStandardPageFromDefaults,
} from '../standardPages';

// These cover the resolution rules, not the API. Without this the DB lookups
// they trigger go out over the wire and every miss resolves api.example.com
// for real, which is slow and fills the run with connection errors.
jest.mock('../api', () => ({
  __esModule: true,
  default: { get: jest.fn(async () => ({ data: { results: [] } })) },
  formatSearch: () => '',
  cdn: '',
}));

// A fixed village so the assertions do not depend on whichever config
// snapshot the last build generated.
jest.mock('../buildTimeConfig.helpers', () => {
  const config: Record<string, Record<string, unknown>> = {
    general: {
      platformName: 'Sunset Valley',
      country: 'PT',
      teamEmail: 'hello@example.com',
    },
    booking: { enabled: true },
    events: { enabled: true },
    volunteering: { enabled: true },
    citizenship: { enabled: false },
    token: { bookingToken: '' },
  };
  return {
    __esModule: true,
    getBuildTimeConfigValue: (slug: string) => config[slug] ?? null,
    getSavedConfigValue: (slug: string) => config[slug] ?? null,
    getBuildTimeKeyedConfig: () => config,
  };
});

const ENV_KEYS = [
  'NEXT_PUBLIC_APP_NAME',
  'NEXT_PUBLIC_FEATURE_TOKEN_SALE',
  'NEXT_PUBLIC_FEATURE_VOLUNTEERING',
  'NEXT_PUBLIC_FEATURE_BOOKING',
] as const;
const originalEnv: Record<string, string | undefined> = {};

beforeAll(() => {
  ENV_KEYS.forEach((key) => {
    originalEnv[key] = process.env[key];
  });
});

afterEach(() => {
  ENV_KEYS.forEach((key) => {
    if (originalEnv[key] === undefined) delete process.env[key];
    else process.env[key] = originalEnv[key];
  });
});

describe('mergeEditorPages', () => {
  it('returns one flat list of every page', () => {
    const pages = mergeEditorPages(
      [
        { _id: '1', title: 'Custom', slug: '/custom' },
        { _id: '2', title: 'Stay', slug: '/stay', isStandard: true },
      ],
      { booking: { enabled: true } },
    );
    expect(pages.some((p) => p.slug === '/custom')).toBe(true);
    expect(pages.some((p) => p.slug === '/stay' && p._id === '2')).toBe(true);
  });

  it('titles unsaved standard pages with the village-filled default title', () => {
    process.env.NEXT_PUBLIC_FEATURE_BOOKING = 'true';
    const pages = mergeEditorPages([], { booking: { enabled: true } });
    const home = pages.find((p) => p.slug === '/');
    const stay = pages.find((p) => p.slug === '/stay');
    expect(home?.isDefault).toBe(true);
    expect(home?.title).toBe('Sunset Valley');
    expect(stay?.title).toBe('Stay at Sunset Valley');
  });

  it('carries menu metadata through', () => {
    const pages = mergeEditorPages(
      [
        {
          _id: '1',
          title: 'Custom',
          slug: '/custom',
          showInMenu: true,
          menuSection: 'About',
          menuOrder: 3,
        },
      ],
      null,
    );
    const page = pages.find((p) => p._id === '1');
    expect(page?.showInMenu).toBe(true);
    expect(page?.menuSection).toBe('About');
    expect(page?.menuOrder).toBe(3);
  });
});

describe('upgradeStandardPageFromDefaults', () => {
  it('upgrades empty standard pages to defaults on any app', () => {
    process.env.NEXT_PUBLIC_APP_NAME = 'demo';
    const defaults = buildDefaultStandardPageDoc('/stay');
    expect(defaults).not.toBeNull();
    const upgraded = upgradeStandardPageFromDefaults({
      _id: 'abc',
      title: '',
      slug: '/stay',
      sections: [],
      isStandard: true,
    });
    expect(upgraded.sections.length).toBeGreaterThan(0);
    expect(upgraded.isStandard).toBe(true);
    expect(upgraded._id).toBe('abc');
    expect(upgraded.title).toBe('Stay at Sunset Valley');
  });

  it('keeps an edited standard page as saved', () => {
    const page: PageDoc = {
      _id: 'abc',
      title: 'Our stays',
      slug: '/stay',
      sections: [
        { type: 'hero', data: {} },
        { type: 'listingsPreviews', data: {} },
      ],
      isStandard: true,
    };
    expect(upgradeStandardPageFromDefaults(page)).toBe(page);
  });

  it('leaves non-standard pages untouched', () => {
    const page = {
      _id: '1',
      title: 'X',
      slug: '/custom',
      sections: [],
    };
    expect(upgradeStandardPageFromDefaults(page)).toBe(page);
  });
});

describe('standard-page defaults on the public render path', () => {
  it('always serves the generated home page', async () => {
    process.env.NEXT_PUBLIC_APP_NAME = 'demo';
    expect(canRenderDefaultStandardPage('/')).toBe(true);
    const page = await resolveStandardOrDbPage('/');
    expect(page?.isDefault).toBe(true);
    expect(page?.title).toBe('Sunset Valley');
    expect((page?.sections ?? []).length).toBeGreaterThan(0);
  });

  it('serves defaults on any app when the feature gate is on', async () => {
    delete process.env.NEXT_PUBLIC_APP_NAME;
    process.env.NEXT_PUBLIC_FEATURE_BOOKING = 'true';
    const page = await resolveStandardOrDbPage('/stay');
    expect(page?.isDefault).toBe(true);
    expect(page?.title).toBe('Stay at Sunset Valley');
    expect(await resolveStandardOrDbPage('std:/stay')).not.toBeNull();
  });

  it('respects feature gates: a gated-off route resolves to null', async () => {
    process.env.NEXT_PUBLIC_FEATURE_TOKEN_SALE = 'false';
    process.env.NEXT_PUBLIC_FEATURE_VOLUNTEERING = 'false';
    expect(canRenderDefaultStandardPage('/token')).toBe(false);
    expect(await resolveStandardOrDbPage('/token')).toBeNull();
    expect(await resolveStandardOrDbPage('/volunteer')).toBeNull();
  });

  it('still serves gated-off defaults to the dashboard editor', async () => {
    process.env.NEXT_PUBLIC_FEATURE_TOKEN_SALE = 'false';
    const page = await resolveStandardOrDbPage('/token', {
      context: 'editor',
    });
    expect(page?.isDefault).toBe(true);
  });

  it('no longer knows the retired TDF pages', async () => {
    expect(getStandardPageDefinition('/team')).toBeNull();
    expect(getStandardPageDefinition('/press')).toBeNull();
    expect(getStandardPageDefinition('/dataroom')).toBeNull();
    expect(await resolveStandardOrDbPage('/team')).toBeNull();
    expect(await resolveStandardOrDbPage('/dataroom', { context: 'editor' })).toBeNull();
  });
});

describe('getStandardPageDefinition', () => {
  it('does not treat marketing routes as standards', () => {
    expect(getStandardPageDefinition('/abela-art-faire')).toBeNull();
    expect(getStandardPageDefinition('/pages/restaurant')).toBeNull();
    expect(getStandardPageDefinition('/roadmap')).toBeNull();
  });
});
