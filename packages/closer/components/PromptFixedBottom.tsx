import { useRouter } from 'next/router';

import { useEffect, useRef, useState } from 'react';

import { FaTimes } from '@react-icons/all-files/fa/FaTimes';
import { Button, Heading, Newsletter, useAuth } from 'closer';
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
    <div>
      <section
        className={`fixed inset-x-0 bottom-0 z-50 mt-24 flex h-[150px] flex-col shadow-[0_0_5px_-1px_rgba(0,0,0,0.1),0_0_4px_-2px_rgba(0,0,0,0.1)] bg-white transition-transform duration-300 ease-out ${
          isVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="mx-auto max-w-sm p-4">
          <Heading level={3} className="mb-4">
            {t('stay_in_touch')}
          </Heading>
          <Newsletter
            placement="HomePagePrompt"
            ctaText={hasSubscribed ? 'Thanks for subscribing!' : 'Subscribe'}
            onSuccess={handleSubscriptionSuccess}
            className="px-0 pt-0 pb-4 sm:w-full"
          />
          <Button
            onClick={() => handleDrawerClose(false)}
            variant="secondary"
            size="small"
            className="my-4 absolute right-4 top-0 w-10 h-10 p-0"
          >
            <FaTimes className="w-4 h-4" />
          </Button>
        </div>
      </section>
    </div>
  );
};

export default PromptFixedBottom;
