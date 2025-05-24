import React, { useContext, useRef, useState } from 'react';

import { FaTimes } from '@react-icons/all-files/fa/FaTimes';
import { Button, Heading, Input, api } from 'closer';
import { REFERRAL_ID_LOCAL_STORAGE_KEY } from 'closer/constants';
import { useTranslations } from 'next-intl';
import { z } from 'zod';

import type { PromptGetInTouchContextType } from './PromptGetInTouchContext';
import { PromptGetInTouchContext } from './PromptGetInTouchContext';

// Email validation schema
const emailSchema = z
  .string()
  .email({ message: 'Please enter a valid email address' });

const PromptFixedBottomGetInTouch = () => {
  const t = useTranslations();
  const { isOpen, setIsOpen } = useContext(
    PromptGetInTouchContext,
  ) as PromptGetInTouchContextType;

  const closedByUser = useRef(false);

  const [hasSentApplication, setHasSentApplication] = useState(false);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleDrawerClose = (isOpen: boolean) => {
    setIsOpen(false);
    if (!isOpen) {
      closedByUser.current = true;
    }
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    setEmailError('');
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      emailSchema.parse(email);
      setEmailError('');
    } catch (error) {
      if (error instanceof z.ZodError) {
        setEmailError(error.errors[0].message);
      }
      return;
    }

    setIsLoading(true);
    try {
      const referredBy = localStorage.getItem(REFERRAL_ID_LOCAL_STORAGE_KEY);
      const application = { email };
      await api.post('/application', {
        ...application,
        ...(referredBy && { referredBy }),
      });

      setHasSentApplication(true);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {isOpen && (
        <div  className="fixed bg-background/50  inset-0 z-[100] flex items-center justify-center min-h-[600px]">
          <div
            className={
              'p-5 rounded-md relative bg-white z-[101] shadow-lg   '
            }
          >
            <Button
              onClick={() => handleDrawerClose(false)}
              variant="secondary"
              size="small"
              className="my-4 absolute right-4 top-0 w-10 h-10 p-0"
            >
              <FaTimes className="w-4 h-4" />
            </Button>

            <div className={'flex flex-col  '}>
              {' '}
              <div className="mx-auto max-w-sm p-4 flex flex-col">
                <Heading level={3} className="mb-2">
                  {t('get_in_touch')}
                </Heading>
                <div>
                  {hasSentApplication ? (
                    <div className="text-green-600 py-2">
                      {t('email_submitted_success')}
                    </div>
                  ) : (
                    <form
                      onSubmit={handleEmailSubmit}
                      className="flex flex-col  gap-2"
                    >
                      <div className="flex gap-2">
                        <Input
                          id="get-in-touch-email"
                          type="text"
                          value={email}
                          onChange={(e) => handleEmailChange(e.target.value)}
                          placeholder={t('your_email')}
                          isRequired
                          // validation="email"
                          autoFocus
                        />
                        <Button
                          type="submit"
                          variant="primary"
                          size="small"
                          className=" w-fit"
                          isLoading={isLoading}
                        >
                          {t('get_in_touch_submit')}
                        </Button>
                      </div>
                      {emailError && (
                        <div className="text-red-600">{emailError}</div>
                      )}
                    </form>
                  )}
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromptFixedBottomGetInTouch;
