import {
  canSavePageSlug,
  isProvidedSlugReserved,
  isReservedPageSlug,
} from '../reservedPageSlugs';

describe('isReservedPageSlug', () => {
  it('leaves free custom slugs open', () => {
    expect(isReservedPageSlug('/about', 'earthbound')).toBe(false);
    expect(isReservedPageSlug('/investors', 'earthbound')).toBe(false);
    expect(isReservedPageSlug('about', 'tdf')).toBe(false);
  });

  it('reserves product routes and standard pages on every app', () => {
    expect(isReservedPageSlug('/blog', 'earthbound')).toBe(true);
    expect(isReservedPageSlug('/blog', 'lios')).toBe(true);
    expect(isReservedPageSlug('/events', 'tdf')).toBe(true);
    expect(isReservedPageSlug('/events/create', 'earthbound')).toBe(true);
    expect(isReservedPageSlug('/', 'earthbound')).toBe(true);
  });

  it('reserves Earthbound redirect sources without blocking them on every app', () => {
    expect(isReservedPageSlug('/invest', 'earthbound')).toBe(true);
    expect(isReservedPageSlug('/visit', 'earthbound')).toBe(true);
    expect(isReservedPageSlug('/flyer', 'earthbound')).toBe(true);
    expect(isReservedPageSlug('/invest', 'lios')).toBe(false);
    expect(isReservedPageSlug('/flyer', 'tdf')).toBe(false);
    expect(isReservedPageSlug('/visit', 'my-village')).toBe(true);
  });

  it('uses only routes shared by every app when the app is unknown', () => {
    expect(isReservedPageSlug('/blog', '')).toBe(true);
    expect(isReservedPageSlug('/flyer', '')).toBe(false);
    expect(isReservedPageSlug('/invest', null)).toBe(false);
    expect(isReservedPageSlug('/investors', null)).toBe(false);
  });
});

describe('canSavePageSlug', () => {
  it('lets a standard page keep its own slug', () => {
    expect(
      canSavePageSlug('/events', { isStandard: true, _id: 'abc' }, 'tdf'),
    ).toBe(true);
    expect(
      canSavePageSlug('/events', { _id: 'std:/events' }, 'earthbound'),
    ).toBe(true);
  });

  it('ignores a missing generated slug', () => {
    expect(isProvidedSlugReserved(undefined)).toBe(false);
    expect(isProvidedSlugReserved('')).toBe(false);
    expect(isProvidedSlugReserved('   ')).toBe(false);
    expect(isProvidedSlugReserved('/blog', 'earthbound')).toBe(true);
  });

  it('refuses a custom page on a reserved slug', () => {
    expect(canSavePageSlug('/events', { isStandard: false, _id: 'abc' })).toBe(
      false,
    );
    expect(canSavePageSlug('/blog', { isStandard: true, _id: 'abc' })).toBe(
      false,
    );
    expect(canSavePageSlug('/about', { _id: 'abc' }, 'earthbound')).toBe(true);
  });
});
