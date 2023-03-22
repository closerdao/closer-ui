// This file sets a custom webpack configuration to use your Next.js app
// with Sentry.
// https://nextjs.org/docs/api-reference/next.config.js/introduction
// https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
// const { withSentryConfig } = require('@sentry/nextjs');

const moduleExports = {
  reactStrictMode: true,
  transpilePackages: ['closer'],
  // sentry: {
  //   hideSourcemaps: true,
  // },
};

// const sentryWebpackPluginOptions = {
//   silent: true,
// };

// module.exports = withSentryConfig(moduleExports, sentryWebpackPluginOptions);
module.exports = moduleExports;
