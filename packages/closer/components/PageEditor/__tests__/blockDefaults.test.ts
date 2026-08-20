import {
  ensureSectionIds,
  mergeSectionLocalIds,
  newLocalId,
  stripForApi,
} from '../blockDefaults';
import type { PageDoc, PageSection } from '../../../types/page';
import { materializeI18nValue } from '../../../utils/blockI18n';

describe('stripForApi', () => {
  it('omits virtual std: ids and localIds while keeping content keys', () => {
    const page: PageDoc = {
      _id: 'std:/token',
      title: '_i18n_token_sale_hero_epic_heading',
      slug: '/token',
      description: '_i18n_token_sale_hero_epic_subheading',
      ogImage: '',
      sections: [
        {
          _localId: 'l_abc',
          type: 'hero',
          data: {
            settings: { alignText: 'center' },
            content: { title: '_i18n_token_sale_hero_epic_heading' },
          },
        },
      ],
      isStandard: true,
    };

    const payload = stripForApi(page);
    expect(payload._id).toBeUndefined();
    expect(payload.title).toBe('_i18n_token_sale_hero_epic_heading');
    expect(payload.slug).toBe('/token');
    const sections = payload.sections as PageSection[];
    expect(sections).toHaveLength(1);
    expect(sections[0]._localId).toBeUndefined();
    expect(sections[0].type).toBe('hero');
    expect(
      (sections[0].data as { content: { title: string } }).content.title,
    ).toBe('_i18n_token_sale_hero_epic_heading');
  });

  it('keeps real mongo ids on update payloads', () => {
    const page: PageDoc = {
      _id: '507f1f77bcf86cd799439011',
      title: 'Hello',
      slug: '/hello',
      sections: [],
    };
    expect(stripForApi(page)._id).toBe('507f1f77bcf86cd799439011');
  });

  it('does not materialize i18n keys before save', () => {
    const page: PageDoc = {
      _id: '507f1f77bcf86cd799439011',
      title: '_i18n_some_key',
      slug: '/x',
      sections: [
        {
          type: 'textBlock',
          data: { content: { body: '_i18n_body_key' } },
        },
      ],
    };
    const payload = stripForApi(page);
    expect(payload.title).toBe('_i18n_some_key');
    expect(
      ((payload.sections as PageSection[])[0].data as { content: { body: string } })
        .content.body,
    ).toBe('_i18n_body_key');
    expect(
      materializeI18nValue('_i18n_some_key', ((k: string) => `T:${k}`) as never),
    ).not.toBe('_i18n_some_key');
  });
});

describe('mergeSectionLocalIds', () => {
  it('prefers matching by _id over index after reorder', () => {
    const a = { _id: 'a', _localId: 'l1', type: 'hero', data: {} };
    const b = { _id: 'b', _localId: 'l2', type: 'cta', data: {} };
    const prev = [a, b] as PageSection[];
    const next = [
      { _id: 'b', type: 'cta', data: { content: { title: 'x' } } },
      { _id: 'a', type: 'hero', data: {} },
    ] as PageSection[];

    const merged = mergeSectionLocalIds(prev, next);
    expect(merged[0]._localId).toBe('l2');
    expect(merged[1]._localId).toBe('l1');
  });

  it('falls back to index when lengths match and ids are missing', () => {
    const prev = ensureSectionIds([
      { type: 'hero', data: {} },
      { type: 'cta', data: {} },
    ] as PageSection[]);
    const next = [
      { type: 'hero', data: { content: { title: '1' } } },
      { type: 'cta', data: {} },
    ] as PageSection[];
    const merged = mergeSectionLocalIds(prev, next);
    expect(merged[0]._localId).toBe(prev[0]._localId);
    expect(merged[1]._localId).toBe(prev[1]._localId);
  });
});

describe('newLocalId', () => {
  it('returns unique local ids', () => {
    const ids = new Set(Array.from({ length: 20 }, () => newLocalId()));
    expect(ids.size).toBe(20);
    for (const id of ids) {
      expect(id.startsWith('l_')).toBe(true);
    }
  });
});
