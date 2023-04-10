// This file sets a custom webpack configuration to use your Next.js app
// with Sentry.
// https://nextjs.org/docs/api-reference/next.config.js/introduction
// https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

// const extractedHostnameRegex = /^(?:https?:\/\/)?([^\/]+)/;
// const hostname = process.env.NEXT_PUBLIC_CDN_URL.match(extractedHostnameRegex)[1];

const moduleExports = {
  // If set to true, there are some infinite loops occuring with our loadData
  // https://stackoverflow.com/questions/60618844/react-hooks-useeffect-is-called-twice-even-if-an-empty-array-is-used-as-an-ar
  reactStrictMode: false,
  transpilePackages: ['closer'],
  presets: ["next/babel"],
  images: {
    remotePatterns: [
      {
        hostname: 'cdn.oasa.co',
      },
    ],
  },
};

module.exports = moduleExports;
