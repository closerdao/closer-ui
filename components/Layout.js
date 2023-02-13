import { useEffect } from 'react';

import { GA_ANALYTICS } from '../config';
import { initAnalytics, trackPageView } from './Analytics';

let GA_INITIALIZED;

const Layout = ({ children }) => {
  useEffect(() => {
    if (!GA_INITIALIZED && GA_ANALYTICS) {
      initAnalytics();
      GA_INITIALIZED = true;
    }
    if (GA_ANALYTICS) {
      trackPageView();
    }
  }, []);

  return children;
};
export default Layout;
