import Head from 'next/head';

import { FC } from 'react';

interface Props {
  imageId: string;
  title: string;
  description: string;
}

const Metatags: FC<Props> = ({ imageId, title, description }) => {
  const cdn = process.env.NEXT_PUBLIC_CDN_URL;
  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta property="og:type" content="event" />
      {imageId && (
        <meta
          key="og:image"
          property="og:image"
          content={`${cdn}${imageId}-place-lg.jpg`}
        />
      )}
      {imageId && (
        <meta
          key="twitter:image"
          name="twitter:image"
          content={`${cdn}${imageId}-place-lg.jpg`}
        />
      )}
    </Head>
  );
};

export default Metatags;
