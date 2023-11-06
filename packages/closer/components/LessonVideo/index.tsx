import React, { Dispatch, SetStateAction } from 'react';

import { __ } from '../../utils/helpers';
import {
  getVideoPlatform,
  getVimeoIdFromURL,
  getYoutubeIdFromURL,
} from '../../utils/learn.helpers';
import LearnVimeoEmbed from '../LearnVimeoEmbed';
import LearnYoutubeEmbed from '../LearnYoutubeEmbed';
import { Heading, LinkButton } from '../ui';

interface Props {
  videoUrl: string;
  isUnlocked: boolean;
  setIsVideoLoading: Dispatch<SetStateAction<boolean>>;
  isVideoLoading: boolean;
  getAccessUrl: string;
}

const LessonVideo = ({
  videoUrl,
  isUnlocked,
  setIsVideoLoading,
  isVideoLoading,
  getAccessUrl,
}: Props) => {
  const videoPlatform = getVideoPlatform(videoUrl);
  const embedId =
    videoPlatform === 'vimeo'
      ? getVimeoIdFromURL(videoUrl)
      : getYoutubeIdFromURL(videoUrl);

  const handleVideoLoad = () => {
    setIsVideoLoading(false);
  };
  return (
    <div className="rounded-md overflow-hidden h-[400px] w-full bg-accent-light flex justify-center items-center">
      {isUnlocked ? (
        <>
          {videoPlatform === 'vimeo' && (
            <LearnVimeoEmbed
              isVideoLoading={isVideoLoading}
              onLoad={handleVideoLoad}
              embedId={embedId}
            />
          )}
          {videoPlatform === 'youtube' && (
            <LearnYoutubeEmbed
              isVideoLoading={isVideoLoading}
              onLoad={handleVideoLoad}
              embedId={embedId}
            />
          )}
        </>
      ) : (
        <div className="w-60 text-center flex flex-col gap-4 items-center">
          <Heading level={2}>{__('learn_cta')}</Heading>

          <LinkButton href={getAccessUrl} className="w-[200px]">
            {__('learn_get_access_button')}
          </LinkButton>
        </div>
      )}
    </div>
  );
};
export default LessonVideo;
