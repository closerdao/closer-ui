import React from 'react';

import { useConfig } from '../../hooks/useConfig';
import Webinar from '../Webinar';

interface Props {
  settings?: {
    tags?: string[];
    analyticsCategory?: string;
    /** Anchor id, so CTAs elsewhere on the page can link to the webinar. */
    id?: string;
  };
  content?: Record<string, unknown>;
}

const CustomWebinar = ({ settings }: Props) => {
  const config = useConfig() as
    | {
        webinar?: { enabled?: boolean } & Record<string, unknown>;
        general?: { timeZone?: string };
      }
    | null
    | undefined;

  if (!config?.webinar?.enabled) return null;

  return (
    <Webinar
      id={settings?.id}
      tags={settings?.tags ?? ['landing-page', 'investor-webinar']}
      analyticsCategory={settings?.analyticsCategory ?? 'CustomPage'}
      schedule={config.webinar}
      generalTimezone={config?.general?.timeZone}
    />
  );
};

export default CustomWebinar;
