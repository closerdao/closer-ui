import type { WebinarScheduleConfig } from 'closer/components/Webinar';
import baseConfig from 'closer/configCached';
import type { FundraisingConfig, GeneralConfig } from 'closer/types';

export type CachedAppConfig = Record<string, Record<string, unknown>> & {
  general: GeneralConfig;
  fundraiser: FundraisingConfig;
  webinar: WebinarScheduleConfig & { enabled: boolean };
};

const config = baseConfig as CachedAppConfig;

export default config;
