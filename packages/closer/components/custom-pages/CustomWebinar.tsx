import React from 'react';

import Webinar from '../Webinar';
import { useConfig } from '../../hooks/useConfig';

interface Props {
  settings?: {
    tags?: string[];
    analyticsCategory?: string;
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
      tags={settings?.tags ?? ['landing-page', 'investor-webinar']}
      analyticsCategory={settings?.analyticsCategory ?? 'CustomPage'}
      schedule={config.webinar}
      generalTimezone={config?.general?.timeZone}
    />
  );
};

export default CustomWebinar;
