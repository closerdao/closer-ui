export const getVimeoIdFromURL = (videoUrl: string) => {
  const urlSplit = videoUrl.split('/');
  return urlSplit[urlSplit.length - 1];
};

export const getYoutubeIdFromURL = (url: string) => {
  const regExp =
    /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;

  const match = url.match(regExp);

  if (match && match[2].length === 11) {
    return match[2];
  }

  console.log('The supplied URL is not a valid youtube URL');

  return '';
};

export const capitalizeFirstLetter = (string: string) => {
  return string?.charAt(0).toUpperCase() + string?.slice(1);
};

export const getVideoPlatform = (videoUrl: string) => {
  if (videoUrl.includes('youtube.com/')) return 'youtube';
  if (videoUrl.includes('vimeo.com/')) return 'vimeo';
};
