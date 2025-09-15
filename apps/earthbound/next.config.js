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
    locales: ['en'],
    defaultLocale: 'en',
  },
  reactStrictMode: false,
  transpilePackages: ['closer'],
  presets: ['next/babel'],
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
  images: {
    remotePatterns: [
      {
        hostname: 'cdn.oasa.co',
        pathname: '/**',
      },
    ],
  },
  webpack: (config) => {
    config.experiments = { 
      topLevelAwait: true 
    };
    return config;
  },
  async redirects() {
    return [
      {
        source: '/invest',
        destination: '/pages/invest',
        permanent: true,
      },
      {
        source: '/community',
        destination: '/pages/community',
        permanent: true,
      },
      {
        source: '/visit',
        destination: '/stay',
        permanent: true,
      },
      {
        source: '/flyer',
        destination: '/pages/community',
        permanent: true, 
      },
    ]
  },
};

// Merge MDX config with Next.js config
module.exports = withMDX(nextConfig);
