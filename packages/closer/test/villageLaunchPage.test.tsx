import React from 'react';

import { screen } from '@testing-library/react';

import { useAuth } from '../contexts/auth';
import LaunchVillagePage from '../pages/village/launch';
import { renderWithNextIntl } from './utils';

jest.mock('../contexts/auth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../components/CommunityMap', () => ({
  __esModule: true,
  default: () => <div data-testid="community-map" />,
}));

jest.mock('../utils/api.js', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), patch: jest.fn() },
  formatSearch: (where: unknown) => encodeURIComponent(JSON.stringify(where)),
}));

const mockedUseAuth = useAuth as unknown as jest.Mock;

describe('LaunchVillagePage federation gate', () => {
  const federationFlag = process.env.NEXT_PUBLIC_FEATURE_FEDERATION;

  afterEach(() => {
    process.env.NEXT_PUBLIC_FEATURE_FEDERATION = federationFlag;
  });

  beforeEach(() => {
    mockedUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  });

  it('is unavailable when federation is off', () => {
    delete process.env.NEXT_PUBLIC_FEATURE_FEDERATION;
    renderWithNextIntl(<LaunchVillagePage />);
    expect(screen.getByText('Feature Not Available')).toBeInTheDocument();
    expect(
      screen.getByText('Federation is not enabled on this platform.'),
    ).toBeInTheDocument();
  });

  it('asks unauthenticated visitors to sign in when federation is on', () => {
    process.env.NEXT_PUBLIC_FEATURE_FEDERATION = 'true';
    renderWithNextIntl(<LaunchVillagePage />);
    expect(screen.getByText('Please log in or sign up to continue.')).toBeInTheDocument();
  });
});
