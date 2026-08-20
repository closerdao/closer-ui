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

// jsdom ships neither WebCrypto nor TextEncoder, so anything that hashes in the
// browser - the proposal proof digest, for one - would otherwise be untestable
// here. Node's own implementations are the same primitives a browser exposes.
if (!globalThis.crypto?.subtle) {
  const { webcrypto } = require('crypto');

  Object.defineProperty(globalThis, 'crypto', {
    value: webcrypto,
    configurable: true,
  });
}

if (typeof globalThis.TextEncoder === 'undefined') {
  const { TextDecoder, TextEncoder } = require('util');

  Object.assign(globalThis, { TextDecoder, TextEncoder });
}
