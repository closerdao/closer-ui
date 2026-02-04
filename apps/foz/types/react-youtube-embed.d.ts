declare module 'react-youtube-embed' {
  import { FC } from 'react';

  interface YoutubeProps {
    id: string;
  }

  const Youtube: FC<YoutubeProps>;
  export default Youtube;
}
