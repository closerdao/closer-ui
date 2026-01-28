import { useRouter } from 'next/router';

import { useEffect, useRef, useState } from 'react';

import { FaTimes } from '@react-icons/all-files/fa/FaTimes';
import { Newsletter, useAuth } from 'closer';
import { useTranslations } from 'next-intl';

import { useNewsletter } from '../contexts/newsletter';

const PromptFixedBottom = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const t = useTranslations();
  const router = useRouter();

  // Use newsletter context at top level - hooks must be called unconditionally
  const newsletterContext = useNewsletter();
  const setFloatingNewsletterActive =
    newsletterContext?.setFloatingNewsletterActive;
  const setHideFooterNewsletter = newsletterContext?.setHideFooterNewsletter;

  const closedByUser = useRef(false);
  const [hasSubscribed, setHasSubscribed] = useState(false);
  const [open, setOpen] = useState(false);
  const [shouldShowForm, setShouldShowForm] = useState(true);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Check if we're on pages where we don't want to show the prompt
  const isSignupPage = router.pathname === '/signup';
  const isSubscriptionsPage = router.pathname === '/subscriptions';
  const shouldHidePrompt = isSignupPage || isSubscriptionsPage;

  useEffect(() => {
    if (isLoading) {
      return;
    }
    const isSubscriber = Boolean(localStorage.getItem('email'));
    if (isSubscriber && !isAuthenticated && !isLoading) {
      setHasSubscribed(true);
      setOpen(false);
    } else {
      setOpen(true);
    }
  }, [isAuthenticated, isLoading]);

  // 5-second timer
  useEffect(() => {
    if (typeof window === 'undefined' || shouldHidePrompt) {
      return;
    }

    const timer = setTimeout(() => {
      setTimeElapsed(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, [shouldHidePrompt]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const completed = localStorage.getItem('signupCompleted') === 'true';
      if (completed) {
        setShouldShowForm(false);
      }
    }
  }, []);

  // Scroll detection
  useEffect(() => {
    if (typeof window === 'undefined' || shouldHidePrompt) {
      return;
    }

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const scrollThreshold = 300; // Show after scrolling 300px

      if (scrollY > scrollThreshold && !hasScrolled) {
        setHasScrolled(true);
      } else if (scrollY <= scrollThreshold && hasScrolled) {
        setHasScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasScrolled, shouldHidePrompt]);

  // Control visibility with animation
  useEffect(() => {
    const shouldShow =
      open &&
      !isAuthenticated &&
      shouldShowForm &&
      (hasScrolled || timeElapsed) &&
      !shouldHidePrompt;

    if (shouldShow && !isVisible) {
      // Show the prompt
      setIsVisible(true);
    } else if (!shouldShow && isVisible) {
      // Hide the prompt
      setIsVisible(false);
    }

    // Update context state
    if (setFloatingNewsletterActive && setHideFooterNewsletter) {
      setFloatingNewsletterActive(shouldShow);
      setHideFooterNewsletter(shouldShow);
    }
  }, [
    open,
    isAuthenticated,
    shouldShowForm,
    hasScrolled,
    timeElapsed,
    shouldHidePrompt,
    isVisible,
    setFloatingNewsletterActive,
    setHideFooterNewsletter,
  ]);

  const handleDrawerClose = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      closedByUser.current = true;
    }
  };

  const handleSubscriptionSuccess = (email: string) => {
    setHasSubscribed(true);
    localStorage.setItem('email', email);
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 sm:bottom-4 sm:left-1/2 sm:-translate-x-1/2 sm:inset-auto pointer-events-none">
      <section
        className={`pointer-events-auto bg-white/90 backdrop-blur-md border-t border-gray-200 sm:border sm:rounded-full shadow-lg transition-all duration-300 ease-out ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-full sm:translate-y-4 opacity-0'
        }`}
      >
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 sm:gap-4 sm:px-5 sm:py-2.5">
          <p className="text-sm font-medium text-gray-700 hidden min-[1100px]:block whitespace-nowrap">
            {t('stay_in_touch')}
          </p>
          <Newsletter
            placement="HomePagePrompt"
            ctaText={hasSubscribed ? 'Thanks!' : 'Subscribe'}
            onSuccess={handleSubscriptionSuccess}
            className="!p-0 !w-full sm:!w-auto flex-1 sm:flex-none"
          />
          <button
            onClick={() => handleDrawerClose(false)}
            className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors shrink-0"
            aria-label="Close"
          >
            <FaTimes className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>
    </div>
  );
};

export default PromptFixedBottom;
