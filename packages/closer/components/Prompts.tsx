import Link from 'next/link';

import { useEffect, useState } from 'react';

import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';

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
    <button
      onClick={() => closePrompt(promptName || '')}
      className="absolute top-1.5 right-1.5 p-0.5 text-gray-400 hover:text-gray-700 transition-colors"
      aria-label="Close"
    >
      <X className="w-4 h-4" />
    </button>
  );
};

const AddPhotoPrompt = ({ closePrompt }: PromptCloseButtonProps) => {
  const t = useTranslations();
  const { user, setUser } = useAuth();
  const [photo, setPhoto] = useState<string | null>(null);

  const hasPhoto = Boolean(photo || user?.photo);
  return (
    <>
      <div className="flex gap-3 items-center flex-1 min-w-0">
        <p className="text-sm">
          {hasPhoto
            ? t('prompt_photo_updated', { name: user?.screenname })
            : t('prompt_add_photo', { name: user?.screenname })}
        </p>
        <div className="shrink-0">
          <UploadPhoto
            isPrompt={true}
            model="user"
            id={user?._id}
            onSave={(id: string | string[]) => {
              const photoId = Array.isArray(id) ? id[0] : id;
              setPhoto(photoId);
              setTimeout(() => setUser({ ...user, photo: photoId } as User), 4000);
            }}
            label={hasPhoto ? t('prompt_change_photo') : t('settings_add_photo')}
          />
        </div>
      </div>
      <PromptCloseButton closePrompt={closePrompt} promptName="AddPhotoPrompt" />
    </>
  );
};

const FundraiserPrompt = ({ closePrompt }: PromptCloseButtonProps) => {
  const t = useTranslations();
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
      <div className="flex gap-3 items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <Link
            href="/invest"
            className="bg-white min-w-[40px] h-6 flex items-center justify-center rounded-md"
          >
            <IconPlay className="w-4 h-4" />
          </Link>
          <span className="text-sm">{t('prompt_fundraiser_text')}</span>
        </div>
        <LinkButton
          size="small"
          className="max-h-[34px] p-0 px-4 shrink-0"
          href="/invest"
        >
          {t('prompt_fundraiser_cta')}
        </LinkButton>
      </div>
      <PromptCloseButton closePrompt={closePrompt} promptName="FundraiserPrompt" />
    </>
  );
};
const PreferencesPrompt = ({ closePrompt }: PromptCloseButtonProps) => {
  const t = useTranslations();
  return (
    <>
      <p className="text-sm">
        {t.rich('prompt_preferences_text', {
          link: (chunks) => (
            <Link className="underline" href="/settings/#recommended">
              {chunks}
            </Link>
          ),
        })}
      </p>
      <PromptCloseButton closePrompt={closePrompt} promptName="PreferencesPrompt" />
    </>
  );
};

const AirdropPrompt = ({ closePrompt }: PromptCloseButtonProps) => {
  const t = useTranslations();
  return (
    <>
      <div className="flex gap-3 items-center w-full">
        <p className="text-sm flex-1">
          {t('prompt_airdrop_text')}
        </p>
        <LinkButton
          size="small"
          className="max-h-[34px] p-0 px-4 shrink-0"
          href="/airdrop"
        >
          {t('prompt_airdrop_cta')}
        </LinkButton>
      </div>
      <PromptCloseButton closePrompt={closePrompt} promptName="AirdropPrompt" />
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
    <div className="w-full flex justify-center bg-accent-light">
      <div className="relative max-w-screen-xl w-full mx-auto px-6 py-2 pr-10 flex text-left gap-2">
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
