import Link from 'next/link';

import { useEffect, useState } from 'react';

import { LinkButton, calculateFullDaysDifference } from 'closer';
import { useAuth } from 'closer/contexts/auth';
import { User } from 'closer/contexts/auth/types';

const PROMPTS = ['FillSettingsPrompt', 'FundraiserPrompt'];

interface PromptCloseButtonProps {
  closePrompt: (promptName: string) => void;
  promptName?: string;
}

const PromptCloseButton = ({
  closePrompt,
  promptName,
}: PromptCloseButtonProps) => {
  return (
    <div className="flex items-center">
      <Link
        className="p-1 px-3 border  border-gray-500 text-gray-500 rounded-full"
        href="#"
        onClick={(e) => {
          e.preventDefault();
          closePrompt(promptName || '');
        }}
      >
        X
      </Link>
    </div>
  );
};

const FillSettingsPrompt = ({ closePrompt }: PromptCloseButtonProps) => {
  const { user } = useAuth();
  return (
    <>
      <div className=" flex gap-3 justify-between w-full">
        <div className="flex justify-start sm:items-center gap-2">
          <span>
            Please add description and photo to your profile to book spaces
          </span>
        </div>
        <div className="flex items-end justify-end sm:items-center gap-2 flex-col-reverse sm:flex-row">
          <LinkButton
            size="small"
            className="max-h-[34px] p-0 px-4"
            href={`/members/${user?.slug}`}
          >
            Update profile
          </LinkButton>
          <PromptCloseButton
            closePrompt={closePrompt}
            promptName="FillSettingsPrompt"
          />
        </div>
      </div>
    </>
  );
};
const FundraiserPrompt = ({ closePrompt }: PromptCloseButtonProps) => {
  return (
    <>
      <div className=" flex gap-3 justify-between w-full">
        <div className="flex justify-start sm:items-center gap-2">
          <span>
            MOOS is rediscovering urban living. Help us clear the path.
          </span>
        </div>
        <div className="flex items-end justify-end sm:items-center gap-2 flex-col-reverse sm:flex-row">
          <LinkButton
            size="small"
            className="max-h-[34px] p-0 px-4"
            href="/support-us"
          >
            Support MOOS
          </LinkButton>
          <PromptCloseButton
            closePrompt={closePrompt}
            promptName="FundraiserPrompt"
          />
        </div>
      </div>
    </>
  );
};

const getClosedPrompts = () => {
  return PROMPTS.filter((promptName) => {
    if (typeof window !== 'undefined') {
      const promptClosedAt = localStorage.getItem(`hidePrompt.${promptName}`);
      if (promptClosedAt) {
        const promptClosedAtDate = new Date(promptClosedAt);
        const daysSincePromptClosed =
          calculateFullDaysDifference(promptClosedAtDate);
        if (daysSincePromptClosed < 180) {
          return true;
        }
      }
    }
    return false;
  });
};

const getPromptToShow = (user: User | null, isAuthenticated: boolean) => {

  const daysUserCreated = calculateFullDaysDifference(user?.created);
  const closedPrompts = getClosedPrompts();

  if (isAuthenticated && !closedPrompts.includes('FillSettingsPrompt') && (!user?.photo || !user?.about)) {
    return 'FillSettingsPrompt';
  } else if (
    (!isAuthenticated && !closedPrompts.includes('FundraiserPrompt')) ||
    (isAuthenticated &&
      daysUserCreated > 3 &&
      !closedPrompts.includes('FundraiserPrompt'))
  ) {
    return 'FundraiserPrompt';
  }
  return null;
};

const Prompts = () => {
  const { user, isAuthenticated, refetchUser } = useAuth();
  const [promptTosShow, setPromptTosShow] = useState<string | null>(null);

  useEffect(() => {
    setPromptTosShow(getPromptToShow(user, isAuthenticated));
  }, [user, isAuthenticated]);

  const closePrompt = (promptName: string) => {
    localStorage.setItem(`hidePrompt.${promptName}`, new Date().toISOString());
    setPromptTosShow(getPromptToShow(user, isAuthenticated));
    if (isAuthenticated) {
      refetchUser();
    }
  };

  if (!promptTosShow) {
    return null;
  }

  return (
    <div className="w-full flex justify-center bg-accent-light mb-2">
      <div className="w-[800px] p-2.5 flex justify-between text-left gap-2">
        {promptTosShow === 'FillSettingsPrompt' && (
          <FillSettingsPrompt closePrompt={closePrompt} />
        )}
        {promptTosShow === 'FundraiserPrompt' && (
          <FundraiserPrompt closePrompt={closePrompt} />
        )}
      </div>
    </div>
  );
};

export default Prompts;
