import { FC, PropsWithChildren, useEffect, useState } from 'react';
import { initAnalytics, trackPageView } from './Analytics';
import { useConfig } from '../hooks/useConfig';

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
    <div className="main-content p-6 flex flex-1 flex-col w-full gap-8 mt-20">
      {children}
    </div>
  );
};

export default Layout;
