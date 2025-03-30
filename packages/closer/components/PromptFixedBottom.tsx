import { useEffect, useRef, useState } from 'react';

import { FaTimes } from '@react-icons/all-files/fa/FaTimes';
import { Button, Heading, Newsletter, useAuth } from 'closer';

const PromptFixedBottom = () => {
  const { isAuthenticated, isLoading } = useAuth();

  const closedByUser = useRef(false);

  const [hasSubscribed, setHasSubscribed] = useState(false);
  const [open, setOpen] = useState(false);

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
      {open && !isAuthenticated && (
        <section className="fixed inset-x-0 bottom-0 z-50 mt-24 flex h-[150px] flex-col rounded-t-[10px] bg-white border border-t-2">
          <div className="mx-auto max-w-sm p-4">
            <Heading level={3} className="mb-4">
              Stay in touch
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
