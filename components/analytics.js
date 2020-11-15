import ReactGA from 'react-ga';

export const initAnalytics = () => {
  ReactGA.initialize('UA-178334677-1');
};

export const trackPageView = () => {
  ReactGA.set({ page: window.location.pathname });
  ReactGA.pageview(window.location.pathname);
};

export const trackEvent = (category, action) => {
  ReactGA.event({
    category,
    action
  });
};
