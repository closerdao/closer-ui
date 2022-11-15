import ReactGA from 'react-ga';

import { GA_ANALYTICS } from '../config';

export const initAnalytics = () => {
  if (GA_ANALYTICS) {
    console.log(`Start Analytics ${GA_ANALYTICS}`);
    ReactGA.initialize(GA_ANALYTICS);
  }
};

export const trackPageView = () => {
  ReactGA.set({ page: window.location.pathname });
  ReactGA.pageview(window.location.pathname);
};

export const trackEvent = (category, action) => {
  ReactGA.event({
    category,
    action,
  });
};
