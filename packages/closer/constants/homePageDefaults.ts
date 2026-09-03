import type { StandardPageDefaultDoc, StandardPageVillageData } from './standardPages';

type Section = StandardPageDefaultDoc['sections'][number];

interface FeatureCard {
  title: string;
  text: string;
  cta: { text: string; url: string };
}

/**
 * The home page a village gets before anyone has edited it. Built from the
 * village's own data rather than shipped as copy: the name, country and
 * contact come from the general config, and each enabled feature earns a
 * card and, where one exists, a live block (listings, upcoming events, the
 * volunteer call). Editing `/` in the page editor replaces all of this.
 */
export const buildHomePageDefaults = (
  village: StandardPageVillageData,
): StandardPageDefaultDoc => {
  const name = village.platformName.trim();
  const title = name || 'Welcome';
  const heroTitle = name ? `Welcome to ${name}` : 'Welcome';
  const here = name || 'our village';
  const { features } = village;

  const description = name
    ? `${name} is a place to visit, stay and build together.`
    : 'A place to visit, stay and build together.';

  const visitCta = features.booking
    ? { text: 'Plan a visit', url: '/stay' }
    : features.events
    ? { text: 'See what\'s on', url: '/events' }
    : null;

  const cards: FeatureCard[] = [];
  if (features.booking) {
    cards.push({
      title: 'Stay with us',
      text: '<p>Book a room, a cabin or a camping spot and experience daily life on the land.</p>',
      cta: { text: 'Book a stay', url: '/stay' },
    });
  }
  if (features.events) {
    cards.push({
      title: 'Join an event',
      text: '<p>Workshops, gatherings and residencies run throughout the year.</p>',
      cta: { text: 'See what\'s on', url: '/events' },
    });
  }
  if (features.volunteering) {
    cards.push({
      title: 'Volunteer',
      text: `<p>Spend a season with us and contribute to the work that keeps ${here} alive.</p>`,
      cta: { text: 'Volunteer with us', url: '/volunteer' },
    });
  }
  if (features.citizenship) {
    cards.push({
      title: 'Become a citizen',
      text: `<p>Citizens shape how ${here} is governed and cared for.</p>`,
      cta: { text: 'Learn more', url: '/citizenship' },
    });
  } else if (features.subscriptions) {
    cards.push({
      title: 'Become a member',
      text: `<p>Members support ${here} and get closer to the community.</p>`,
      cta: { text: 'See the plans', url: '/subscriptions' },
    });
  }
  if (features.token) {
    cards.push({
      title: 'Hold a piece of it',
      text: '<p>Tokens turn guests into co-stewards, with stay rights and a say in how the village grows.</p>',
      cta: { text: 'About the token', url: '/token' },
    });
  }
  if (features.cohousing) {
    cards.push({
      title: 'Live here',
      text: `<p>Build your life in nature with the ${here} co-housing programme.</p>`,
      cta: { text: 'Co-housing', url: '/cohousing' },
    });
  }
  if (features.fundraiser) {
    cards.push({
      title: 'Support the project',
      text: `<p>Help fund the infrastructure that makes ${here} possible.</p>`,
      cta: { text: 'Support us', url: '/fundraiser' },
    });
  }

  const sections: Section[] = [
    {
      type: 'hero',
      data: {
        settings: { alignText: 'center', isInverted: false, isCompact: false },
        content: {
          eyebrow: village.countryName ? `A village in ${village.countryName}` : '',
          title: heroTitle,
          body: 'We are building a place where land is held in common, community is intentional, and belonging is not left to chance.',
          imageUrl: '',
          cta: { text: 'Join us', url: '/signup' },
          secondaryCta: visitCta ?? { text: '', url: '' },
        },
      },
    },
  ];

  if (cards.length > 0) {
    sections.push({
      type: 'features',
      data: {
        settings: {
          numColumns: cards.length <= 3 ? cards.length : cards.length === 4 ? 2 : 3,
          isSmallImage: true,
          isColorful: false,
        },
        background: 'neutral-light',
        content: {
          title: 'What happens here',
          description: '',
          items: cards.map((card) => ({
            ...card,
            imageUrl: '',
            visualType: 'none',
          })),
        },
      },
    });
  }

  if (features.booking) {
    sections.push({
      type: 'listingsPreviews',
      data: {
        settings: {},
        content: { title: name ? `Stay at ${name}` : 'Stay with us' },
      },
    });
  }

  if (features.events) {
    sections.push({
      type: 'upcomingEvents',
      data: { settings: {}, content: {} },
    });
  }

  if (features.volunteering) {
    sections.push({
      type: 'volunteerCta',
      data: {
        settings: {},
        content: {
          title: 'Volunteer with us',
          description: `Live and work alongside the ${here} team for a season, and take part in the daily life of the community.`,
          ctaText: 'Learn more',
          ctaLink: '/volunteer',
        },
      },
    });
  }

  sections.push({
    type: 'cta',
    data: {
      settings: { style: 'accent' },
      content: {
        eyebrow: '',
        title: 'Come and see for yourself',
        text: 'Create an account to book a stay, join events and follow what we are building.',
        primaryText: 'Create an account',
        primaryLink: '/signup',
        secondaryText: village.teamEmail
          ? 'Get in touch'
          : visitCta?.text ?? '',
        secondaryLink: village.teamEmail
          ? `mailto:${village.teamEmail}`
          : visitCta?.url ?? '',
      },
    },
  });

  return { title, slug: '/', description, ogImage: '', sections };
};
