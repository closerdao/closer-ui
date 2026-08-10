import {
  buildPageGroups,
  movePageUpdates,
  moveSectionUpdates,
  renameSectionUpdates,
  type PageListItem,
} from '../PagesSidebar';

const page = (
  overrides: Partial<PageListItem> & { _id: string },
): PageListItem => ({
  title: overrides._id,
  slug: `/${overrides._id}`,
  menuSection: '',
  menuSectionOrder: 0,
  menuOrder: 0,
  ...overrides,
});

const isUnsaved = (item: PageListItem) => item.isDefault === true;

describe('buildPageGroups', () => {
  it('keeps unsectioned pages in a group of their own, last', () => {
    const groups = buildPageGroups([
      page({ _id: 'loose' }),
      page({ _id: 'team', menuSection: 'About' }),
    ]);
    expect(groups.map((g) => g.section)).toEqual(['About', '']);
    expect(groups[1].pages.map((p) => p._id)).toEqual(['loose']);
  });

  it('orders sections by menuSectionOrder', () => {
    const groups = buildPageGroups([
      page({ _id: 'stay', menuSection: 'Visit', menuSectionOrder: 0 }),
      page({ _id: 'team', menuSection: 'About', menuSectionOrder: 1 }),
    ]);
    expect(groups.map((g) => g.section)).toEqual(['Visit', 'About', '']);
  });

  it('sorts unsectioned pages among themselves by menuOrder', () => {
    const groups = buildPageGroups([
      page({ _id: 'b', menuOrder: 1 }),
      page({ _id: 'a', menuOrder: 0 }),
    ]);
    expect(groups[0].pages.map((p) => p._id)).toEqual(['a', 'b']);
  });

  it('includes locally created empty sections after the saved ones', () => {
    const groups = buildPageGroups(
      [page({ _id: 'team', menuSection: 'About' })],
      ['Visit'],
    );
    expect(groups.map((g) => g.section)).toEqual(['About', 'Visit', '']);
  });
});

describe('movePageUpdates', () => {
  it('reorders unsectioned pages', () => {
    const groups = buildPageGroups([
      page({ _id: 'a', menuOrder: 0 }),
      page({ _id: 'b', menuOrder: 1 }),
      page({ _id: 'c', menuOrder: 2 }),
    ]);
    const updates = movePageUpdates(groups, 'c', '', 0, isUnsaved);
    expect(
      updates.map((u) => [u._id, u.menuSection, u.menuOrder]),
    ).toEqual([
      ['c', '', 0],
      ['a', '', 1],
      ['b', '', 2],
    ]);
  });

  it('moves a page into a section', () => {
    const groups = buildPageGroups([
      page({ _id: 'team', menuSection: 'About', menuOrder: 0 }),
      page({ _id: 'loose' }),
    ]);
    const updates = movePageUpdates(groups, 'loose', 'About', 0, isUnsaved);
    expect(updates).toContainEqual({
      _id: 'loose',
      slug: '/loose',
      menuSection: 'About',
      menuSectionOrder: 0,
      menuOrder: 0,
    });
    expect(updates).toContainEqual({
      _id: 'team',
      slug: '/team',
      menuSection: 'About',
      menuSectionOrder: 0,
      menuOrder: 1,
    });
  });

  it('moves a page out of a section back to the loose list', () => {
    const groups = buildPageGroups([
      page({ _id: 'team', menuSection: 'About', menuOrder: 0 }),
      page({ _id: 'press', menuSection: 'About', menuOrder: 1 }),
      page({ _id: 'loose', menuSectionOrder: 1 }),
    ]);
    const updates = movePageUpdates(groups, 'press', '', 0, isUnsaved);
    const press = updates.find((u) => u._id === 'press');
    expect(press).toEqual({
      _id: 'press',
      slug: '/press',
      menuSection: '',
      menuSectionOrder: 1,
      menuOrder: 0,
    });
  });

  it('does not create records for untouched unsaved standard pages', () => {
    const groups = buildPageGroups([
      page({ _id: 'std:/team', menuSection: 'About', isDefault: true }),
      page({ _id: 'loose' }),
    ]);
    const updates = movePageUpdates(groups, 'loose', 'About', 1, isUnsaved);
    expect(updates.map((u) => u._id)).toEqual(['loose']);
  });

  it('still persists an unsaved standard page when it is the one dragged', () => {
    const groups = buildPageGroups([
      page({ _id: 'std:/team', isDefault: true }),
      page({ _id: 'loose', menuSection: 'About' }),
    ]);
    const updates = movePageUpdates(groups, 'std:/team', 'About', 0, isUnsaved);
    expect(updates.map((u) => u._id)).toContain('std:/team');
  });

  it('returns nothing when the page did not move', () => {
    const groups = buildPageGroups([
      page({ _id: 'a', menuSection: 'About', menuOrder: 0 }),
    ]);
    expect(movePageUpdates(groups, 'a', 'About', 0, isUnsaved)).toEqual([]);
  });
});

describe('moveSectionUpdates', () => {
  it('renumbers every page in the moved and displaced sections', () => {
    const groups = buildPageGroups([
      page({ _id: 'a', menuSection: 'About', menuSectionOrder: 0 }),
      page({ _id: 'b', menuSection: 'Visit', menuSectionOrder: 1 }),
      page({ _id: 'c', menuSection: 'Visit', menuSectionOrder: 1, menuOrder: 1 }),
    ]);
    const updates = moveSectionUpdates(groups, 'Visit', 0, isUnsaved);
    expect(
      updates.map((u) => [u._id, u.menuSectionOrder]).sort(),
    ).toEqual([
      ['a', 1],
      ['b', 0],
      ['c', 0],
    ]);
  });

  it('keeps page order inside the moved section', () => {
    const groups = buildPageGroups([
      page({ _id: 'a', menuSection: 'About', menuSectionOrder: 0 }),
      page({ _id: 'b', menuSection: 'Visit', menuSectionOrder: 1, menuOrder: 0 }),
      page({ _id: 'c', menuSection: 'Visit', menuSectionOrder: 1, menuOrder: 1 }),
    ]);
    const updates = moveSectionUpdates(groups, 'Visit', 0, isUnsaved);
    expect(updates.find((u) => u._id === 'b')?.menuOrder).toBe(0);
    expect(updates.find((u) => u._id === 'c')?.menuOrder).toBe(1);
  });

  it('ignores the unsectioned group', () => {
    const groups = buildPageGroups([page({ _id: 'loose' })]);
    expect(moveSectionUpdates(groups, '', 0, isUnsaved)).toEqual([]);
  });
});

describe('renameSectionUpdates', () => {
  it('patches every page in the section', () => {
    const groups = buildPageGroups([
      page({ _id: 'a', menuSection: 'About', menuOrder: 0 }),
      page({ _id: 'b', menuSection: 'About', menuOrder: 1 }),
      page({ _id: 'c', menuSection: 'Visit', menuSectionOrder: 1 }),
    ]);
    const updates = renameSectionUpdates(groups, 'About', 'Our story', isUnsaved);
    expect(updates.map((u) => [u._id, u.menuSection])).toEqual([
      ['a', 'Our story'],
      ['b', 'Our story'],
    ]);
  });

  it('merges into an existing section when renamed onto it', () => {
    const groups = buildPageGroups([
      page({ _id: 'a', menuSection: 'About', menuSectionOrder: 0 }),
      page({ _id: 'b', menuSection: 'Visit', menuSectionOrder: 1 }),
    ]);
    const updates = renameSectionUpdates(groups, 'About', 'Visit', isUnsaved);
    // The merged-in pages land after the ones already in the target section.
    expect(updates.map((u) => [u._id, u.menuSection, u.menuOrder])).toEqual([
      ['b', 'Visit', 0],
      ['a', 'Visit', 1],
    ]);
  });

  it('ignores empty or unchanged names', () => {
    const groups = buildPageGroups([
      page({ _id: 'a', menuSection: 'About' }),
    ]);
    expect(renameSectionUpdates(groups, 'About', '  ', isUnsaved)).toEqual([]);
    expect(renameSectionUpdates(groups, 'About', 'About', isUnsaved)).toEqual([]);
  });
});
