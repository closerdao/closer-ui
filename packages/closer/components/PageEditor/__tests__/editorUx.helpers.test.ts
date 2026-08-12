import {
  commitHydratedSectionEdit,
  createSection,
  hydrateSectionData,
} from '../blockDefaults';
import type { PageSection } from '../../../types/page';
import { buildNewPagePayload } from '../NewPageDialog';

describe('createSection', () => {
  it('creates a hero with local id and placeholder content', () => {
    const section = createSection('hero');
    expect(section.type).toBe('hero');
    expect(section._localId?.startsWith('l_')).toBe(true);
    expect(
      (section.data as { content: { title: string } }).content.title,
    ).toBe('Headline');
  });
});

describe('hydrateSectionData + commitHydratedSectionEdit', () => {
  it('hydrates empty content for display without writing defaults on settings-only edits', () => {
    const section = {
      _localId: 'l1',
      type: 'hero',
      data: { content: {}, settings: { isCompact: true } },
    } as PageSection;

    const hydrated = hydrateSectionData(section);
    expect(
      (hydrated.content as { title: string }).title,
    ).toBe('Headline');

    const settingsOnly = {
      ...hydrated,
      settings: { ...(hydrated.settings as object), isInverted: true },
    };
    const committed = commitHydratedSectionEdit(section, settingsOnly);
    expect(committed.content).toEqual({});
    expect((committed.settings as { isInverted: boolean }).isInverted).toBe(
      true,
    );
    expect((committed.settings as { isCompact: boolean }).isCompact).toBe(
      true,
    );
  });

  it('persists content when the user edits hydrated fields', () => {
    const section = {
      _localId: 'l1',
      type: 'hero',
      data: { content: {} },
    } as PageSection;
    const hydrated = hydrateSectionData(section);
    const edited = {
      ...hydrated,
      content: {
        ...(hydrated.content as object),
        title: 'Custom title',
      },
    };
    const committed = commitHydratedSectionEdit(section, edited);
    expect((committed.content as { title: string }).title).toBe(
      'Custom title',
    );
  });
});

describe('buildNewPagePayload', () => {
  it('keeps the form slug when advanced JSON tries to override it', () => {
    const payload = buildNewPagePayload({
      title: 'My page',
      description: '',
      slug: '/my-page',
      customData: {
        slug: '/token',
        title: 'Ignored title override for slug test',
        sections: [],
      },
    });
    expect(payload.slug).toBe('/my-page');
  });
});
