export interface PageEditorFeatureFlags {
  fundraiser: boolean;
  token: boolean;
  webinar: boolean;
  events: boolean;
  booking: boolean;
  citizenship: boolean;
  cohousing: boolean;
  volunteering: boolean;
  subscriptions: boolean;
  team: boolean;
  press: boolean;
  dataroom: boolean;
}

interface AppConfigShape {
  fundraiser?: { enabled?: boolean };
  webinar?: { enabled?: boolean };
  events?: { enabled?: boolean };
  booking?: { enabled?: boolean };
  citizenship?: { enabled?: boolean };
  cohousing?: { enabled?: boolean };
  volunteering?: { enabled?: boolean };
  subscriptions?: { enabled?: boolean };
}

export const getPageEditorFeatureFlags = (
  config: AppConfigShape | null | undefined,
): PageEditorFeatureFlags => {
  const fundraiser =
    process.env.NEXT_PUBLIC_FEATURE_SUPPORT_US === 'true' &&
    Boolean(config?.fundraiser?.enabled);
  const token = process.env.NEXT_PUBLIC_FEATURE_TOKEN_SALE === 'true';
  const webinar = Boolean(config?.webinar?.enabled);
  const events = config?.events?.enabled !== false;
  const booking =
    process.env.NEXT_PUBLIC_FEATURE_BOOKING === 'true' &&
    Boolean(config?.booking?.enabled);
  const citizenship =
    process.env.NEXT_PUBLIC_FEATURE_CITIZENSHIP === 'true' &&
    Boolean(config?.citizenship?.enabled);
  const cohousing = Boolean(config?.cohousing?.enabled);
  const volunteering =
    process.env.NEXT_PUBLIC_FEATURE_VOLUNTEERING === 'true' &&
    Boolean(config?.volunteering?.enabled);
  const subscriptions =
    process.env.NEXT_PUBLIC_FEATURE_SUBSCRIPTIONS === 'true' &&
    Boolean(config?.subscriptions?.enabled);
  return {
    fundraiser,
    token,
    webinar,
    events,
    booking,
    citizenship,
    cohousing,
    volunteering,
    subscriptions,
    team: true,
    press: true,
    dataroom: true,
  };
};
