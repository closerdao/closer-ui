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
