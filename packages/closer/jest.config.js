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
  setupFilesAfterEnv: ['<rootDir>/utils/test/jest.setup.js'],
  setupFiles: ['<rootDir>/test/jest.mocks.tsx'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    // pnpm can resolve a second copy of these; pin every import to this package's copy.
    '^react$': require.resolve('react'),
    '^react-dom$': require.resolve('react-dom'),
    '^react-dom/(.*)$': 'react-dom/$1',
    '^react-markdown$': '<rootDir>/test/__mocks__/react-markdown.js',
    '^next/router$': 'next-router-mock',
    '^next/dist/client/router$': 'next-router-mock',
    '^@reown/appkit/react$': '<rootDir>/test/__mocks__/reown-appkit-react.js',
    '^@reown/appkit/networks$': '<rootDir>/test/__mocks__/appkit.js',
    '(.*)/appkit$': '<rootDir>/test/__mocks__/appkit.js',
    '^utils/api$': '<rootDir>/test/__mocks__/api.js',
    '^(\\.\\./)+utils/api$': '<rootDir>/test/__mocks__/api.js',
  },
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
