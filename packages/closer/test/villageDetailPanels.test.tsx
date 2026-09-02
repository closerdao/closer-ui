import { useRouter } from 'next/router';

import React from 'react';

import { screen } from '@testing-library/react';

import { useAuth } from '../contexts/auth';
import VillagePage from '../pages/villages/[slug]/index';
import { renderWithNextIntl } from './utils';

jest.mock('../contexts/auth', () => ({
  useAuth: jest.fn(),
}));

// Leaflet needs a real viewport, and the events list talks to another API.
jest.mock('../components/CommunityMap', () => ({
  __esModule: true,
  default: () => <div data-testid="community-map" />,
}));
jest.mock('../components/VillageEvents', () => ({
  __esModule: true,
  default: () => <div data-testid="village-events" />,
}));

// jest.config maps the bare "../utils/api" specifier to test/__mocks__/api.js,
// which is a different module than the "./api" the utils import.
jest.mock('../utils/api.js', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), patch: jest.fn() },
  formatSearch: (where: unknown) => encodeURIComponent(JSON.stringify(where)),
  invalidateGetCache: jest.fn(),
}));

const api = jest.requireMock('../utils/api.js').default as { get: jest.Mock };

const village = (overrides: Record<string, unknown> = {}) => ({
  _id: 'v1',
  slug: 'riverbank',
  name: 'Riverbank',
  country: 'Portugal',
  description: 'A regenerative village on the Douro.',
  coords: [-8.6, 41.1],
  createdBy: 'user-1',
  projectManager: { name: 'Ada', email: 'ada@riverbank.pt' },
  onboardingStatus: 'live',
  managed: true,
  appUrl: 'https://riverbank.closer.earth',
  ...overrides,
});

const mockRoutes = (
  overrides: Record<string, unknown> = {},
  questions: unknown[] = [],
) => {
  api.get.mockImplementation((url: string) => {
    if (url.includes('/questions')) {
      return Promise.resolve({ data: { villageId: 'v1', questions } });
    }
    if (url.startsWith('/user')) {
      return Promise.resolve({ data: { results: [] } });
    }
    return Promise.resolve({ data: { results: village(overrides) } });
  });
};

describe('the village page panels', () => {
  beforeEach(() => {
    api.get.mockReset();
    (useRouter as jest.Mock).mockReturnValue({
      query: { slug: 'riverbank' },
      push: jest.fn(),
      isReady: true,
    });
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { _id: 'user-1', roles: [] },
    });
    mockRoutes();
  });

  it('drops the next-step panel once the village is live', async () => {
    renderWithNextIntl(<VillagePage />);

    // The deploy card is the live village's own status card; the funnel panel
    // above it has nothing left to point at.
    expect(await screen.findByTestId('deploy-cta')).toBeInTheDocument();
    expect(screen.queryByText('Your next step')).toBeNull();
    expect(screen.queryByText('They’re live')).toBeNull();
  });

  it('still shows it while the village is on its way there', async () => {
    mockRoutes({ onboardingStatus: 'subscribed' });
    renderWithNextIntl(<VillagePage />);

    expect(await screen.findByText('Your next step')).toBeInTheDocument();
  });

  it('keeps the owner invite on a live village that still has nobody attached', async () => {
    mockRoutes({
      onboardingStatus: 'live',
      createdBy: 'someone-else',
      managedBy: ['user-1'],
      projectManager: { name: 'Ada' },
    });
    renderWithNextIntl(<VillagePage />);

    expect(
      await screen.findByText('Invite the village owner'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Your next step')).toBeNull();
  });

  it('offers the questions form only while something is still unanswered', async () => {
    renderWithNextIntl(<VillagePage />);
    await screen.findByTestId('deploy-cta');
    expect(screen.queryByText('Answer the questions')).toBeNull();

    // Answered questions are not a reason to send the founder back.
    mockRoutes({}, [
      { id: 'a1', question: 'Who owns the land?', answer: 'A land trust.' },
    ]);
    renderWithNextIntl(<VillagePage />);
    await screen.findAllByTestId('deploy-cta');
    expect(screen.queryByText('Answer the questions')).toBeNull();

    mockRoutes({}, [{ id: 'a1', question: 'Who owns the land?' }]);
    renderWithNextIntl(<VillagePage />);

    const cta = await screen.findByText('Answer the questions');
    expect(cta.closest('a')).toHaveAttribute(
      'href',
      '/villages/riverbank/tell-us-more',
    );
    expect(
      screen.getByText('1 question we could not answer on our own.'),
    ).toBeInTheDocument();
  });
});
