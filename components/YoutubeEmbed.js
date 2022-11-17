import React from 'react';

import PropTypes from 'prop-types';

const YoutubeEmbed = ({ url }) => (
  <div className="video-responsive">
    <iframe
      width="100%"
      height="480"
      src={url}
      frameBorder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    />
  </div>
);

YoutubeEmbed.propTypes = {
  url: PropTypes.string.isRequired,
};

export default YoutubeEmbed;
