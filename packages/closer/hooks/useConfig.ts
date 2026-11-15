import { useContext } from 'react';

import { ConfigContext } from '../contexts/config';

export const useConfig = () => {
  if (!ConfigContext) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  const config = useContext(ConfigContext);
  return config;
};

// TDF-only content (co-housing quiz, amounts, units, block fallback copy) renders only on the TDF app.
export const useIsTdfApp = () => useConfig()?.APP_NAME?.toLowerCase() === 'tdf';
