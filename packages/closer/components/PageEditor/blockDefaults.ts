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
            eyebrow: '_i18n_invest_hero_label',
            title: '_i18n_invest_hero_title',
            description: '_i18n_invest_hero_subtitle',
            ctaText: '_i18n_prompt_fundraiser_cta',
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
            title: '_i18n_token_sale_public_sale_buy_token',
            ctaText: '_i18n_token_sale_public_sale_buy_token',
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
          content: { title: '_i18n_citizenship_citizens_joined' },
        },
      };
    case 'financedTokensStart':
      return {
        _localId,
        type: 'financedTokensStart',
        data: {
          settings: {},
          content: {
            title: '_i18n_citizenship_financed_tokens_title',
            description: '',
            items: [
              '_i18n_citizenship_financed_tokens_1',
              '_i18n_citizenship_financed_tokens_2',
              '_i18n_citizenship_financed_tokens_3',
            ],
            ctaText: '_i18n_citizenship_start_financed_plan',
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
            title: '_i18n_cohousing_cta_title',
            description: '_i18n_cohousing_cta_subtitle',
            ctaText: '_i18n_cohousing_banner_cta',
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
          content: { title: '_i18n_stay_chose_accommodation' },
        },
      };
    case 'reviews':
      return {
        _localId,
        type: 'reviews',
        data: {
          settings: { shuffle: true, limit: 3 },
          content: {
            title: '_i18n_stay_reviews_title',
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
            title: '_i18n_volunteers_open_call_title',
            description: '_i18n_volunteers_intro_1',
            ctaText: '_i18n_apply_submit_button',
            ctaLink: '/volunteer/apply',
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
            title: '_i18n_daily_contribution_title',
            description: '_i18n_daily_contribution_description',
            foodLabel: '_i18n_daily_contribution_food',
            utilitiesLabel: '_i18n_daily_contribution_utilities',
            accommodationLabel: '_i18n_daily_contribution_accommodation',
            totalLabel: '_i18n_daily_contribution_total',
            freeLabel: '_i18n_daily_contribution_free',
            perDayLabel: '_i18n_daily_contribution_per_day',
            selectionLabel: '_i18n_daily_contribution_selection',
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
                title: '_i18n_team_oasa_association_title',
                description: '_i18n_team_oasa_association_desc',
              },
              {
                icon: 'vote',
                title: '_i18n_team_tdf_dao_title',
                description: '_i18n_team_tdf_dao_desc',
              },
              {
                icon: 'zap',
                title: '_i18n_team_executive_team_title',
                description: '_i18n_team_executive_team_desc',
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
            eyebrow: '_i18n_team_executive_team_label',
            title: '_i18n_team_leadership_title',
            description: '_i18n_team_leadership_desc',
            members: [
              {
                name: 'Samuel Delesque',
                role: '_i18n_team_samuel_role',
                bio: '_i18n_team_samuel_desc',
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
            eyebrow: '_i18n_team_operations_label',
            title: '_i18n_team_ground_teams_title',
            description: '_i18n_team_ground_teams_desc',
            departments: [
              {
                title: '_i18n_team_hospitality_team_title',
                subtitle: '_i18n_team_hospitality_team_when',
                description: '_i18n_team_hospitality_team_desc',
                members: [
                  {
                    name: '_i18n_team_luna_name',
                    role: '_i18n_team_luna_role',
                  },
                  {
                    name: '_i18n_team_kitchen_lead',
                    role: '_i18n_team_position_open',
                    isOpen: true,
                  },
                  {
                    name: '_i18n_team_kitchen_support',
                    role: '_i18n_team_position_open',
                    isOpen: true,
                  },
                  {
                    name: '_i18n_team_housekeeping',
                    role: '_i18n_team_housekeeping_positions',
                    isOpen: true,
                  },
                  {
                    name: '_i18n_team_maintenance',
                    role: '_i18n_team_maintenance_position',
                    isOpen: true,
                  },
                ],
              },
              {
                title: '_i18n_team_ecology_food_title',
                description: '_i18n_team_ecology_food_desc',
                members: [
                  {
                    name: '_i18n_team_ofer_name',
                    role: '_i18n_team_land_steward',
                  },
                  {
                    name: '_i18n_team_joao_name',
                    role: '_i18n_team_land_steward',
                  },
                  {
                    name: '_i18n_team_land_steward',
                    role: '_i18n_team_land_steward_additional',
                    isOpen: true,
                  },
                  {
                    name: '_i18n_team_volunteers',
                    role: '_i18n_team_volunteers_positions',
                    isOpen: true,
                  },
                ],
              },
              {
                title: '_i18n_team_build_team_title',
                description: '_i18n_team_build_team_desc',
                members: [
                  {
                    name: '_i18n_team_julia_name',
                    role: '_i18n_team_carpentry',
                  },
                ],
              },
              {
                title: '_i18n_team_mushroom_farm_title',
                description: '_i18n_team_mushroom_farm_desc',
                members: [
                  {
                    name: '_i18n_team_richard_name',
                    role: '_i18n_team_richard_role',
                  },
                  {
                    name: '_i18n_team_tonya_name',
                    role: '_i18n_team_tonya_role',
                  },
                  {
                    name: '_i18n_team_mycology_assistants',
                    role: '_i18n_team_mycology_assistants_positions',
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
            eyebrow: '_i18n_team_partners_label',
            title: '_i18n_team_partners_title',
            description: '_i18n_team_partners_desc',
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
            eyebrow: '_i18n_team_governance_label',
            title: '_i18n_team_tdf_dao_title',
            description: '_i18n_team_dao_desc',
            items: [
              {
                title: '_i18n_team_citizens_title',
                description: '_i18n_team_citizens_desc',
              },
              {
                title: '_i18n_team_citizen_assembly_title',
                description: '_i18n_team_citizen_assembly_desc',
              },
              {
                title: '_i18n_team_treasury_title',
                description: '_i18n_team_treasury_desc',
              },
              {
                title: '_i18n_team_token_holders_title',
                description: '_i18n_team_token_holders_desc',
              },
              {
                title: '_i18n_team_sweat_holders_title',
                description: '_i18n_team_sweat_holders_desc',
              },
              {
                title: '_i18n_team_presence_holders_title',
                description: '_i18n_team_presence_holders_desc',
              },
            ],
            governsTitle: '_i18n_team_dao_governs_title',
            governsItems: [
              '_i18n_team_dao_governs_game_guide',
              '_i18n_team_dao_governs_land_plan',
              '_i18n_team_dao_governs_elections',
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
            title: '_i18n_team_join_title',
            description: '_i18n_team_join_desc',
            primaryText: '_i18n_team_join_view_positions',
            primaryLink: '/roles',
            secondaryText: '_i18n_team_join_volunteer_program',
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
                value: '_i18n_press_stats_articles_count',
                label: '_i18n_press_stats_articles_label',
              },
              {
                value: '_i18n_press_stats_portuguese_count',
                label: '_i18n_press_stats_portuguese_label',
              },
              {
                value: '_i18n_press_stats_spanish_count',
                label: '_i18n_press_stats_spanish_label',
              },
              {
                value: '_i18n_press_stats_podcasts_count',
                label: '_i18n_press_stats_podcasts_label',
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
            eyebrow: '_i18n_press_featured_in',
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
            eyebrow: '_i18n_press_highlight_title',
            items: [
              {
                outlet: 'Expresso',
                date: 'June 26, 2025',
                title: '_i18n_press_highlight_expresso_title',
                url: 'https://expresso.pt/economia/economia_imobiliario/2025-06-26-nomadas-digitais-criam-aldeia-tecnologica-no-alentejo-354f740a',
              },
              {
                outlet: 'Forbes Portugal',
                date: 'August 26, 2025',
                title: '_i18n_press_highlight_forbes_title',
                url: 'https://www.forbespt.com/portugal-e-o-setimo-destino-favorito-dos-nomadas-digitais/',
              },
              {
                outlet: 'Diário de Notícias',
                date: 'August 24, 2025',
                title: '_i18n_press_highlight_dn_title',
                url: 'https://www.dn.pt/edicao-impressa/alentejo-v%C3%AA-nascer-primeira-aldeia-regenerativa-da-europa-financiada-com-tokens',
              },
              {
                outlet: 'EFE Verde',
                date: 'September 21, 2025',
                title: '_i18n_press_highlight_efe_title',
                url: 'https://efeverde.com/regenerar-para-avanzar-el-futuro-del-campo-pasa-por-la-innovacion-social-y-ecologica-por-samuel-delesque-traditional-dream-factory-tdf/',
              },
              {
                outlet: 'Idealista',
                date: 'December 18, 2025',
                title: '_i18n_press_highlight_idealista_title',
                url: 'https://www.idealista.pt/news/imobiliario/habitacao/2025/12/18/73120-primeira-aldeia-regenerativa-tokenizada-da-europa-nasce-no-alentejo',
              },
              {
                outlet: 'Jornal Económico',
                date: '2025',
                title: '_i18n_press_highlight_jornal_title',
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
            eyebrow: '_i18n_press_podcasts_title',
            description: '_i18n_press_podcasts_subtitle',
            items: [
              {
                title: '_i18n_press_podcast_green_planet_title',
                date: '_i18n_press_podcast_green_planet_date',
                url: 'https://podcasts.apple.com/gb/podcast/ep-322-sam-delesque-regenerative-entrepreneur-developing/id1265643891?i=1000595309300',
              },
              {
                title: '_i18n_press_podcast_refi_title',
                date: '_i18n_press_podcast_refi_date',
                url: 'https://blog.refidao.com/building-regenerative-villages-with-samuel-delesque-season-3-episode-8/',
              },
              {
                title: '_i18n_press_podcast_crypto_altruism_title',
                date: '_i18n_press_podcast_crypto_altruism_date',
                url: 'https://www.cryptoaltruism.org/blog/crypto-altruism-podcast-episode84-oasa-using-web3-to-build-for-a-regenerative-future',
              },
              {
                title: '_i18n_press_podcast_blockchain_socialist_title',
                date: '_i18n_press_podcast_blockchain_socialist_date',
                url: 'https://theblockchainsocialist.com/a-regenerative-village-as-a-dao-in-portugal-traditional-dream-factory/',
              },
              {
                title: '_i18n_press_podcast_strangers_title',
                date: '_i18n_press_podcast_strangers_date',
                url: 'https://thenewmvt.com/podcast/sam-delesque/',
              },
              {
                title: '_i18n_press_podcast_primal_title',
                date: '_i18n_press_podcast_primal_date',
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
            title: '_i18n_press_contact_title',
            description: '_i18n_press_contact_description',
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
            heroEyebrow: '_i18n_dataroom_hero_label',
            heroTitle: '_i18n_dataroom_hero_subtitle',
            heroDescription: '_i18n_dataroom_hero_description',
            stats: [
              {
                value: '€450K',
                label: '_i18n_dataroom_stat_total_funding',
              },
              {
                value: '€1.24M',
                label: '_i18n_dataroom_stat_construction_budget',
              },
              {
                value: '€653k',
                label: '_i18n_dataroom_stat_revenue_target',
              },
              {
                value: '25ha',
                label: '_i18n_dataroom_stat_land_stewardship',
              },
            ],
            loanTerms: [
              { value: '€450K', label: '_i18n_dataroom_terms_amount' },
              { value: '5%', label: '_i18n_dataroom_terms_rate' },
              { value: '4 yr', label: '_i18n_dataroom_terms_term' },
              { value: '€50K', label: '_i18n_dataroom_terms_minimum' },
            ],
            documents: [
              {
                title: '_i18n_dataroom_financial_plan_title',
                href: '/dataroom/tdf-financial-plan.xlsx',
                downloadLabel: '_i18n_dataroom_download_file',
              },
              {
                title: '_i18n_dataroom_area_map_title',
                href: '/dataroom/tdf-area-map.kml',
                downloadLabel: '_i18n_dataroom_download_file',
              },
              {
                title: '_i18n_dataroom_architecture_title',
                href: '/dataroom/tdf-architecture.pdf',
                downloadLabel: '_i18n_dataroom_download_pdf',
              },
              {
                title: '_i18n_dataroom_report_2021_title',
                href: '/pdf/2021-TDF-report.pdf',
                downloadLabel: '_i18n_dataroom_download_pdf',
              },
              {
                title: '_i18n_dataroom_report_2022_title',
                href: '/pdf/2022-TDF-report.pdf',
                downloadLabel: '_i18n_dataroom_download_pdf',
              },
              {
                title: '_i18n_dataroom_report_2024_title',
                href: '/pdf/2024-TDF-report.pdf',
                downloadLabel: '_i18n_dataroom_download_pdf',
              },
              {
                title: '_i18n_dataroom_report_2025_title',
                href: '/pdf/2025-TDF-report.pdf',
                downloadLabel: '_i18n_dataroom_download_pdf',
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
