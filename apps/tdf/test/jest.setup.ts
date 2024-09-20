import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import MockRouter from 'next-router-mock';

import { server } from './server';

export function setupMockRouter() {
  MockRouter.push('/'); // Reset to a default route
}


// Establish API mocking before all tests.
beforeAll(() => server.listen());

beforeEach(() => {
  setupMockRouter();
});
// Reset any request handlers that we may add during the tests,
// so they don't affect other tests.
afterEach(() => server.resetHandlers());
// Clean up after the tests are finished.
afterAll(() => {
  cleanup();
  server.close();
});
