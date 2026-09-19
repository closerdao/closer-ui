// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Load next.config.js and .env files in the test environment
  dir: './',
});

const customJestConfig = {
  testEnvironment: 'jest-environment-jsdom',
  testMatch: ['**/__tests__/**/*.test.js', '**/__tests__/**/*.test.ts'],
  cacheDirectory: '<rootDir>/.jest-cache',
};

module.exports = createJestConfig(customJestConfig);
