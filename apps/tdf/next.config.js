// This file sets a custom webpack configuration to use your Next.js app
// with Sentry.
// https://nextjs.org/docs/api-reference/next.config.js/introduction
// https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

// const extractedHostnameRegex = /^(?:https?:\/\/)?([^\/]+)/;
// const hostname = process.env.NEXT_PUBLIC_CDN_URL.match(extractedHostnameRegex)[1];

const moduleExports = {
  reactStrictMode: true,
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
