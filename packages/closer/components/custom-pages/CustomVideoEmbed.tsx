import React from 'react';

import GenericYoutubeEmbed from '../GenericYoutubeEmbed';

const CustomVideoEmbed: React.FC<{
  content: {
    embedId: string;
  };
}> = ({ content }) => (
  <section className={`w-full flex  justify-center  text-md`}>
    <div className='w-full max-w-4xl  aspect-video mx-auto'>
      {content.embedId && <GenericYoutubeEmbed embedId={content.embedId} />}
    </div>
  </section>
);

export default CustomVideoEmbed;
