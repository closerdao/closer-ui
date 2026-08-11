import { buildPageMenuSections, type MenuPage } from '../pageMenu';

const page = (overrides: Partial<MenuPage> & { _id: string }): MenuPage => ({
  title: overrides._id,
  slug: `/${overrides._id}`,
  showInMenu: true,
  menuSection: '',
  menuOrder: 0,
  ...overrides,
});

describe('buildPageMenuSections', () => {
  it('ignores pages that are not flagged for the menu', () => {
    const sections = buildPageMenuSections([
      page({ _id: 'shown' }),
      page({ _id: 'hidden', showInMenu: false }),
    ]);
    expect(sections.map((s) => s.label)).toEqual(['shown']);
  });

  it('groups pages sharing a section and orders them by menuOrder', () => {
    const sections = buildPageMenuSections([
      page({ _id: 'team', menuSection: 'About', menuOrder: 1 }),
      page({ _id: 'press', menuSection: 'About', menuOrder: 0 }),
    ]);
    expect(sections).toHaveLength(1);
    expect(sections[0].label).toBe('About');
    expect(sections[0].items.map((i) => i.url)).toEqual(['/press', '/team']);
  });

  it('orders sections by the lowest menuOrder they contain', () => {
    const sections = buildPageMenuSections([
      page({ _id: 'stay', menuSection: 'Visit', menuOrder: 1000 }),
      page({ _id: 'team', menuSection: 'About', menuOrder: 0 }),
      page({ _id: 'blog', menuOrder: 2000 }),
    ]);
    expect(sections.map((s) => s.label)).toEqual(['About', 'Visit', 'blog']);
  });

  it('renders pages without a section as standalone entries', () => {
    const sections = buildPageMenuSections([page({ _id: 'events' })]);
    expect(sections[0]).toEqual({
      label: 'events',
      items: [{ label: 'events', url: '/events' }],
    });
  });

  it('prefers menuLabel over the page title', () => {
    const sections = buildPageMenuSections([
      page({ _id: 'team', title: 'Team — Traditional Dream Factory' }),
      page({ _id: 'press', title: 'Press', menuLabel: 'In the news' }),
    ]);
    expect(sections.map((s) => s.items[0].label)).toEqual([
      'In the news',
      'Team — Traditional Dream Factory',
    ]);
  });

  it('falls back to the title when menuLabel is blank', () => {
    const sections = buildPageMenuSections([
      page({ _id: 'team', title: 'Team', menuLabel: '   ' }),
    ]);
    expect(sections[0].items[0].label).toBe('Team');
  });

  it('resolves i18n placeholders through the provided resolver', () => {
    const sections = buildPageMenuSections(
      [page({ _id: 'team', title: '_i18n_menu_team', menuSection: 'About' })],
      (value) => (value === '_i18n_menu_team' ? 'Team' : value),
    );
    expect(sections[0].items[0].label).toBe('Team');
  });
});
