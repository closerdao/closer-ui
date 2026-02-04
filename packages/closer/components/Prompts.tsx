import Link from 'next/link';

import { useEffect, useState } from 'react';

import { useAuth } from '../contexts/auth';
import { User } from '../contexts/auth/types';
import {
  calculateFullDaysDifference,
  doAllKeysHaveValues,
} from '../utils/helpers';
import Modal from './Modal';
import UploadPhoto from './UploadPhoto';
import YoutubeEmbed from './YoutubeEmbed';
import { LinkButton } from './ui';
import IconPlay from './ui/IconPlay';

const FUNDRASING_VIDEO_ID = 'VkoqvPcaRpk';
const PROMPTS = [
  'AddPhotoPrompt',
  'FundraiserPrompt',
  'PreferencesPrompt',
  'AirdropPrompt',
];

const REQUIRED_PREFERENCES = [
  'sharedAccomodation',
  'skills',
  'diet',
  'superpower',
  'dream',
  'moreInfo',
  'needs',
];

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

const AddPhotoPrompt = ({ closePrompt }: PromptCloseButtonProps) => {
  const { user, setUser } = useAuth();
  const [photo, setPhoto] = useState<string | null>(null);

  const image = photo || user?.photo;
  return (
    <>
      <div className="flex gap-3 items-center">
        <p>
          It&apos;s nice to have you here {user?.screenname}. Now let&apos;s add
          a photo to your profile ♥️
        </p>

        <div className="flex flex-row justify-center items-center">
          <div className="h-[30px]">
            <UploadPhoto
              isPrompt={true}
              model="user"
              id={user?._id}
              onSave={(id: string | string[]) => {
                // Use the id regardless of type - most likely your logic already handles this
                const photoId = Array.isArray(id) ? id[0] : id;
                setPhoto(photoId);
                setTimeout(() => setUser({ ...user, photo: photoId } as User), 4000);
              }}
              label={image ? 'Change photo' : 'Add photo'}
            />
          </div>
        </div>
      </div>

      <PromptCloseButton
        closePrompt={closePrompt}
        promptName="AddPhotoPrompt"
      />
    </>
  );
};

const FundraiserPrompt = ({ closePrompt }: PromptCloseButtonProps) => {
  const [isInfoModalOpened, setIsInfoModalOpened] = useState(false);

  const closeModal = () => {
    setIsInfoModalOpened(false);
  };

  return (
    <>
      {isInfoModalOpened && (
        <Modal closeModal={closeModal} doesShowVideo={true}>
          <YoutubeEmbed embedId={FUNDRASING_VIDEO_ID} />
        </Modal>
      )}

      <div className=" flex gap-3 justify-between w-full">
        <div className="flex justify-start sm:items-center gap-2">
          <Link
            href="/invest"
            className="bg-white min-w-[40px] h-6 flex items-center justify-center rounded-md"
          >
            <IconPlay className="w-4 h-4" />
          </Link>
          <span>We are looking for 300 dreamers to make TDF a reality</span>
        </div>
        <div className="flex items-end justify-end sm:items-center gap-2 flex-col-reverse sm:flex-row">
          <LinkButton
            size="small"
            className="max-h-[34px] p-0 px-4"
            href="/invest"
          >
            Support TDF
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
const PreferencesPrompt = ({ closePrompt }: PromptCloseButtonProps) => {
  return (
    <>
      <div className=" flex gap-3 justify-between w-full">
        <div className="flex items-center gap-1 ">
          <span>
            Complete setting up your profile by filling{' '}
            <Link className="underline" href="/settings/#recommended">
              recommended preferences
            </Link>
          </span>{' '}
        </div>
        <div></div>
      </div>

      <PromptCloseButton
        closePrompt={closePrompt}
        promptName="PreferencesPrompt"
      />
    </>
  );
};

const AirdropPrompt = ({ closePrompt }: PromptCloseButtonProps) => {
  return (
    <>
      <div className=" flex gap-3 justify-between w-full">
        <div className="flex justify-start flex-col sm:flex-row sm:items-center gap-2">
          <span>
            We are doing an airdrop! A way to send gifts for past visits,
            volunteering, governance participation, and wallet interactions with
            the $TDF token.
          </span>
          <LinkButton
            size="small"
            className="max-h-[34px] p-0 px-4 w-[200px]"
            href="/airdrop"
          >
            see how you qualify{' '}
          </LinkButton>
        </div>
        <div className="flex items-end justify-end sm:items-center gap-2 flex-col-reverse sm:flex-row">
          <PromptCloseButton
            closePrompt={closePrompt}
            promptName="AirdropPrompt"
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
  const hasUserFilledPreferences = doAllKeysHaveValues(
    user?.preferences,
    REQUIRED_PREFERENCES,
  );
  const closedPrompts = getClosedPrompts();

  // if (
  //   (!isAuthenticated && !closedPrompts.includes('AirdropPrompt')) ||
  //   (isAuthenticated &&
  //     daysUserCreated > 3 &&
  //     !closedPrompts.includes('AirdropPrompt'))
  // ) {
  //   return 'AirdropPrompt';
  // }
  if (
    isAuthenticated &&
    !user?.photo &&
    !closedPrompts.includes('AddPhotoPrompt')
  ) {
    return 'AddPhotoPrompt';
  }
  // if (
  //   (!isAuthenticated && !closedPrompts.includes('FundraiserPrompt')) ||
  //   (isAuthenticated &&
  //     daysUserCreated > 3 &&
  //     !closedPrompts.includes('FundraiserPrompt'))
  // ) {
  //   return 'FundraiserPrompt';
  // }
  if (
    isAuthenticated &&
    (!user?.preferences || !hasUserFilledPreferences) &&
    !closedPrompts.includes('PreferencesPrompt')
  ) {
    return 'PreferencesPrompt';
  }
  return null;
};

const Prompts = () => {
  const { user, isAuthenticated, refetchUser } = useAuth();
  const [promptTosShow, setPromptTosShow] = useState<string | null>(null);

  useEffect(() => {
    setPromptTosShow(getPromptToShow(user, isAuthenticated));
  }, []);

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
        {promptTosShow === 'AddPhotoPrompt' && (
          <AddPhotoPrompt closePrompt={closePrompt} />
        )}
        {promptTosShow === 'FundraiserPrompt' && (
          <FundraiserPrompt closePrompt={closePrompt} />
        )}
        {promptTosShow === 'PreferencesPrompt' && (
          <PreferencesPrompt closePrompt={closePrompt} />
        )}
        {promptTosShow === 'AirdropPrompt' && (
          <AirdropPrompt closePrompt={closePrompt} />
        )}
      </div>
    </div>
  );
};

export default Prompts;
