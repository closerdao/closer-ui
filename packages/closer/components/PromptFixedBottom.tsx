import { useEffect, useRef, useState } from 'react';

import { FaTimes } from '@react-icons/all-files/fa/FaTimes';
import { Button, Heading, Newsletter, useAuth } from 'closer';
import { useRouter } from 'next/router';
import { useTranslations } from 'next-intl';

import { useNewsletter } from '../contexts/newsletter';

const PromptFixedBottom = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const t = useTranslations();
  const router = useRouter();
  
  // Safely use newsletter context
  let setFloatingNewsletterActive: ((active: boolean) => void) | undefined;
  let setHideFooterNewsletter: ((hide: boolean) => void) | undefined;
  try {
    const newsletterContext = useNewsletter();
    setFloatingNewsletterActive = newsletterContext.setFloatingNewsletterActive;
    setHideFooterNewsletter = newsletterContext.setHideFooterNewsletter;
  } catch (error) {
    // Context not available during SSR, that's okay
  }

  const closedByUser = useRef(false);
  const [hasSubscribed, setHasSubscribed] = useState(false);
  const [open, setOpen] = useState(false);
  const [shouldShowForm, setShouldShowForm] = useState(true);
  const [hasScrolled, setHasScrolled] = useState(false);

  // Check if we're on the signup page
  const isSignupPage = router.pathname === '/signup';

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
    if (typeof window === 'undefined' || isSignupPage) {
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
  }, [hasScrolled, isSignupPage]);

  useEffect(() => {
    if (setFloatingNewsletterActive && setHideFooterNewsletter) {
      const shouldShow = open && !isAuthenticated && shouldShowForm && hasScrolled && !isSignupPage;
      setFloatingNewsletterActive(shouldShow);
      setHideFooterNewsletter(shouldShow);
    }
  }, [open, isAuthenticated, shouldShowForm, hasScrolled, isSignupPage, setFloatingNewsletterActive, setHideFooterNewsletter]);

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
      {open && !isAuthenticated && shouldShowForm && hasScrolled && !isSignupPage && (
        <section className="fixed inset-x-0 bottom-0 z-50 mt-24 flex h-[150px] flex-col  shadow-[0_0_5px_-1px_rgba(0,0,0,0.1),0_0_4px_-2px_rgba(0,0,0,0.1)] bg-white">
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
      )}
    </div>
  );
};

export default PromptFixedBottom;
