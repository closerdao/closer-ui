import React from 'react';

import { screen } from '@testing-library/react';

import { renderWithNextIntl } from '../../test/utils';
import { posthog } from '../../utils/posthog';
import ErrorBoundary from './ErrorBoundary';

jest.mock('../../utils/posthog', () => ({
  posthog: {
    captureException: jest.fn(),
  },
}));

const ThrowingComponent = () => {
  throw new Error('Test render crash');
};

describe('ErrorBoundary', () => {
  let consoleError: jest.SpyInstance;
  beforeEach(() => {
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.clearAllMocks();
  });
  afterEach(() => consoleError.mockRestore());

  it('captures caught exception in posthog and renders fallback UI', () => {
    renderWithNextIntl(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Something went wrong')).toBeTruthy();
    expect(posthog.captureException).toHaveBeenCalledTimes(1);
    expect(posthog.captureException).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Test render crash' }),
      expect.objectContaining({ componentStack: expect.any(String) }),
    );
  });
});
