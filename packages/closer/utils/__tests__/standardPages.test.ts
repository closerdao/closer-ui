import {
  buildDefaultStandardPageDoc,
  getStandardPageDefinition,
} from '../../constants/standardPages';
import { mergeEditorPages } from '../standardPages';
import { upgradeStandardPageFromDefaults } from '../standardPages';

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
