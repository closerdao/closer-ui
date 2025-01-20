import Image from 'next/image';

import { Dispatch, SetStateAction } from 'react';

import { useTranslations } from 'next-intl';

import { cdn } from '../../utils/api';
import LearnVimeoEmbed from '../LearnVimeoEmbed';
import LearnYoutubeEmbed from '../LearnYoutubeEmbed';
import { Heading, LinkButton } from '../ui';

interface Props {
  videoParams: {
    platform: string;
    embedId: string;
  };
  isUnlocked: boolean;
  setIsVideoLoading: Dispatch<SetStateAction<boolean>>;
  isVideoLoading: boolean;
  getAccessUrl: string;
  imageUrl: string;
}

const LessonVideo = ({
  videoParams,
  isUnlocked,
  setIsVideoLoading,
  isVideoLoading,
  getAccessUrl,
  imageUrl,
}: Props) => {
  const t = useTranslations();
  const { platform, embedId } = videoParams;

  const handleVideoLoad = () => {
    setIsVideoLoading(false);
  };
  return (
    <div className="rounded-md overflow-hidden h-[400px] w-full bg-accent-light flex justify-center items-center">
      {!videoParams.embedId && (
        <Image
          src={`${cdn}${imageUrl}-max-lg.jpg`}
          alt="Lesson Image"
          width={615}
          height={503}
          className="object-cover w-full h-full"
        />
      )}
      {isUnlocked ? (
        <>
          {platform === 'vimeo' && (
            <LearnVimeoEmbed
              isVideoLoading={isVideoLoading}
              onLoad={handleVideoLoad}
              embedId={embedId}
            />
          )}
          {platform === 'youtube' && (
            <LearnYoutubeEmbed
              isVideoLoading={isVideoLoading}
              onLoad={handleVideoLoad}
              embedId={embedId}
            />
          )}
        </>
      ) : (
        <div className="w-60 text-center flex flex-col gap-4 items-center">
          <Heading level={2}>{t('learn_cta')}</Heading>

          <LinkButton href={getAccessUrl} className="w-[200px]">
            {t('learn_get_access_button')}
          </LinkButton>
        </div>
      )}
    </div>
  );
};
export default LessonVideo;
