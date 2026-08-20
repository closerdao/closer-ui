import {
  buildDefaultStandardPageDoc,
  getStandardPageDefinition,
} from '../../constants/standardPages';
import { mergeEditorPages } from '../standardPages';
import {
  canRenderDefaultStandardPage,
  resolveStandardOrDbPage,
  upgradeStandardPageFromDefaults,
} from '../standardPages';

const ENV_KEYS = [
  'NEXT_PUBLIC_APP_NAME',
  'NEXT_PUBLIC_FEATURE_TOKEN_SALE',
  'NEXT_PUBLIC_FEATURE_VOLUNTEERING',
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
  // The shipped defaults are TDF's real content; only a TDF build swaps them in.
  beforeEach(() => {
    process.env.NEXT_PUBLIC_APP_NAME = 'tdf';
  });

  it('upgrades empty standard pages to defaults', () => {
    const defaults = buildDefaultStandardPageDoc('/dataroom');
    expect(defaults).not.toBeNull();
    const upgraded = upgradeStandardPageFromDefaults({
      _id: 'abc',
      title: '',
      slug: '/dataroom',
      sections: [],
      isStandard: true,
    });
    expect(upgraded.sections.length).toBeGreaterThan(0);
    expect(upgraded.isStandard).toBe(true);
  });

  it('replaces a saved legacy single-block dataroom with the block defaults', () => {
    const upgraded = upgradeStandardPageFromDefaults({
      _id: 'abc',
      title: '_i18n_dataroom_hero_subtitle',
      slug: '/dataroom',
      sections: [{ type: 'dataroom', data: { settings: {}, content: {} } }],
      isStandard: true,
    });
    expect(upgraded.sections.length).toBeGreaterThan(1);
    expect(upgraded.sections.some((s) => s.type === 'dataroom')).toBe(false);
    expect(upgraded._id).toBe('abc');
  });

  it('keeps an edited dataroom page as saved', () => {
    const page = {
      _id: 'abc',
      title: 'Data room',
      slug: '/dataroom',
      sections: [
        { type: 'hero', data: {} },
        { type: 'documents', data: {} },
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

  it('never swaps TDF defaults into a sparse page on a non-tdf app', () => {
    process.env.NEXT_PUBLIC_APP_NAME = 'demo';
    const page = {
      _id: 'abc',
      title: '',
      slug: '/dataroom',
      sections: [],
      isStandard: true,
    };
    expect(upgradeStandardPageFromDefaults(page)).toBe(page);
  });
});

describe('day-one neutrality of standard-page defaults (#951)', () => {
  it('never serves shipped defaults on a non-tdf app', async () => {
    process.env.NEXT_PUBLIC_APP_NAME = 'demo';
    expect(canRenderDefaultStandardPage('/team')).toBe(false);
    expect(await resolveStandardOrDbPage('/team')).toBeNull();
    expect(await resolveStandardOrDbPage('/press')).toBeNull();
    expect(await resolveStandardOrDbPage('/dataroom')).toBeNull();
    expect(await resolveStandardOrDbPage('std:/team')).toBeNull();
  });

  it('never serves shipped defaults on a zero-config app (no APP_NAME)', async () => {
    delete process.env.NEXT_PUBLIC_APP_NAME;
    expect(await resolveStandardOrDbPage('/team')).toBeNull();
  });

  it('serves defaults on tdf when the feature gate is on', async () => {
    process.env.NEXT_PUBLIC_APP_NAME = 'tdf';
    const page = await resolveStandardOrDbPage('/team');
    expect(page?.isDefault).toBe(true);
    expect((page?.sections ?? []).length).toBeGreaterThan(0);
  });

  it('respects feature gates on tdf: a gated-off route resolves to null', async () => {
    process.env.NEXT_PUBLIC_APP_NAME = 'tdf';
    process.env.NEXT_PUBLIC_FEATURE_TOKEN_SALE = 'false';
    process.env.NEXT_PUBLIC_FEATURE_VOLUNTEERING = 'false';
    expect(await resolveStandardOrDbPage('/token')).toBeNull();
    expect(await resolveStandardOrDbPage('/volunteer')).toBeNull();
  });

  it('still serves defaults to the dashboard editor on any app', async () => {
    process.env.NEXT_PUBLIC_APP_NAME = 'demo';
    const page = await resolveStandardOrDbPage('/team', { context: 'editor' });
    expect(page?.isDefault).toBe(true);
  });
});

describe('getStandardPageDefinition', () => {
  it('recognizes dataroom as a standard page', () => {
    expect(getStandardPageDefinition('/dataroom')?.key).toBe('dataroom');
  });

  it('does not treat TDF marketing routes as standards', () => {
    expect(getStandardPageDefinition('/abela-art-faire')).toBeNull();
    expect(getStandardPageDefinition('/pages/restaurant')).toBeNull();
    expect(getStandardPageDefinition('/roadmap')).toBeNull();
  });
});
