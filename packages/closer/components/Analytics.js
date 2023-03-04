import ReactGA from 'react-ga';
import { event } from 'nextjs-google-analytics';

import { GA_ANALYTICS } from '../config';

const splits = {};

export const initAnalytics = () => {
  console.log(`Start Analytics ${GA_ANALYTICS}`);
  ReactGA.initialize(GA_ANALYTICS);
  const splitTests = localStorage.getItem('splits');
};

export const trackPageView = () => {
  ReactGA.set({ page: window.location.pathname });
  ReactGA.pageview(window.location.pathname);
};

/**
 * arg category String [Page] I.e. Homepage, MemberProfile, Footer
 * arg action
 */
export const trackEvent = (category, action) => {
  if (window.logLevel > 1) {
    console.log(category, action)
  }

  event({category, label: action})
  // ReactGA.event({
  //   category,
  //   action,
  // });
};

export default {
  trackEvent,
  trackPageView,
  initAnalytics
}
