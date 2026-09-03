/**
 * The `/first-steps` guided setup: what a village does, in what order, after
 * their instance is deployed and before anybody visits it.
 *
 * `utils/villageFunnel.ts` models everything that happens *before* this —
 * application, account, subscription, village, deploy. That funnel ends with a
 * running but empty instance. These steps are the missing last leg.
 *
 * Long-form copy lives here rather than in the locale files, the same way
 * `tokenOnboardingQuests.ts` holds its quest bodies: the blurbs are structured
 * prose written to be read once, and flattening them into translation keys
 * costs their rhythm without buying much. Only the chrome — step titles,
 * buttons, status labels — is translated.
 */

export type FirstStepId =
  | 'identity'
  | 'theme'
  | 'features'
  | 'pages'
  | 'money'
  | 'stays'
  | 'team'
  | 'launch';

export interface FirstStepFieldGroup {
  /** Config slug the fields belong to. */
  slug: string;
  /** Field names, in render order, as they appear in `config.ts`. */
  keys: string[];
}

export interface FirstStepDeepLink {
  href: string;
  /** Translation key for the link text. */
  labelKey: string;
}

export interface FirstStepDefinition {
  id: FirstStepId;
  /** Translation key for the step title. */
  titleKey: string;
  /** One line under the title: what this step is. */
  blurb: string;
  /** Why it is worth doing, in the admin's terms rather than the schema's. */
  why: string;
  /**
   * Required steps decide whether setup counts as finished. Optional ones can
   * be skipped outright and still leave the instance complete.
   */
  required: boolean;
  /**
   * Config slug that must be live-enabled for the step to appear at all.
   * Absent means the step is always shown.
   */
  requiresFeature?: string;
  fields?: FirstStepFieldGroup;
  deepLink?: FirstStepDeepLink;
}

export const FIRST_STEPS: FirstStepDefinition[] = [
  {
    id: 'identity',
    titleKey: 'first_steps_identity_title',
    blurb:
      'Name the place, say where it is, and give people a way to reach you.',
    why: 'Everything downstream reads these. Your platform name, country and team email are stitched into the page templates you will create in a moment, they sign your outgoing email, and they are what a visitor sees in the browser tab. Setting them first means the rest of the setup fills itself in correctly.',
    required: true,
    fields: {
      slug: 'general',
      keys: [
        'platformName',
        'appName',
        'teamEmail',
        'country',
        'timeZone',
        'semanticUrl',
        'logoHeader',
        'favicon',
      ],
    },
    deepLink: {
      href: '/dashboard/admin/config',
      labelKey: 'first_steps_link_all_settings',
    },
  },
  {
    id: 'theme',
    titleKey: 'first_steps_theme_title',
    blurb: 'Pick two colours and two fonts. That is the whole theme.',
    why: 'Closer derives a full palette from a small number of choices, so you do not have to pick twenty shades. Start with a primary colour that matches whatever you already use on a sign, a flag or a logo. You can tune individual tokens later on the theming page, but almost nobody needs to.',
    required: true,
    deepLink: {
      href: '/dashboard/theming',
      labelKey: 'first_steps_link_theming',
    },
  },
  {
    id: 'features',
    titleKey: 'first_steps_features_title',
    blurb: 'Turn on only what you will actually use.',
    why: 'Closer ships a lot of machinery: stays, events, volunteering, subscriptions, citizenship, a token. A village that switches all of it on gets a confusing site and a lot of empty pages. Switch on the two or three things you can genuinely run this season, and come back for the rest.',
    required: true,
    deepLink: {
      href: '/dashboard/admin/config',
      labelKey: 'first_steps_link_all_settings',
    },
  },
  {
    id: 'pages',
    titleKey: 'first_steps_pages_title',
    blurb: 'Start from the templates, then make them yours.',
    why: 'Every feature you just enabled comes with a page already written for it, filled in with your village name and country. Create them from the templates now so your site is never blank, then edit the words at your own pace. A page you have not created is simply not there for visitors.',
    required: true,
  },
  {
    id: 'money',
    titleKey: 'first_steps_money_title',
    blurb: 'Only needed if you plan to charge for anything.',
    why: 'This covers who the money is legally owed to and how card payments reach you. Skip it if you are not selling stays, tickets or subscriptions yet — nothing else depends on it, and you can come back the week before you open bookings.',
    required: false,
    fields: {
      slug: 'payment',
      keys: ['cardPayment', 'cryptoPayment', 'fiatCur', 'vatRate'],
    },
    deepLink: {
      href: '/stripe-connect',
      labelKey: 'first_steps_link_stripe',
    },
  },
  {
    id: 'stays',
    titleKey: 'first_steps_stays_title',
    blurb: 'Set your house rules, then add somewhere to sleep.',
    why: 'A booking needs two things: rules about when people can arrive and how long they can stay, and at least one listing to book. Without a single listing the stay page renders, takes a search, and returns nothing — which reads as broken rather than as empty.',
    required: true,
    requiresFeature: 'booking',
    fields: {
      slug: 'booking',
      keys: [
        'checkinTime',
        'checkoutTime',
        'minDuration',
        'maxDuration',
        'maxBookingHorizon',
        'foodOptionEnabled',
      ],
    },
  },
  {
    id: 'team',
    titleKey: 'first_steps_team_title',
    blurb: 'Bring in the people who will run this with you.',
    why: 'Roles decide who can see what. A space host manages bookings and listings without touching your settings; a community curator handles applications and members. Give people the narrowest role that lets them do their job, and keep admin for the two or three of you who need it.',
    required: false,
    deepLink: {
      href: '/dashboard/admin/manage-users',
      labelKey: 'first_steps_link_users',
    },
  },
  {
    id: 'launch',
    titleKey: 'first_steps_launch_title',
    blurb: 'Publish everything you just set up.',
    why: 'Closer compiles your settings and theme into the site when it builds, which is what makes it fast. The flip side is that nothing you saved today is visible to a visitor until you deploy. This is that button. It takes a few minutes, and you can keep working while it runs.',
    required: true,
  },
];

export const getFirstStepDefinition = (
  id: FirstStepId,
): FirstStepDefinition | undefined =>
  FIRST_STEPS.find((step) => step.id === id);

export const isFirstStepId = (value: unknown): value is FirstStepId =>
  typeof value === 'string' && FIRST_STEPS.some((step) => step.id === value);

/**
 * Features offered in the `features` step, with the one-line explanation an
 * admin needs to decide. Ordered by how commonly a new village wants them.
 * Every slug here is a real config group; the step reads its lock state from
 * `constants/featureFlags.ts` rather than repeating the env names.
 */
export interface FirstStepFeature {
  slug: string;
  labelKey: string;
  explanation: string;
}

export const FIRST_STEPS_FEATURES: FirstStepFeature[] = [
  {
    slug: 'booking',
    labelKey: 'first_steps_feature_booking',
    explanation:
      'Let people search dates and book a bed or a room, with prices, discounts and a cancellation policy.',
  },
  {
    slug: 'events',
    labelKey: 'first_steps_feature_events',
    explanation:
      'Publish gatherings with tickets, dates and optional accommodation attached.',
  },
  {
    slug: 'volunteering',
    labelKey: 'first_steps_feature_volunteering',
    explanation:
      'Take applications from people who want to come and work rather than pay.',
  },
  {
    slug: 'applications',
    labelKey: 'first_steps_feature_applications',
    explanation:
      'An apply-to-join form for visitors, with questions you choose, feeding your leads board.',
  },
  {
    slug: 'subscriptions',
    labelKey: 'first_steps_feature_subscriptions',
    explanation:
      'Recurring memberships billed monthly or yearly, each with its own perks and credits.',
  },
  {
    slug: 'community',
    labelKey: 'first_steps_feature_community',
    explanation:
      'A member directory and profiles, so people can find each other before they arrive.',
  },
  {
    slug: 'blog',
    labelKey: 'first_steps_feature_blog',
    explanation: 'Long-form posts, for updates from the land.',
  },
  {
    slug: 'learningHub',
    labelKey: 'first_steps_feature_learning_hub',
    explanation: 'Courses and lessons, free or paid.',
  },
  {
    slug: 'citizenship',
    labelKey: 'first_steps_feature_citizenship',
    explanation:
      'A membership path with vouching, presence requirements and a token stake. Involved — leave it off until the basics run.',
  },
  {
    slug: 'cohousing',
    labelKey: 'first_steps_feature_cohousing',
    explanation:
      'A waitlist and staged application for people who want to live there.',
  },
  {
    slug: 'governance',
    labelKey: 'first_steps_feature_governance',
    explanation: 'On-chain proposals and voting for token holders.',
  },
  {
    slug: 'fundraiser',
    labelKey: 'first_steps_feature_fundraiser',
    explanation:
      'A campaign page with milestones, packages and donations, for raising money to build.',
  },
];
