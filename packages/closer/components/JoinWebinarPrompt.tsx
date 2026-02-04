import React, { useEffect, useState } from 'react';

import { X } from 'lucide-react';
import { z } from 'zod';

import api from '../utils/api';
import TurnstileWidget from './TurnstileWidget';
import { Button, Heading, Input } from './ui';

// Email validation schema
const emailSchema = z
  .string()
  .email({ message: 'Please enter a valid email address' });

const JoinWebinarPrompt = ({
  setIsPromptOpen,
  tags,
}: {
  setIsPromptOpen: (isOpen: boolean) => void;
  tags?: string[];
}) => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  useEffect(() => {
    const localEmail = localStorage.getItem('email');
    if (localEmail) {
      setEmail(localEmail);
    }
  }, []);

  const sendInvite = async () => {
    // Validate email before sending
    try {
      setIsLoading(true);
      emailSchema.parse(email);
      setEmailError(null);

      await api.post('/webinar', {
        email,
        tags: (tags?.length ? tags : ['webinar']),
        turnstileToken,
      });
      setIsSuccess(true);
    } catch (error) {
      if (error instanceof z.ZodError) {
        setEmailError(error.errors[0].message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrawerClose = (isOpen: boolean) => {
    setIsPromptOpen(isOpen);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);

    // Clear error when user starts typing
    if (emailError) {
      setEmailError(null);
    }
  };

  return (
    <div>
      {
        <section className="fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto flex-col shadow-[0_0_5px_-1px_rgba(0,0,0,0.1),0_0_4px_-2px_rgba(0,0,0,0.1)] bg-white">
          <div className="mx-auto max-w-sm p-4 flex flex-col gap-4">
            <div>
              <Heading level={3} className="">
                Join webinar
              </Heading>
              <p className="pr-8">Get an invite to our next monthly webinar</p>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  value={email}
                  onChange={handleEmailChange}
                  type="text"
                  placeholder="Email"
                  className="w-[200px]"
                />
                <Button
                  isEnabled={!isLoading && !!turnstileToken}
                  onClick={sendInvite}
                  className="w-fit"
                >
                  Join webinar
                </Button>
              </div>
              <TurnstileWidget
                action="webinar_signup"
                onVerify={setTurnstileToken}
              />
              {isSuccess && (
                <p className="text-green-500 text-sm">
                  Webinar invite sent! Please check your inbox.
                </p>
              )}
              {emailError && (
                <p className="text-red-500 text-sm">{emailError}</p>
              )}
            </div>
            <Button
              onClick={() => handleDrawerClose(false)}
              variant="secondary"
              size="small"
              className="my-4 absolute right-4 top-0 w-10 h-10 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </section>
      }
    </div>
  );
};

export default JoinWebinarPrompt;
