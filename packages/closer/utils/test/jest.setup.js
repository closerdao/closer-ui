// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`
// Used for __tests__/testing-library.js
// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom/extend-expect';
import { configure } from '@testing-library/react';

// findBy*/waitFor default to 1s, which a starved worker blows through when the
// whole monorepo's suites run in parallel.
configure({ asyncUtilTimeout: 5000 });

jest.mock('p-try');
