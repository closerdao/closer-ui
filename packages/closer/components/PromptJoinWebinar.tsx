import { useEffect, useRef, useState } from 'react';

import { FaTimes } from '@react-icons/all-files/fa/FaTimes';
import { api, Button, Heading, Input, useAuth } from 'closer';

const PromptJoinWebinar = ({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  const closedByUser = useRef(false);

  const [email, setEmail] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (isLoading) {
      return;
    }
    const isSubscriber = Boolean(localStorage.getItem('email'));

    if (isAuthenticated) {
      setEmail(user?.email || '');
    }
    if (isSubscriber && !isAuthenticated && !isLoading) {
      setEmail(localStorage.getItem('email') || '');
      // setOpen(false);
    } else {
      // setOpen(true);
    }
  }, [isAuthenticated, isLoading, user]);

  const handleDrawerClose = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      closedByUser.current = true;
    }
  };

  const handleSubscriptionSuccess = (email: string) => {
    localStorage.setItem('email', email);
  };

  const sendInvite = async() => {
    console.log('sendInvite', email);

    const res = await api.get(`/webinar-invite?email=${encodeURIComponent(email)}`);

    console.log('res=', res);

    if (res.status === 200) {
      setIsSuccess(true);
    }
  };

  return (
    <>
      {open && (
        <section className="fixed inset-x-0 bottom-0 z-50 mt-24 flex h-[150px] flex-col rounded-t-[10px] bg-white border-accent border-t-2">
          <div className="mx-auto max-w-sm p-4">
            <Heading level={3} className="mb-4">
              Join our next webinar
            </Heading>

            <div className="flex gap-4">
              <Input
                type="text"
                className="bg-white border !border-gray-400 rounded-md p-2 w-[140px] sm:w-[180px]"
                value={email}
                placeholder="Your email"
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button size="small" onClick={sendInvite} variant="secondary">
                Get invitation
              </Button>
            </div>

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
    </>
  );
};

export default PromptJoinWebinar;
