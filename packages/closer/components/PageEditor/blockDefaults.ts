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
                imageUrl: '',
                width: 800,
                height: 600,
                alt: '',
              },
              {
                imageUrl: '',
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
    case 'fundraiserPromo':
      return {
        _localId,
        type: 'fundraiserPromo',
        data: {
          settings: { showTitle: true },
          content: {
            eyebrow: 'Fundraising campaign',
            title: 'Help build the village',
            description:
              'Join mission-aligned supporters funding core infrastructure for a regenerative village.',
            ctaText: 'Support the campaign',
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
    case 'tokenOnboarding':
      return {
        _localId,
        type: 'tokenOnboarding',
        data: {
          settings: {},
          content: {
            eyebrow: 'Token onboarding',
            title: 'New to web3? Start here',
            description:
              'A guided, step-by-step introduction for future members: learn what the token gives you, set up your wallet, and earn rewards as you go. No crypto experience needed.',
            items: [
              { text: 'Understand what the token gives you' },
              { text: 'Set up and link your wallet' },
              { text: 'Earn 🥕 rewards as you complete each quest' },
            ],
            ctaText: 'Start onboarding',
            ctaLink: '/token/onboarding',
          },
        },
      };
    case 'tokenContracts':
      return {
        _localId,
        type: 'tokenContracts',
        data: {
          settings: {},
          content: {
            eyebrow: 'On-chain transparency',
            title: 'Explore the smart contracts',
            description:
              'Every token lives on public smart contracts. Verify them on the block explorer below, or open the contracts page to interact with them directly.',
            ctaText: 'Open the contracts page',
            ctaLink: '/token/contracts',
          },
        },
      };
    case 'tokenBuy':
      return {
        _localId,
        type: 'tokenBuy',
        data: {
          settings: {},
          content: {
            eyebrow: 'Become a member',
            title: 'Buy tokens',
            description:
              'Tokens give you nights at the village, governance rights, and a path to citizenship. Choose your amount and complete your purchase in a few steps.',
            items: [
              { text: '1 token = 1 annual night' },
              { text: 'DAO voting rights' },
              { text: 'Pay by card, bank transfer or crypto' },
            ],
            ctaText: 'Buy tokens',
            ctaLink: '/token/before-you-begin',
          },
        },
      };
    case 'tokenFinance':
      return {
        _localId,
        type: 'tokenFinance',
        data: {
          settings: {},
          content: {
            eyebrow: 'Token financing',
            title: 'Finance your tokens',
            description:
              'Spread your token purchase over monthly payments: start with a down payment and accrue tokens as you pay. Pick an amount to see your terms.',
            ctaText: 'Apply for financing',
            ctaLink: '',
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
            items: [],
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
              'We\'re running a co-housing program for the first cohort now. Join the waitlist to be notified when applications open.',
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
            title: 'Words from people who\'ve stayed',
            items: [
              {
                name: 'A recent guest',
                content:
                  'Share a few words from someone who has stayed with you.',
                photo: '',
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
              'We invite volunteers to join us on the land and take part in the daily life of the community.',
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
    case 'fundraiserDonate':
      return {
        _localId,
        type: 'fundraiserDonate',
        data: {
          settings: {},
          content: {
            title: '',
            description: '',
            videoEmbedId: '',
            imageUrl: '',
          },
        },
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
                title: 'Association',
                description:
                  'The legal entity that holds the land and oversees its long-term stewardship.',
              },
              {
                icon: 'vote',
                title: 'Community governance',
                description:
                  'Members and citizens shape decisions through proposals and votes.',
              },
              {
                icon: 'zap',
                title: 'Operations team',
                description:
                  'Day-to-day operations, development, and strategic direction.',
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
            eyebrow: 'Core team',
            title: 'Leadership',
            description: 'The people responsible for strategy and operations.',
            members: [
              {
                name: 'Team member',
                role: 'Role',
                bio: 'A short bio: background, focus, and what they care about.',
                twitterUrl: '',
                linkedinUrl: '',
              },
            ],
          },
        },
      };
    case 'teamDirectory':
      return {
        _localId,
        type: 'teamDirectory',
        data: {
          settings: { limit: 24 },
          content: {
            title: 'Meet the team',
            description:
              'The people who live and work here will welcome you, show you around and help you make the most of your stay.',
            roles: [{ role: 'team' }],
            ctaText: 'Send us a message',
            email: '',
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
            title: 'On-the-ground teams',
            description: 'The people making it happen every day.',
            departments: [
              {
                title: 'Hospitality',
                description:
                  'Welcome guests and keep the shared spaces running smoothly.',
                members: [
                  { name: 'Team member', role: 'Hospitality lead' },
                  { name: 'Kitchen support', role: 'Position open', isOpen: true },
                ],
              },
              {
                title: 'Land & food',
                description:
                  'Grow food, build soil fertility and care for the water systems.',
                members: [
                  { name: 'Team member', role: 'Land steward' },
                  { name: 'Volunteers', role: 'Rotating positions', isOpen: true },
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
            eyebrow: 'Partners & contractors',
            title: 'External partners',
            description:
              'Professional partners and service providers supporting the project.',
            partners: [
              { name: 'Partner name', role: 'Legal' },
              { name: 'Partner name', role: 'Architecture' },
              { name: 'Partner name', role: 'Accounting' },
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
            title: 'How decisions are made',
            description:
              'Decentralized governance through the community of members and token holders.',
            items: [
              {
                title: 'Citizens',
                description:
                  'Members who have completed onboarding and embody the community values.',
              },
              {
                title: 'Citizen assembly',
                description:
                  'Regular gatherings to discuss proposals and shape the community direction.',
              },
              {
                title: 'Treasury',
                description:
                  'Community-controlled funds for development and operations.',
              },
              {
                title: 'Token holders',
                description:
                  'Holders with governance rights and accommodation access.',
              },
            ],
            governsTitle: 'What the community governs',
            governsItems: [
              'Community agreements',
              'Land plan',
              'Team elections',
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
            title: 'Join the team',
            description:
              'We\'re always looking for passionate people to join our regenerative community. Whether as a steward, volunteer, or contributor.',
            primaryText: 'View open positions',
            primaryLink: '/roles',
            secondaryText: 'Volunteer program',
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
              { value: '20+', label: 'Press articles' },
              { value: '10+', label: 'National media' },
              { value: '5+', label: 'International media' },
              { value: '3', label: 'Podcast appearances' },
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
              { name: 'Publication name' },
              { name: 'Publication name' },
              { name: 'Publication name' },
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
            eyebrow: 'Highlight coverage',
            items: [
              {
                outlet: 'Outlet name',
                date: 'January 1, 2026',
                title: 'Article headline',
                url: 'https://example.com',
              },
              {
                outlet: 'Outlet name',
                date: 'January 1, 2026',
                title: 'Article headline',
                url: 'https://example.com',
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
            description: 'Conversations with the team about the project.',
            items: [
              {
                title: 'Podcast name',
                date: 'January 2026 • 45 min',
                url: 'https://example.com',
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
            title: 'Press contact',
            description:
              'For media inquiries, interview requests, or press materials, please contact:',
            email: '',
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
            heroEyebrow: 'Data room',
            heroTitle: 'Investment data room',
            heroDescription:
              'Key figures, terms and documents for prospective investors.',
            stats: [
              { value: '€0', label: 'Total raise' },
              { value: '€0', label: 'Construction budget' },
              { value: '€0', label: 'Revenue target' },
              { value: '0ha', label: 'Land under stewardship' },
            ],
            loanTerms: [
              { value: '€0', label: 'Total raise' },
              { value: '0%', label: 'Fixed annual rate' },
              { value: '0 yr', label: 'Term' },
              { value: '€0', label: 'Minimum ticket' },
            ],
            documents: [],
            partners: [],
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
