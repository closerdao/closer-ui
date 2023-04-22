// make hostname "cdn.oasa.co" configured under images

module.exports = {
  presets: ["next/babel"],
  images: {
    remotePatterns: [
      {
        hostname: 'cdn.oasa.co',
      },
    ],
  },
};
