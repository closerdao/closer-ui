import React from 'react';

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useAuth } from '../contexts/auth';
import AmbassadorLandingPage from '../pages/ambassadors';
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

const api = jest.requireMock('../utils/api.js').default as { post: jest.Mock };

const refetchUser = jest.fn();

const mockUser = (user: Record<string, unknown> | null) =>
  (useAuth as jest.Mock).mockReturnValue({
    user,
    refetchUser,
    isAuthenticated: Boolean(user),
  });

const openForm = async () =>
  userEvent.click(
    (
      await screen.findAllByRole('button', {
        name: /Apply to become an Ambassador/i,
      })
    )[0],
  );

describe('AmbassadorLandingPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    api.post.mockResolvedValue({ data: {} });
    // jsdom has no layout, so the scroll-to-form effect would throw otherwise.
    window.HTMLElement.prototype.scrollIntoView = jest.fn();
  });

  it('applies through the apply endpoint instead of patching affiliate and roles', async () => {
    mockUser({ _id: 'user-1', email: 'ada@example.com', roles: [] });
    renderWithNextIntl(<AmbassadorLandingPage />);

    await openForm();
    await userEvent.type(
      screen.getByLabelText(/Why do you want to be an Ambassador/i),
      'I know six land projects in Alentejo',
    );
    await userEvent.type(
      screen.getByLabelText(/Where are you based/i),
      'Portugal',
    );
    await userEvent.click(
      screen.getByRole('button', { name: /Send application/i }),
    );

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith('/affiliates/apply', {
        reason: 'I know six land projects in Alentejo',
        program: 'ambassador',
        projects: 'Portugal',
      }),
    );
    expect(refetchUser).toHaveBeenCalled();
    expect(
      await screen.findByText('Application received.'),
    ).toBeInTheDocument();
  });

  it('never sends the ambassador role from the client', async () => {
    mockUser({ _id: 'user-1', email: 'ada@example.com', roles: [] });
    renderWithNextIntl(<AmbassadorLandingPage />);

    await openForm();
    await userEvent.type(
      screen.getByLabelText(/Why do you want to be an Ambassador/i),
      'Because',
    );
    await userEvent.click(
      screen.getByRole('button', { name: /Send application/i }),
    );

    await waitFor(() => expect(api.post).toHaveBeenCalled());
    const [, payload] = api.post.mock.calls[0];
    expect(payload).not.toHaveProperty('roles');
    expect(payload).not.toHaveProperty('affiliate');
  });

  it('holds the submit shut until a reason is written', async () => {
    mockUser({ _id: 'user-1', email: 'ada@example.com', roles: [] });
    renderWithNextIntl(<AmbassadorLandingPage />);

    await openForm();
    expect(
      screen.getByRole('button', { name: /Send application/i }),
    ).toBeDisabled();
  });

  it('shows the pending state to someone who already applied', () => {
    mockUser({
      _id: 'user-1',
      email: 'ada@example.com',
      roles: [],
      affiliateApplication: { status: 'pending' },
    });
    renderWithNextIntl(<AmbassadorLandingPage />);

    expect(screen.getByText('Application received.')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', {
        name: /Apply to become an Ambassador/i,
      }),
    ).not.toBeInTheDocument();
  });

  it('keeps the toolkit for an approved ambassador', () => {
    mockUser({
      _id: 'user-1',
      email: 'ada@example.com',
      roles: [],
      slug: 'ada',
      affiliate: new Date(),
    });
    renderWithNextIntl(<AmbassadorLandingPage />);

    expect(screen.getByText('You’re an Ambassador.')).toBeInTheDocument();
    expect(screen.getByText('Add a village')).toBeInTheDocument();
  });

  it('routes a logged out visitor to login rather than opening the form', async () => {
    mockUser(null);
    renderWithNextIntl(<AmbassadorLandingPage />);

    await openForm();

    expect(
      screen.queryByLabelText(/Why do you want to be an Ambassador/i),
    ).not.toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });
});
