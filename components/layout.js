import { useEffect } from 'react';
import { initAnalytics, trackPageView } from './analytics';
import Header from './header';
import Footer from './footer';

let GA_INITIALIZED = false;

const Layout = ({ fullscreen, children }) => {
  useEffect(() => {
    if (!GA_INITIALIZED) {
      initAnalytics()
      GA_INITIALIZED = true
    }
    trackPageView()
  }, []);

  return (
    <div className={ fullscreen ? 'w-full' : 'max-w-2xl m-auto'}>
      <Header />
      { children }
      <Footer />
    </div>
  );
}

export default Layout;
