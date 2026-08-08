import {
  editorHrefForPage,
  editorPathSegmentForPage,
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

  it('resolves virtual ids and object ids', () => {
    expect(resolveEditorRouteParam(toStandardPageVirtualId('/token'))).toBe(
      '/token',
    );
    expect(resolveEditorRouteParam('507f1f77bcf86cd799439011')).toBe(
      '507f1f77bcf86cd799439011',
    );
  });
});
