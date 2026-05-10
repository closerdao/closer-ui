import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';

import { server } from './server';

const consoleError = console.error;

beforeAll(() => {
  server.listen();
  jest.spyOn(console, 'error').mockImplementation((message, ...args) => {
    if (
      typeof message === 'string' &&
      message.includes('An update to') &&
      message.includes('not wrapped in act')
    ) {
      return;
    }
    consoleError(message, ...args);
  });
});

afterEach(() => server.resetHandlers());

afterAll(() => {
  jest.restoreAllMocks();
  cleanup();
  server.close();
});
