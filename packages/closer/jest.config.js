const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/utils/test/jest.setup.js'],
  setupFiles: ['<rootDir>/test/jest.mocks.tsx'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^next/router$': 'next-router-mock',
    '^next/dist/client/router$': 'next-router-mock',
    '^@reown/appkit/react$': '<rootDir>/test/__mocks__/reown-appkit-react.js',
    '^@reown/appkit/networks$': '<rootDir>/test/__mocks__/appkit.js',
    '(.*)/appkit$': '<rootDir>/test/__mocks__/appkit.js',
    '^utils/api$': '<rootDir>/test/__mocks__/api.js',
    '^(\\.\\./)+utils/api$': '<rootDir>/test/__mocks__/api.js',
  },
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)