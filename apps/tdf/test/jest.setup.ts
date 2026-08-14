import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { syncCurrencyLocaleFromCountryCode } from 'closer/utils/currencyFormat';

import { server } from './server';

// In production TDF's saved config (`general.country: 'PT'`) drives the
// currency locale via applyCurrencyLocaleFromGeneralConfig. The schema
// defaults are brand-neutral (#946), so tests must set TDF's locale
// explicitly, as the app does at config load.
syncCurrencyLocaleFromCountryCode('PT');

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
