import { useContext } from 'react';

import { ConfigContext } from '../contexts/config';

export const useConfig = () => {
  if (!ConfigContext) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  const config = useContext(ConfigContext);
  return config;
};

export const isTdfApp = (config: { APP_NAME?: string } | null | undefined) =>
  config?.APP_NAME?.toLowerCase() === 'tdf';

export const useIsTdfApp = () => isTdfApp(useConfig());
