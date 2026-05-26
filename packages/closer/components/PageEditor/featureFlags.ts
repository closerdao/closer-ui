export interface PageEditorFeatureFlags {
  fundraiser: boolean;
  tokenStats: boolean;
  webinar: boolean;
  events: boolean;
}

interface AppConfigShape {
  fundraiser?: { enabled?: boolean };
  webinar?: { enabled?: boolean };
}

export const getPageEditorFeatureFlags = (
  config: AppConfigShape | null | undefined,
): PageEditorFeatureFlags => {
  const fundraiser =
    process.env.NEXT_PUBLIC_FEATURE_SUPPORT_US === 'true' &&
    Boolean(config?.fundraiser?.enabled);
  const tokenStats =
    process.env.NEXT_PUBLIC_FEATURE_WEB3_WALLET === 'true';
  const webinar = Boolean(config?.webinar?.enabled);
  return {
    fundraiser,
    tokenStats,
    webinar,
    events: true,
  };
};
