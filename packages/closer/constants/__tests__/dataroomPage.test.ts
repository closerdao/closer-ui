import { createSection } from '../../components/PageEditor/blockDefaults';
import { STANDARD_PAGE_DEFAULTS } from '../standardPages';

import type { SectionType } from '../../types/page';

const sections = STANDARD_PAGE_DEFAULTS['/dataroom'].sections;

const settingsOf = (section: { data: Record<string, unknown> }) =>
  (section.data.settings as Record<string, unknown>) ?? {};

describe('/dataroom default page', () => {
  it('is composed of reusable blocks rather than one dataroom block', () => {
    expect(sections.length).toBeGreaterThan(10);
    expect(sections.some((s) => s.type === 'dataroom')).toBe(false);
  });

  it('only uses block types the renderer knows', () => {
    const known = new Set([
      'hero',
      'stats',
      'emailGate',
      'features',
      'textBlock',
      'flowDiagram',
      'dataTable',
      'barChart',
      'cta',
      'timeline',
      'teamMembers',
      'teamPartners',
      'documents',
      'webinar',
    ]);
    const unexpected = sections
      .map((s) => s.type)
      .filter((type) => !known.has(type));
    expect(unexpected).toEqual([]);
  });

  it('gates the investor content behind the email gate', () => {
    const gateIndex = sections.findIndex((s) => s.type === 'emailGate');
    expect(gateIndex).toBeGreaterThan(-1);

    const gatedIndexes = sections
      .map((section, index) => ({ index, gated: settingsOf(section).gatedByEmail }))
      .filter(({ gated }) => gated === true)
      .map(({ index }) => index);

    expect(gatedIndexes.length).toBeGreaterThan(0);
    expect(Math.min(...gatedIndexes)).toBeGreaterThan(gateIndex);
    // The hero, the gate itself and the closing webinar/CTA stay public.
    expect(settingsOf(sections[0]).gatedByEmail).toBeUndefined();
    expect(settingsOf(sections[gateIndex]).gatedByEmail).toBeUndefined();
  });

  it('keeps every table row aligned with its columns', () => {
    sections
      .filter((s) => s.type === 'dataTable')
      .forEach((section) => {
        const content = section.data.content as {
          columns?: unknown[];
          rows?: { cells?: unknown[] }[];
          footer?: { cells?: unknown[] };
        };
        const columnCount = content.columns?.length ?? 0;
        expect(columnCount).toBeGreaterThan(0);
        (content.rows ?? []).forEach((row) => {
          expect(row.cells?.length).toBe(columnCount);
        });
        const footerCells = content.footer?.cells ?? [];
        if (footerCells.length > 0) {
          expect(footerCells.length).toBe(columnCount);
        }
      });
  });
});

describe('createSection for the new blocks', () => {
  const types: SectionType[] = [
    'emailGate',
    'dataTable',
    'documents',
    'barChart',
    'flowDiagram',
  ];

  it.each(types)('returns editable defaults for %s', (type) => {
    const section = createSection(type);
    expect(section.type).toBe(type);
    const content = (section.data as { content: Record<string, unknown> }).content;
    expect(Object.keys(content).length).toBeGreaterThan(0);
  });
});
