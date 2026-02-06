// const extractedHostnameRegex = /^(?:https?:\/\/)?([^\/]+)/;
// const hostname = process.env.NEXT_PUBLIC_CDN_URL.match(extractedHostnameRegex)[1];

const withMDX = require('@next/mdx')({
  extension: /\.mdx?$/,
  options: {
    // If you use remark-gfm, you'll need to use next.config.mjs
    // as the package is ESM only
    // https://github.com/remarkjs/remark-gfm#install
    remarkPlugins: [],
    rehypePlugins: [],
    // If you use `MDXProvider`, uncomment the following line.
    // providerImportSource: "@mdx-js/react",
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // If set to true, there are some infinite loops occuring with our loadData
  // https://stackoverflow.com/questions/60618844/react-hooks-useeffect-is-called-twice-even-if-an-empty-array-is-used-as-an-ar
  i18n: {
    locales: ['en', 'pl'],
    defaultLocale: 'en',
  },
  reactStrictMode: false,
  transpilePackages: [
    'closer',
    '@reown/appkit',
    '@reown/appkit-adapter-ethers5',
    '@reown/appkit-common',
    '@reown/appkit-controllers',
    '@reown/appkit-pay',
    '@reown/appkit-polyfills',
    '@reown/appkit-scaffold-ui',
    '@reown/appkit-ui',
    '@reown/appkit-utils',
    '@reown/appkit-wallet',
  ],
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
  images: {
    remotePatterns: [
      {
        hostname: 'cdn.oasa.co',
      },
    ],
  },
  webpack: (config) => {
    config.experiments = { 
      topLevelAwait: true 
    };
    return config;
  },
};

// Merge MDX config with Next.js config
module.exports = withMDX(nextConfig);
