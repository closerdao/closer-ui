// import { useEffect } from 'react';

// import { initAnalytics, trackPageView } from './Analytics';

// let GA_INITIALIZED;

const Layout = ({ children }) => {
  // useEffect(() => {
  //   if (!GA_INITIALIZED) {
  //     initAnalytics();
  //     GA_INITIALIZED = true;
  //   }
  //   trackPageView();
  // }, []);

  return children;
};
export default Layout;
