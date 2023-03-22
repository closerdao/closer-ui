import { useContext } from 'react';

import { ConfigContext } from '../contexts/config';

export const useConfig = () => {
  if (!ConfigContext) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  const config = useContext(ConfigContext);
  return config;
};
