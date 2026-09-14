import type { PageDoc, PageSection } from '../../types/page';
import { localizePageForVisitor, readPagePublishState } from '../standardPages';

jest.mock('../api', () => ({
  __esModule: true,
  default: { get: jest.fn(async () => ({ data: { results: [] } })) },
  formatSearch: () => '',
  cdn: '',
}));

const hero = (title: string, id = 'a'): PageSection => ({
  _id: id,
  type: 'hero',
  data: { background: 'dark', content: { title } },
});

const basePage = (): PageDoc => ({
  _id: 'p1',
  title: 'Stay with us',
  slug: '/stay',
  description: 'English description',
  sections: [hero('Hello', 'a'), hero('World', 'b')],
  localizations: {
    pt: {
      title: 'Fique connosco',
      description: 'Descrição',
      sections: [hero('Olá', 'a'), hero('Mundo', 'b')],
    },
  },
});

describe('readPagePublishState', () => {
  it('reads the server-managed draft fields', () => {
    const out = readPagePublishState({
      draftSections: [hero('Draft')],
      needsPublishing: true,
      publishedAt: '2026-08-23T10:00:00.000Z',
      localizations: { pt: { title: 'x' } },
    });
    expect(out.draftSections).toHaveLength(1);
    expect(out.needsPublishing).toBe(true);
    expect(out.publishedAt).toBe('2026-08-23T10:00:00.000Z');
    expect(out.localizations?.pt?.title).toBe('x');
  });

  it('ignores malformed values', () => {
    const out = readPagePublishState({
      draftSections: 'nope',
      needsPublishing: 'yes',
      localizations: [],
    });
    expect(out).toEqual({});
  });
});

describe('localizePageForVisitor', () => {
  it('returns the English page for the default locale', () => {
    const page = basePage();
    expect(localizePageForVisitor(page, 'en', 'en')).toBe(page);
    expect(localizePageForVisitor(page, undefined, 'en')).toBe(page);
  });

  it('swaps in the localized title, description and sections', () => {
    const out = localizePageForVisitor(basePage(), 'pt', 'en');
    expect(out.title).toBe('Fique connosco');
    expect(out.description).toBe('Descrição');
    expect(out.sections.map((s) => s.data.content)).toEqual([
      { title: 'Olá' },
      { title: 'Mundo' },
    ]);
    // ids and types still key on the published sections
    expect(out.sections.map((s) => s._id)).toEqual(['a', 'b']);
  });

  it('falls back to English when the locale is missing', () => {
    const out = localizePageForVisitor(basePage(), 'pl', 'en');
    expect(out.title).toBe('Stay with us');
    expect(out.sections[0].data.content).toEqual({ title: 'Hello' });
  });

  it('keeps English sections when a translation is stale', () => {
    const page = basePage();
    page.localizations!.pt!.sections = [hero('Olá', 'a')];
    const out = localizePageForVisitor(page, 'pt', 'en');
    expect(out.title).toBe('Fique connosco');
    expect(out.sections).toHaveLength(2);
    expect(out.sections[0].data.content).toEqual({ title: 'Hello' });
  });
});
