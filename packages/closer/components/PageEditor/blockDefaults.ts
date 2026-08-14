import type { PageDoc, PageSection, SectionType } from '../../types/page';
import { sanitizeSection } from './sectionValidation';

export const newLocalId = () =>
  `l_${Math.random().toString(36).slice(2, 11)}`;

export const isEmptySectionContent = (content: unknown): boolean => {
  if (content == null || typeof content !== 'object' || Array.isArray(content)) {
    return true;
  }
  return Object.keys(content as Record<string, unknown>).length === 0;
};

export const hydrateSectionData = (
  section: PageSection,
): Record<string, unknown> => {
  const data = (section.data as Record<string, unknown>) ?? {};
  if (!isEmptySectionContent(data.content)) {
    return data;
  }
  const defaults = createSection(section.type);
  const defaultData = (defaults.data as Record<string, unknown>) ?? {};
  if (isEmptySectionContent(defaultData.content)) {
    return data;
  }
  return {
    ...data,
    content: defaultData.content,
    settings: {
      ...((defaultData.settings as Record<string, unknown>) ?? {}),
      ...((data.settings as Record<string, unknown>) ?? {}),
    },
  };
};

export const commitHydratedSectionEdit = (
  section: PageSection,
  nextHydrated: Record<string, unknown>,
): Record<string, unknown> => {
  const originalData = (section.data as Record<string, unknown>) ?? {};
  if (!isEmptySectionContent(originalData.content)) {
    return nextHydrated;
  }
  const defaults = createSection(section.type);
  const defaultContent = (defaults.data as Record<string, unknown>)?.content;
  const nextContent = nextHydrated.content;
  const contentMatchesDefaults =
    JSON.stringify(nextContent ?? null) ===
    JSON.stringify(defaultContent ?? null);
  if (!contentMatchesDefaults) {
    return nextHydrated;
  }
  return {
    ...nextHydrated,
    content: originalData.content ?? {},
    settings: {
      ...((originalData.settings as Record<string, unknown>) ?? {}),
      ...((nextHydrated.settings as Record<string, unknown>) ?? {}),
    },
  };
};

export const ensureSectionIds = (sections: PageSection[]): PageSection[] =>
  sections.map((s) => ({
    ...s,
    _localId: s._localId ?? newLocalId(),
  }));

export const mergeSectionLocalIds = (
  prev: PageSection[],
  next: PageSection[],
): PageSection[] => {
  const prevById = new Map(
    prev
      .filter((p): p is PageSection & { _id: string } => Boolean(p._id))
      .map((p) => [p._id, p]),
  );
  const usedLocalIds = new Set<string>();

  return next.map((s, i) => {
    if (s._id) {
      const hit = prevById.get(s._id);
      if (hit?._localId && !usedLocalIds.has(hit._localId)) {
        usedLocalIds.add(hit._localId);
        return { ...s, _localId: hit._localId };
      }
    }
    if (prev.length === next.length) {
      const candidate = prev[i]?._localId;
      if (candidate && !usedLocalIds.has(candidate)) {
        usedLocalIds.add(candidate);
        return { ...s, _localId: candidate };
      }
    }
    const localId = s._localId && !usedLocalIds.has(s._localId)
      ? s._localId
      : newLocalId();
    usedLocalIds.add(localId);
    return { ...s, _localId: localId };
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
    title: page.title,
    slug: page.slug,
    description: page.description ?? '',
    ogImage: page.ogImage ?? '',
    sections,
    showInMenu: page.showInMenu === true,
    menuLabel: page.menuLabel ?? '',
    menuSection: page.menuSection ?? '',
    menuSectionOrder: Number.isFinite(page.menuSectionOrder)
      ? page.menuSectionOrder
      : 0,
    menuOrder: Number.isFinite(page.menuOrder) ? page.menuOrder : 0,
  };
  if (page._id && !String(page._id).startsWith('std:')) {
    out._id = page._id;
  }
  if (page.aiMeta !== undefined) out.aiMeta = page.aiMeta;
  return out;
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
            body: 'Supporting line.',
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
    case 'timeline':
      return {
        _localId,
        type: 'timeline',
        data: {
          settings: {},
          content: {
            title: 'Pathway',
            description: '',
            items: [
              {
                phase: '01',
                title: 'First step',
                text: '<p>Describe this step.</p>',
                status: 'current',
              },
              {
                phase: '02',
                title: 'Second step',
                text: '<p>Describe this step.</p>',
                status: 'upcoming',
              },
            ],
          },
        },
      };
    case 'collapsibleFaq':
      return {
        _localId,
        type: 'collapsibleFaq',
        data: {
          settings: {},
          content: {
            title: 'FAQ',
            description: '',
            items: [
              {
                title: 'First question?',
                text: 'A clear, short answer.',
              },
              {
                title: 'Second question?',
                text: 'A clear, short answer.',
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
    case 'bookAStay':
      return {
        _localId,
        type: 'bookAStay',
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
    case 'upcomingEvents':
      return {
        _localId,
        type: 'upcomingEvents',
        data: {
          settings: {},
          content: {},
        },
      };
    case 'pastEvents':
      return {
        _localId,
        type: 'pastEvents',
        data: {
          settings: {},
          content: {},
        },
      };
    case 'eventsCalendar':
      return {
        _localId,
        type: 'eventsCalendar',
        data: {
          settings: {
            showCreateCta: true,
            upcomingLimit: 100,
            pastLimit: 50,
          },
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
            eyebrow: 'Fundraising campaign',
            title: 'Help Build Traditional Dream Factory',
            description:
              'Join mission-aligned supporters funding core infrastructure for a regenerative village.',
            ctaText: 'Support TDF',
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
            ctaLink: '/token/before-you-begin',
          },
        },
      };
    case 'floatingBuyTokens':
      return {
        _localId,
        type: 'floatingBuyTokens',
        data: {
          settings: {},
          content: {
            title: 'Buy Tokens',
            ctaText: 'Buy Tokens',
          },
        },
      };
    case 'supplyGraph':
      return {
        _localId,
        type: 'supplyGraph',
        data: { settings: {}, content: {} },
      };
    case 'priceHistory':
      return {
        _localId,
        type: 'priceHistory',
        data: { settings: {}, content: {} },
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
    case 'citizenProgressBar':
      return {
        _localId,
        type: 'citizenProgressBar',
        data: {
          settings: { citizenTarget: 300 },
          content: { title: 'Citizens joined' },
        },
      };
    case 'citizenshipStatus':
      return {
        _localId,
        type: 'citizenshipStatus',
        data: {
          settings: { showBalances: true },
          content: {
            title: '',
            description: '',
            ctaText: '',
            ctaLink: '/citizenship/why',
            items: [],
          },
        },
      };
    case 'financedTokensStart':
      return {
        _localId,
        type: 'financedTokensStart',
        data: {
          settings: {},
          content: {
            title: 'Financed Tokens — Flexible Entry',
            description: '',
            items: [
              'Available for citizenship (30, 60, 90, 120 token plans over 36 months).',
              '10% downpayment, 5% above bonding curve price.',
              'Instant utility unlocked from all tokens.',
            ],
            ctaText: 'Start Financed Plan',
            ctaLink: '/token/finance',
          },
        },
      };
    case 'cohousingApplication':
      return {
        _localId,
        type: 'cohousingApplication',
        data: {
          settings: {},
          content: {
            title: 'Ready to Join?',
            description:
              "We're running a co-housing program for the first cohort now. Join the waitlist to be notified when applications open.",
            ctaText: 'Open your application',
            ctaLink: '/cohousing/application',
          },
        },
      };
    case 'listingsPreviews':
      return {
        _localId,
        type: 'listingsPreviews',
        data: {
          settings: {},
          content: { title: 'Chose your accommodation' },
        },
      };
    case 'reviews':
      return {
        _localId,
        type: 'reviews',
        data: {
          settings: { shuffle: true, limit: 3 },
          content: {
            title: "Words from people who've stayed",
            items: [
              {
                name: 'Daria',
                content:
                  'TDF feels like a healing sanctuary in connection with nature — a playground for dreamers and a home for community.',
                photo: '/images/reviews/daria.jpg',
              },
              {
                name: 'Charlotte',
                content: 'One of my favorite ecovillage projects out there!',
                photo: '/images/reviews/charlotte.png',
              },
              {
                name: 'Kyle',
                content:
                  'A place for bohemian makers, the intersection of Permaculture and crypto. My kind of place.',
                photo: '/images/reviews/kyle.png',
              },
            ],
          },
        },
      };
    case 'volunteerCta':
      return {
        _localId,
        type: 'volunteerCta',
        data: {
          settings: {},
          content: {
            title: 'Volunteers Open Call',
            description:
              'We are excited to extend an invitation to join us at the Traditional Dream Factory, a regenerative farm and co-living development in Abela, Alentejo, Portugal.',
            ctaText: 'Apply',
            ctaLink: '/volunteer/apply',
          },
        },
      };
    case 'projectList':
      return {
        _localId,
        type: 'projectList',
        data: {
          settings: { showInProgress: true, showCompleted: true },
          content: {
            title: 'Build projects',
            inProgressTitle: 'In progress',
            completedTitle: 'Completed',
          },
        },
      };
    case 'dailyContribution':
      return {
        _localId,
        type: 'dailyContribution',
        data: {
          settings: {
            bookingContext: 'volunteer',
            showAccommodation: true,
          },
          content: {
            title: 'Daily contribution',
            description:
              'A daily contribution helps keep everything running. VAT included. In return for your work hours you receive a dorm bed, a camping spot or a van parking spot, and you will be fed really well.',
            foodLabel: 'Food',
            utilitiesLabel: 'Utilities',
            accommodationLabel: 'Accommodation',
            totalLabel: 'Total',
            freeLabel: 'Free',
            perDayLabel: 'per day',
            selectionLabel: 'Selection',
          },
        },
      };
    case 'subscriptionPlans':
      return {
        _localId,
        type: 'subscriptionPlans',
        data: { settings: {}, content: {} },
      };
    case 'fundraiserProgress':
      return {
        _localId,
        type: 'fundraiserProgress',
        data: { settings: {}, content: {} },
      };
    case 'fundraiserMilestones':
      return {
        _localId,
        type: 'fundraiserMilestones',
        data: { settings: {}, content: {} },
      };
    case 'fundraiserRewards':
      return {
        _localId,
        type: 'fundraiserRewards',
        data: { settings: {}, content: {} },
      };
    case 'teamStructure':
      return {
        _localId,
        type: 'teamStructure',
        data: {
          settings: {},
          content: {
            items: [
              {
                icon: 'landmark',
                title: 'OASA Association',
                description:
                  'Swiss non-profit overseeing land conservation and governance across the network',
              },
              {
                icon: 'vote',
                title: 'TDF DAO',
                description:
                  'Community governance through token holders, citizens, and the citizen assembly',
              },
              {
                icon: 'zap',
                title: 'Executive Team',
                description:
                  'Day-to-day operations, development, and strategic direction',
              },
            ],
          },
        },
      };
    case 'teamMembers':
      return {
        _localId,
        type: 'teamMembers',
        data: {
          settings: {},
          content: {
            eyebrow: 'Executive Team',
            title: 'Leadership',
            description:
              'Strategic real estate development and operational direction given by the DAO.',
            members: [
              {
                name: 'Samuel Delesque',
                role: 'Executive Director',
                bio: 'Franco-Danish entrepreneur and former software engineer. Founded TDF with a vision of moving "from ownership to stewardship."',
                twitterUrl: 'https://twitter.com/samdelesque',
                linkedinUrl: 'https://www.linkedin.com/in/samdelesque/',
              },
            ],
          },
        },
      };
    case 'teamDepartments':
      return {
        _localId,
        type: 'teamDepartments',
        data: {
          settings: {},
          content: {
            eyebrow: 'Operations',
            title: 'On-the-Ground Teams',
            description: 'The people making magic happen every day at TDF.',
            departments: [
              {
                title: 'Hospitality Team',
                subtitle: 'Assembled over 2026',
                description:
                  'Run a profitable rural tourism operation with high guest satisfaction.',
                members: [
                  {
                    name: 'Luna Mangan',
                    role: 'Hospitality Manager',
                  },
                  {
                    name: 'Kitchen Lead',
                    role: 'Position open',
                    isOpen: true,
                  },
                  {
                    name: 'Kitchen Support',
                    role: 'Position open',
                    isOpen: true,
                  },
                  {
                    name: 'Housekeeping',
                    role: '2 positions',
                    isOpen: true,
                  },
                  {
                    name: 'Maintenance',
                    role: '0.5x position',
                    isOpen: true,
                  },
                ],
              },
              {
                title: 'Ecology & Food Production',
                description:
                  'Produce food for 50+ people, increase soil fertility, and retain water (OASA metrics).',
                members: [
                  {
                    name: 'Ofer Carmon',
                    role: 'Land Steward',
                  },
                  {
                    name: 'Joao Baranov',
                    role: 'Land Steward',
                  },
                  {
                    name: 'Land Steward',
                    role: '1 additional position',
                    isOpen: true,
                  },
                  {
                    name: 'Volunteers',
                    role: '2 rotating positions',
                    isOpen: true,
                  },
                ],
              },
              {
                title: 'Internal Build Team',
                description:
                  'Create unique accommodations and beautify the land for human use.',
                members: [
                  {
                    name: 'Julia Aust',
                    role: 'Carpentry',
                  },
                ],
              },
              {
                title: 'Mushroom Farm',
                description:
                  'Produce edible mushrooms for 3 restaurants and medicinal products.',
                members: [
                  {
                    name: 'Richard Olson',
                    role: 'Mycology Lead (0.25x)',
                  },
                  {
                    name: 'Tonya Gorman',
                    role: 'Mycology Ops (1x)',
                  },
                  {
                    name: 'Mycology Assistants',
                    role: '2 positions',
                    isOpen: true,
                  },
                ],
              },
            ],
          },
        },
      };
    case 'teamPartners':
      return {
        _localId,
        type: 'teamPartners',
        data: {
          settings: {},
          content: {
            eyebrow: 'Partners & Contractors',
            title: 'External Partners',
            description:
              'Professional partners and service providers supporting TDF and OASA.',
            partners: [
              { name: 'Coin Finance', role: 'Token & Web3' },
              { name: 'Lars Schlichting', role: 'Legal' },
              { name: 'CRU Architecture', role: 'Architecture' },
              { name: 'SCARD', role: 'Engineering' },
              { name: 'White Rabbit', role: 'Development' },
              { name: 'Kinterra', role: 'Regenerative systems sourcing' },
              { name: 'TBD Construction', role: 'Construction' },
              { name: 'CAAC Accounting', role: 'Accounting' },
              { name: 'Start PME', role: 'Grant Support' },
              { name: 'Fieldfisher Law', role: 'Legal (PT)' },
              { name: 'Crédito Agrícola', role: 'Banking' },
            ],
          },
        },
      };
    case 'teamGovernance':
      return {
        _localId,
        type: 'teamGovernance',
        data: {
          settings: {},
          content: {
            eyebrow: 'Governance',
            title: 'TDF DAO',
            description:
              'Decentralized governance through our token holder community.',
            items: [
              {
                title: 'Citizens',
                description:
                  'Members who have completed the onboarding process and embody TDF values.',
              },
              {
                title: 'Citizen Assembly',
                description:
                  'Regular gatherings to discuss proposals and shape the community direction.',
              },
              {
                title: 'Treasury',
                description:
                  'Community-controlled funds for development and operations.',
              },
              {
                title: '$TDF Token Holders',
                description:
                  '280+ holders with governance rights and accommodation access.',
              },
              {
                title: '$SWEAT Holders',
                description:
                  'Contributors rewarded with tokens for work on the project.',
              },
              {
                title: '$PRESENCE Holders',
                description:
                  'Proof of presence tokens earned through time spent at TDF.',
              },
            ],
            governsTitle: 'What TDF DAO Governs',
            governsItems: [
              'Game Guide (living agreement)',
              'Land Plan (build master plan)',
              'Executive team elections',
            ],
          },
        },
      };
    case 'teamJoinCta':
      return {
        _localId,
        type: 'teamJoinCta',
        data: {
          settings: {},
          content: {
            title: 'Join the Team',
            description:
              "We're always looking for passionate people to join our regenerative community. Whether as a steward, volunteer, or contributor.",
            primaryText: 'View Open Positions',
            primaryLink: '/roles',
            secondaryText: 'Volunteer Program',
            secondaryLink: '/volunteer',
          },
        },
      };
    case 'pressStats':
      return {
        _localId,
        type: 'pressStats',
        data: {
          settings: {},
          content: {
            items: [
              {
                value: '80+',
                label: 'Press Articles',
              },
              {
                value: '40+',
                label: 'Portuguese Media',
              },
              {
                value: '25+',
                label: 'Spanish Media',
              },
              {
                value: '7',
                label: 'Podcast Appearances',
              },
            ],
          },
        },
      };
    case 'pressPublications':
      return {
        _localId,
        type: 'pressPublications',
        data: {
          settings: {},
          content: {
            eyebrow: 'Featured in',
            items: [
              { name: 'Expresso' },
              { name: 'Forbes Portugal' },
              { name: 'Diário de Notícias' },
              { name: 'Jornal Económico' },
              { name: 'EFE Verde' },
              { name: 'Idealista' },
            ],
          },
        },
      };
    case 'pressHighlights':
      return {
        _localId,
        type: 'pressHighlights',
        data: {
          settings: {},
          content: {
            eyebrow: 'Highlight Coverage',
            items: [
              {
                outlet: 'Expresso',
                date: 'June 26, 2025',
                title: 'Nómadas digitais criam aldeia tecnológica no Alentejo',
                url: 'https://expresso.pt/economia/economia_imobiliario/2025-06-26-nomadas-digitais-criam-aldeia-tecnologica-no-alentejo-354f740a',
              },
              {
                outlet: 'Forbes Portugal',
                date: 'August 26, 2025',
                title:
                  'Portugal é o sétimo destino favorito dos nómadas digitais',
                url: 'https://www.forbespt.com/portugal-e-o-setimo-destino-favorito-dos-nomadas-digitais/',
              },
              {
                outlet: 'Diário de Notícias',
                date: 'August 24, 2025',
                title:
                  'Alentejo vê nascer primeira aldeia regenerativa da Europa financiada com tokens',
                url: 'https://www.dn.pt/edicao-impressa/alentejo-v%C3%AA-nascer-primeira-aldeia-regenerativa-da-europa-financiada-com-tokens',
              },
              {
                outlet: 'EFE Verde',
                date: 'September 21, 2025',
                title:
                  'Regenerar para avanzar: el futuro del campo pasa por la innovación social y ecológica',
                url: 'https://efeverde.com/regenerar-para-avanzar-el-futuro-del-campo-pasa-por-la-innovacion-social-y-ecologica-por-samuel-delesque-traditional-dream-factory-tdf/',
              },
              {
                outlet: 'Idealista',
                date: 'December 18, 2025',
                title:
                  'Primeira aldeia regenerativa tokenizada da Europa nasce no Alentejo',
                url: 'https://www.idealista.pt/news/imobiliario/habitacao/2025/12/18/73120-primeira-aldeia-regenerativa-tokenizada-da-europa-nasce-no-alentejo',
              },
              {
                outlet: 'Jornal Económico',
                date: '2025',
                title: '48% dos portugueses sonham trocar a cidade pelo campo',
                url: 'https://jornaleconomico.sapo.pt/noticias/48-dos-portugueses-sonham-trocar-a-cidade-pelo-campo/',
              },
            ],
          },
        },
      };
    case 'pressPodcasts':
      return {
        _localId,
        type: 'pressPodcasts',
        data: {
          settings: {},
          content: {
            eyebrow: 'Podcast appearances',
            description:
              'Founder Samuel Delesque on regenerative finance and village building.',
            items: [
              {
                title: 'Green Planet Blue Planet',
                date: 'January 2023 • 44 min',
                url: 'https://podcasts.apple.com/gb/podcast/ep-322-sam-delesque-regenerative-entrepreneur-developing/id1265643891?i=1000595309300',
              },
              {
                title: 'ReFi Podcast',
                date: 'October 2023 • 55 min',
                url: 'https://blog.refidao.com/building-regenerative-villages-with-samuel-delesque-season-3-episode-8/',
              },
              {
                title: 'Crypto Altruism',
                date: 'January 2023',
                url: 'https://www.cryptoaltruism.org/blog/crypto-altruism-podcast-episode84-oasa-using-web3-to-build-for-a-regenerative-future',
              },
              {
                title: 'The Blockchain Socialist',
                date: 'January 2024',
                url: 'https://theblockchainsocialist.com/a-regenerative-village-as-a-dao-in-portugal-traditional-dream-factory/',
              },
              {
                title: 'The New Movement',
                date: '42 min',
                url: 'https://thenewmvt.com/podcast/sam-delesque/',
              },
              {
                title: 'Primal Gathering',
                date: 'November 2021 • 59 min',
                url: 'https://podcasts.apple.com/ng/podcast/from-ownership-to-stewardship-samuel-delesque-founder/id1591874552?i=1000540529193',
              },
            ],
          },
        },
      };
    case 'pressContact':
      return {
        _localId,
        type: 'pressContact',
        data: {
          settings: {},
          content: {
            title: 'Press Contact',
            description:
              'For media inquiries, interview requests, or press materials, please contact:',
            email: 'press@traditionaldreamfactory.com',
          },
        },
      };
    case 'dataroom':
      return {
        _localId,
        type: 'dataroom',
        data: {
          settings: {},
          content: {
            heroEyebrow: 'Data Room',
            heroTitle: 'Finance Pioneering Regenerative Tourism in Portugal',
            heroDescription:
              '€450,000 private debt offering | 5% annual interest | 4-year term. Secured by a pledge over shares in the asset-holding SPV (Enseada Sonhadora S.A.), with an optional token conversion feature.',
            stats: [
              {
                value: '€450K',
                label: 'Private Debt Raise',
              },
              {
                value: '€1.24M',
                label: 'Construction Budget',
              },
              {
                value: '€653k',
                label: '2028 Revenue (Base Case)',
              },
              {
                value: '25ha',
                label: 'Diverse Real Estate Portfolio',
              },
            ],
            loanTerms: [
              { value: '€450K', label: 'Total Raise' },
              { value: '5%', label: 'Fixed Annual Rate' },
              { value: '4 yr', label: 'Term' },
              { value: '€50K', label: 'Minimum Ticket' },
            ],
            documents: [
              {
                title: 'Financial Model (XLSX)',
                href: '/dataroom/tdf-financial-plan.xlsx',
                downloadLabel: 'Download file →',
              },
              {
                title: 'Area Map (KML)',
                href: '/dataroom/tdf-area-map.kml',
                downloadLabel: 'Download file →',
              },
              {
                title: 'Architecture Package (PDF)',
                href: '/dataroom/tdf-architecture.pdf',
                downloadLabel: 'Download PDF →',
              },
              {
                title: '2021 Annual Report',
                href: '/pdf/2021-TDF-report.pdf',
                downloadLabel: 'Download PDF →',
              },
              {
                title: '2022 Annual Report',
                href: '/pdf/2022-TDF-report.pdf',
                downloadLabel: 'Download PDF →',
              },
              {
                title: '2024 Annual Report',
                href: '/pdf/2024-TDF-report.pdf',
                downloadLabel: 'Download PDF →',
              },
              {
                title: '2025 Annual Report',
                href: '/pdf/2025-TDF-report.pdf',
                downloadLabel: 'Download PDF →',
              },
            ],
            partners: [
              { name: 'CRU Architecture', role: 'Architecture' },
              { name: 'SCARD', role: 'Engineering' },
              { name: 'Coin Finance', role: 'Token & Web3' },
              { name: 'CAAC', role: 'Accounting' },
              { name: 'Fieldfisher', role: 'Legal (PT)' },
              { name: 'Lars Schlichting', role: 'Legal (CH)' },
              { name: 'Start PME', role: 'Grant Support' },
              { name: 'Crédito Agrícola', role: 'Banking' },
              { name: 'White Rabbit', role: 'Marketing & PR' },
              { name: 'Kinterra', role: 'Regen Systems' },
            ],
            webinarTags: ['dataroom', 'investor-webinar'],
            webinarAnalyticsCategory: 'Dataroom',
          },
        },
      };
    case 'emailGate':
      return {
        _localId,
        type: 'emailGate',
        data: {
          settings: { placement: 'dataroom' },
          content: {
            eyebrow: '',
            title: 'Unlock the full page',
            description: 'Enter your email to access the rest of this page.',
            ctaText: 'Get access',
          },
        },
      };
    case 'dataTable':
      return {
        _localId,
        type: 'dataTable',
        data: {
          settings: { isCompact: false },
          content: {
            eyebrow: '',
            title: 'Table',
            description: '',
            columns: [
              { label: 'Item', align: 'left' },
              { label: 'Amount', align: 'right' },
            ],
            rows: [
              {
                cells: [
                  { text: 'First item', note: '' },
                  { text: '€0', note: '' },
                ],
              },
              {
                cells: [
                  { text: 'Second item', note: '' },
                  { text: '€0', note: '' },
                ],
              },
            ],
            footer: {
              cells: [{ text: 'Total' }, { text: '€0' }],
            },
            note: '',
          },
        },
      };
    case 'documents':
      return {
        _localId,
        type: 'documents',
        data: {
          settings: { numColumns: 4 },
          content: {
            eyebrow: '',
            title: 'Documents',
            description: '',
            items: [
              {
                title: 'Document',
                href: '',
                downloadLabel: 'Download PDF →',
                icon: 'fileText',
              },
            ],
          },
        },
      };
    case 'barChart':
      return {
        _localId,
        type: 'barChart',
        data: {
          settings: {},
          content: {
            eyebrow: '',
            title: 'Projection',
            description: '',
            items: [
              { label: '2026', value: '€100k', amount: 100 },
              { label: '2027', value: '€150k', amount: 150 },
              { label: '2028', value: '€200k', amount: 200 },
            ],
            note: '',
          },
        },
      };
    case 'flowDiagram':
      return {
        _localId,
        type: 'flowDiagram',
        data: {
          settings: {},
          content: {
            eyebrow: '',
            title: 'Structure',
            description: '',
            nodes: [
              {
                title: 'Parent entity',
                subtitle: '',
                connectorLabel: '',
                icon: 'landmark',
                style: 'default',
              },
              {
                title: 'Subsidiary',
                subtitle: '',
                connectorLabel: 'holds equity in',
                icon: 'building',
                style: 'dark',
              },
            ],
            note: '',
          },
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
