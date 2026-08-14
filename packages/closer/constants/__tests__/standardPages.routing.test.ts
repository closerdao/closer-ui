import {
  HOME_PAGE_EDITOR_SEGMENT,
  buildDefaultStandardPageDoc,
  editorHrefForPage,
  editorPathSegmentForPage,
  getStandardPageDefinition,
  resolveEditorRouteParam,
  toStandardPageVirtualId,
} from '../standardPages';

describe('editor routing helpers', () => {
  it('encodes nested slugs when marked standard', () => {
    const page = {
      _id: 'std:/pages/example',
      slug: '/pages/example',
      isStandard: true,
    };
    expect(editorPathSegmentForPage(page)).toBe('pages%2Fexample');
    expect(editorHrefForPage(page)).toBe(
      '/dashboard/pages/pages%2Fexample',
    );
  });

  it('uses object id for custom pages', () => {
    expect(
      editorPathSegmentForPage({
        _id: '507f1f77bcf86cd799439011',
        slug: '/custom',
      }),
    ).toBe('507f1f77bcf86cd799439011');
  });

  it('resolves encoded nested route params', () => {
    expect(resolveEditorRouteParam('pages%2Fexample')).toBe('pages/example');
    expect(resolveEditorRouteParam('/pages/example')).toBe('/pages/example');
  });

  it('routes the home page through a named segment', () => {
    const page = { _id: 'std:/', slug: '/', isStandard: true };
    expect(editorPathSegmentForPage(page)).toBe(HOME_PAGE_EDITOR_SEGMENT);
    expect(editorHrefForPage(page)).toBe('/dashboard/pages/home');
    expect(resolveEditorRouteParam(HOME_PAGE_EDITOR_SEGMENT)).toBe('/');
    expect(resolveEditorRouteParam(toStandardPageVirtualId('/'))).toBe('/');
  });

  it('resolves virtual ids and object ids', () => {
    expect(resolveEditorRouteParam(toStandardPageVirtualId('/token'))).toBe(
      '/token',
    );
    expect(resolveEditorRouteParam('507f1f77bcf86cd799439011')).toBe(
      '507f1f77bcf86cd799439011',
    );
  });
});

describe('home standard page', () => {
  it('is registered and always enabled', () => {
    const def = getStandardPageDefinition('/');
    expect(def?.key).toBe('home');
    expect(def?.feature).toBe('home');
  });

  it('builds a default doc with sections', () => {
    const doc = buildDefaultStandardPageDoc('/');
    expect(doc).not.toBeNull();
    expect(doc?.slug).toBe('/');
    expect(doc?._id).toBe('std:/');
    expect((doc?.sections ?? []).length).toBeGreaterThan(0);
  });
});
