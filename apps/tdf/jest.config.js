// eslint-disable-next-line @typescript-eslint/no-var-requires
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  // The monorepo runs every package's suite in parallel under turbo, so a worker
  // can be starved for seconds at a time. Give tests room rather than failing
  // on machine load.
  testTimeout: 30000,
  // Half the cores each, so closer + tdf together do not oversubscribe the box.
  maxWorkers: '50%',
  cacheDirectory: '<rootDir>/.jest-cache',
  // Add more setup options before each test is run
  setupFilesAfterEnv: ['<rootDir>/test/jest.setup.ts'],
  setupFiles: ['<rootDir>/test/jest.mocks.tsx'],
  moduleDirectories: ['node_modules', '<rootDir>/'],
  testEnvironment: 'jest-environment-jsdom',
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  moduleNameMapper: {
    // pnpm can resolve a second copy of these; pin every import to this app's copy.
    '^react$': require.resolve('react'),
    '^react-dom$': require.resolve('react-dom'),
    '^react-dom/(.*)$': 'react-dom/$1',
    '^react-markdown$':
      '<rootDir>/../../packages/closer/test/__mocks__/react-markdown.js',
    '@/(.*)': '<rootDir>/$1',
    '^next-router-mock$': require.resolve('next-router-mock'),
    '^next/router$': require.resolve('next-router-mock'),
    '^next/dist/client/router$': require.resolve('next-router-mock'),
    '^msw$': require.resolve('msw'),
    '^msw/node$': require.resolve('msw/node'),
    '^@reown/appkit/react$':
      '<rootDir>/../../packages/closer/test/__mocks__/reown-appkit-react.js',
    '^@reown/appkit/networks$':
      '<rootDir>/../../packages/closer/test/__mocks__/appkit.js',
    '(.*)/appkit$': '<rootDir>/../../packages/closer/test/__mocks__/appkit.js',
  },
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
