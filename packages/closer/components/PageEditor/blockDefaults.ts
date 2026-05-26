import type { PageDoc, PageSection, SectionType } from '../../types/page';
import { sanitizeSection } from './sectionValidation';

export const newLocalId = () =>
  `l_${Math.random().toString(36).slice(2, 11)}`;

export const ensureSectionIds = (sections: PageSection[]): PageSection[] =>
  sections.map((s) => ({
    ...s,
    _localId: s._localId ?? newLocalId(),
  }));

export const mergeSectionLocalIds = (
  prev: PageSection[],
  next: PageSection[],
): PageSection[] => {
  if (prev.length === next.length) {
    return next.map((s, i) => ({
      ...s,
      _localId: prev[i]._localId ?? s._localId ?? newLocalId(),
    }));
  }
  const prevById = new Map(
    prev.filter((p): p is PageSection & { _id: string } => Boolean(p._id)).map(
      (p) => [p._id, p],
    ),
  );
  return next.map((s) => {
    if (s._id) {
      const hit = prevById.get(s._id);
      if (hit?._localId) return { ...s, _localId: hit._localId };
    }
    return { ...s, _localId: s._localId ?? newLocalId() };
  });
};

export const stripForApi = (page: PageDoc): Record<string, unknown> => {
  const sections = (page.sections ?? []).map((section) => {
    const sanitized = sanitizeSection(section);
    const { _localId: _l, _id, type, data } = sanitized;
    const payload: Record<string, unknown> = { type, data };
    if (_id) payload._id = _id;
    return payload;
  });
  const out: Record<string, unknown> = {
    _id: page._id,
    title: page.title,
    slug: page.slug,
    description: page.description ?? '',
    ogImage: page.ogImage ?? '',
    sections,
  };
  if (page.aiMeta !== undefined) out.aiMeta = page.aiMeta;
  return out;
};

const heroAlignMap = {
  left: 'bottom-left' as const,
  right: 'bottom-right' as const,
  full: 'bottom-left' as const,
};

export const createSection = (type: SectionType): PageSection => {
  const _localId = newLocalId();
  switch (type) {
    case 'hero':
      return {
        _localId,
        type: 'hero',
        data: {
          settings: {
            alignText: 'center' as const,
            isInverted: false,
            isCompact: false,
          },
          content: {
            title: 'Headline',
            body: '<p>Supporting line.</p>',
            imageUrl: '',
            cta: { text: 'Learn more', url: '#' },
          },
        },
      };
    case 'gallery':
      return {
        _localId,
        type: 'gallery',
        data: {
          settings: { size: 'standard' as const },
          content: {
            title: 'Gallery',
            items: [
              {
                imageUrl: 'https://cdn.oasa.co/tdf/tdf-invest-og.jpg',
                width: 800,
                height: 600,
                alt: '',
              },
              {
                imageUrl: 'https://cdn.oasa.co/tdf/tdf-invest-og.jpg',
                width: 800,
                height: 600,
                alt: '',
              },
            ],
          },
        },
      };
    case 'testimonials':
      return {
        _localId,
        type: 'testimonials',
        data: {
          settings: {},
          content: {
            eyebrow: '',
            title: 'What people say',
            items: [
              {
                quote: 'A genuinely wonderful experience.',
                name: 'Anonymous',
                role: '',
                avatar: '',
              },
            ],
          },
        },
      };
    case 'stats':
      return {
        _localId,
        type: 'stats',
        data: {
          settings: {},
          content: {
            eyebrow: '',
            title: 'By the numbers',
            items: [
              { value: '100', label: 'First metric' },
              { value: '50%', label: 'Second metric' },
            ],
          },
        },
      };
    case 'features':
      return {
        _localId,
        type: 'features',
        data: {
          settings: {
            numColumns: 3,
            isSmallImage: true,
            isColorful: false,
          },
          content: {
            title: 'What we offer',
            description: '',
            items: [
              {
                title: 'First feature',
                text: '<p>A short description of this feature.</p>',
                imageUrl: '',
                visualType: 'none' as const,
              },
              {
                title: 'Second feature',
                text: '<p>A short description of this feature.</p>',
                imageUrl: '',
                visualType: 'none' as const,
              },
            ],
          },
        },
      };
    case 'richText':
      return {
        _localId,
        type: 'richText',
        data: {
          settings: { isColorful: false },
          content: { html: '<p>Write your content here.</p>' },
        },
      };
    case 'media':
      return {
        _localId,
        type: 'media',
        data: {
          settings: { mediaType: 'image' as const },
          content: {
            imageUrl: '',
            videoEmbedId: '',
            alt: '',
            caption: '',
          },
        },
      };
    case 'textBlock':
      return {
        _localId,
        type: 'textBlock',
        data: {
          settings: { imagePosition: 'left' as const },
          content: {
            title: 'Section title',
            body: 'Write your text here.\n\n- First point\n- Second point\n\nUse **bold** or *italic* for emphasis.',
            imageUrl: '',
            imageAlt: '',
          },
        },
      };
    case 'staySearch':
      return {
        _localId,
        type: 'staySearch',
        data: {
          settings: {},
          content: {
            title: 'Book your stay',
            subtitle: 'Find available dates and accommodations.',
          },
        },
      };
    case 'cta':
      return {
        _localId,
        type: 'cta',
        data: {
          settings: { style: 'default' },
          content: {
            eyebrow: '',
            title: 'Take the next step',
            text: 'A short line that motivates the click.',
            primaryText: 'Get started',
            primaryLink: '#',
            secondaryText: '',
            secondaryLink: '',
          },
        },
      };
    case 'events':
      return {
        _localId,
        type: 'events',
        data: {
          settings: {},
          content: {},
        },
      };
    case 'fundraiser':
      return {
        _localId,
        type: 'fundraiser',
        data: {
          settings: { showTitle: true },
          content: {
            eyebrow: '',
            title: '',
            description: '',
            ctaText: '',
            ctaLink: '/fundraiser',
          },
        },
      };
    case 'tokenStats':
      return {
        _localId,
        type: 'tokenStats',
        data: {
          settings: { showCta: true },
          content: {
            eyebrow: '',
            title: '',
            description: '',
            ctaText: '',
            ctaLink: '/token',
          },
        },
      };
    case 'webinar':
      return {
        _localId,
        type: 'webinar',
        data: {
          settings: {
            tags: ['landing-page', 'investor-webinar'],
            analyticsCategory: 'CustomPage',
          },
          content: {},
        },
      };
    default:
      return {
        _localId,
        type: 'richText',
        data: {
          settings: { isColorful: false },
          content: { html: '<p></p>' },
        },
      };
  }
};
