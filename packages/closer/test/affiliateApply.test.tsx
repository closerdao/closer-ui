import React from 'react';

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useAuth } from '../contexts/auth';
import AffiliateLandingPage from '../pages/affiliate';
import { renderWithNextIntl } from './utils';

jest.mock('../contexts/auth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../utils/metrics', () => ({
  logMetric: jest.fn(() => Promise.resolve()),
}));

// jest.config maps the bare "../utils/api" specifier to test/__mocks__/api.js,
// which is a different module than the "../../utils/api" the page imports.
jest.mock('../utils/api.js', () => ({
  __esModule: true,
  default: {
    get: jest.fn(() => Promise.resolve({ data: { results: [] } })),
    post: jest.fn(() => Promise.resolve({ data: {} })),
  },
  formatSearch: (where: unknown) =>
    typeof where !== 'undefined'
      ? encodeURIComponent(JSON.stringify(where))
      : '',
}));

const api = jest.requireMock('../utils/api.js').default as {
  post: jest.Mock;
};

const refetchUser = jest.fn();

const mockUser = (user: Record<string, unknown> | null) =>
  (useAuth as jest.Mock).mockReturnValue({ user, refetchUser });

describe('AffiliateLandingPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // jsdom has no layout, so the hero's focus-the-form effect needs a stub.
    window.HTMLElement.prototype.scrollIntoView = jest.fn();
    process.env.NEXT_PUBLIC_FEATURE_AFFILIATE = 'true';
    api.post.mockResolvedValue({ data: {} });
  });

  it('applies through the apply endpoint instead of patching the user', async () => {
    mockUser({ _id: 'user-1', email: 'ada@example.com' });
    renderWithNextIntl(<AffiliateLandingPage />);

    await userEvent.click(
      screen.getByRole('button', { name: /Apply to the affiliate program/i }),
    );

    const send = screen.getByRole('button', { name: /Send application/i });
    // The reason is what the reviewer reads, so it gates the submit.
    expect(send).toBeDisabled();

    await userEvent.type(
      screen.getByLabelText(/Why do you want to join/i),
      'I run a regenerative travel newsletter',
    );
    await userEvent.type(
      screen.getByLabelText(/Where will you promote/i),
      '12k readers',
    );
    await userEvent.click(screen.getByRole('button', { name: /Send application/i }));

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith('/affiliates/apply', {
        reason: 'I run a regenerative travel newsletter',
        program: 'affiliate',
        audience: '12k readers',
      }),
    );
    expect(refetchUser).toHaveBeenCalled();
    expect(
      await screen.findByText('Your application is in.'),
    ).toBeInTheDocument();
  });

  it('omits an empty optional field rather than sending a blank string', async () => {
    mockUser({ _id: 'user-1', email: 'ada@example.com' });
    renderWithNextIntl(<AffiliateLandingPage />);

    await userEvent.click(
      screen.getByRole('button', { name: /Apply to the affiliate program/i }),
    );
    await userEvent.type(
      screen.getByLabelText(/Why do you want to join/i),
      'Because',
    );
    await userEvent.click(screen.getByRole('button', { name: /Send application/i }));

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith('/affiliates/apply', {
        reason: 'Because',
        program: 'affiliate',
      }),
    );
  });

  it('shows the pending state to someone who already applied', () => {
    mockUser({
      _id: 'user-1',
      email: 'ada@example.com',
      affiliateApplication: { status: 'pending', reason: 'Because' },
    });
    renderWithNextIntl(<AffiliateLandingPage />);

    expect(screen.getByText('Your application is in.')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Apply to the affiliate program/i }),
    ).not.toBeInTheDocument();
  });

  it('sends an approved affiliate to their dashboard instead of re-applying', async () => {
    mockUser({
      _id: 'user-1',
      email: 'ada@example.com',
      affiliate: new Date(),
      affiliateApplication: { status: 'approved' },
    });
    renderWithNextIntl(<AffiliateLandingPage />);

    expect(
      screen.getByRole('button', { name: /Go to Affiliate dashboard/i }),
    ).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });

  it('routes a logged out visitor to login rather than erroring', async () => {
    mockUser(null);
    renderWithNextIntl(<AffiliateLandingPage />);

    await userEvent.click(
      screen.getByRole('button', { name: /Apply to the affiliate program/i }),
    );

    expect(
      screen.queryByLabelText(/Why do you want to join/i),
    ).not.toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });
});
