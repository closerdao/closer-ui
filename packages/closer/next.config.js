const withMDX = require('@next/mdx')({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [],
    rehypePlugins: [],
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
  swcMinify: false,
  experimental: {
    forceSwcTransforms: false,
  },
  images: {
    remotePatterns: [
      {
        hostname: 'cdn.oasa.co',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    config.experiments = {
      topLevelAwait: true,
    };

    return config;
  },
};

// Merge MDX config with Next.js config
module.exports = withMDX(nextConfig);
