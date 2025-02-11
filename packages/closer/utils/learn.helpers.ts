import { Lesson } from '../types/lesson';

export const getVimeoIdFromURL = (videoUrl: string) => {
  const urlSplit = videoUrl.split('/');
  return urlSplit[urlSplit.length - 1];
};

export const getYoutubeIdFromURL = (url: string) => {
  const regExp =
    /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|live\/)([^#\&\?]*).*/;

  const match = url.match(regExp);

  if (match && match[2].length === 11) {
    return match[2];
  }

  return '';
};

export const capitalizeFirstLetter = (string: string) => {
  return string?.charAt(0).toUpperCase() + string?.slice(1);
};

export const getVideoPlatform = (videoUrl: string): string => {
  if (videoUrl.includes('youtube.com/')) return 'youtube';
  if (videoUrl.includes('vimeo.com/')) return 'vimeo';
  return '';
};

export const getEmbedIdFromURL = (url: string | undefined) => {
  if (!url) return '';
  const platform = getVideoPlatform(url);
  if (platform === 'vimeo') return getVimeoIdFromURL(url);
  if (platform === 'youtube') return getYoutubeIdFromURL(url);
  return '';
};

export const getVideoParams = (
  lessonId: null | string,
  lesson: Lesson,
  isVideoPreview: boolean,
): { embedId: string; platform: string } => {
  if (lessonId) {
    const currentModule = lesson?.modules?.find((module) =>
      module.lessons.find((lesson) => lesson._id === lessonId),
    );

    const currentLesson = currentModule?.lessons.find(
      (lesson) => lesson._id === lessonId,
    );

    if (currentLesson?.isFree) {
      const videoUrl = currentLesson.videoUrl;
      return {
        embedId: getEmbedIdFromURL(videoUrl) || '',
        platform: getVideoPlatform(videoUrl) || '',
      };
    }

    const videoUrl = currentLesson?.videoUrl || '';
    console.log('videoUrl=', videoUrl);
    return {
      embedId: getEmbedIdFromURL(videoUrl) || '',
      platform: getVideoPlatform(videoUrl) || '',
    };
  }

  if (lesson?.previewVideo && !lesson?.fullVideo && isVideoPreview) {
    return {
      embedId: getEmbedIdFromURL(lesson?.previewVideo) || '',
      platform: getVideoPlatform(lesson?.previewVideo) || '',
    };
  }

  if (lesson?.fullVideo && !isVideoPreview) {
    return {
      embedId: getEmbedIdFromURL(lesson?.fullVideo) || '',
      platform: getVideoPlatform(lesson?.fullVideo) || '',
    };
  }

  return {
    embedId: getEmbedIdFromURL(lesson?.previewVideo) || '',
    platform: getVideoPlatform(lesson?.previewVideo) || '',
  };

};
