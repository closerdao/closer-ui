import { FC, PropsWithChildren, useEffect, useState } from 'react';

import { useConfig } from '../hooks/useConfig';
import { initAnalytics, trackPageView } from './Analytics';

const Layout: FC<PropsWithChildren> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const { GA_ANALYTICS } = useConfig() || {};

  useEffect(() => {
    if (GA_ANALYTICS) {
      if (!isInitialized) {
        initAnalytics();
        setIsInitialized(true);
      }
      trackPageView();
    }
  }, []);

  return (
    <div className="p-6 flex flex-1 flex-col items-center w-full">
      {children}
    </div>
  );
};
export default Layout;