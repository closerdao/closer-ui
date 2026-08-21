import { useRouter } from 'next/router';

import React from 'react';

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useAuth } from '../contexts/auth';
import CreateVillagePage from '../pages/villages/create';
import { renderWithNextIntl } from './utils';

jest.mock('../contexts/auth', () => ({
  useAuth: jest.fn(),
}));

// Leaflet needs a real viewport; the map is not what this test is about.
jest.mock('../components/CommunityMap', () => ({
  __esModule: true,
  default: () => <div data-testid="community-map" />,
}));

// jest.config maps the bare "../utils/api" specifier to test/__mocks__/api.js,
// which is a different module than the "./api" the utils import.
jest.mock('../utils/api.js', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), patch: jest.fn() },
  formatSearch: (where: unknown) => encodeURIComponent(JSON.stringify(where)),
}));

const push = jest.fn();
const mockQuery = (query: Record<string, string>) =>
  (useRouter as jest.Mock).mockReturnValue({ query, push, isReady: true });

const api = jest.requireMock('../utils/api.js').default as {
  get: jest.Mock;
  post: jest.Mock;
};
const mockGet = api.get;
const mockPost = api.post;

const application = {
  _id: 'app-1',
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  phone: '+351000000',
  status: 'approved',
  fields: {
    projectName: 'Riverbank',
    about: 'A regenerative village on the Douro.',
    country: 'Portugal',
    website: 'https://riverbank.pt',
    latitude: '41.15',
    longitude: '-8.61',
  },
};

const labelled = (label: string) =>
  screen.getByText(label).closest('label')?.querySelector('input, textarea') as
    | HTMLInputElement
    | HTMLTextAreaElement;

describe('CreateVillagePage from an application', () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockPost.mockReset();
    mockGet.mockResolvedValue({ data: { results: application } });
    mockPost.mockResolvedValue({ data: { results: { _id: 'v1' } } });
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      user: { _id: 'user-1', roles: ['admin'] },
    });
    push.mockClear();
    mockQuery({ applicationId: 'app-1' });
  });

  it('opens the form pre-filled with the application answers', async () => {
    renderWithNextIntl(<CreateVillagePage />);

    await waitFor(() => {
      expect(labelled('Village name *')).toHaveValue('Riverbank');
    });
    expect(labelled('Country *')).toHaveValue('Portugal');
    expect(labelled('What are they building? *')).toHaveValue(
      'A regenerative village on the Douro.',
    );
    expect(labelled('Website')).toHaveValue('https://riverbank.pt');
    // Coordinates come back GeoJSON-ordered and land in the right boxes.
    expect(labelled('Latitude *')).toHaveValue('41.15');
    expect(labelled('Longitude *')).toHaveValue('-8.61');

    expect(mockGet).toHaveBeenCalledWith('/application/app-1');
  });

  it('records the application on the created village', async () => {
    renderWithNextIntl(<CreateVillagePage />);

    await waitFor(() => {
      expect(labelled('Village name *')).toHaveValue('Riverbank');
    });

    await userEvent.click(
      screen.getByRole('button', { name: 'Add to the map' }),
    );

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith(
        '/village',
        expect.objectContaining({
          applicationId: 'app-1',
          name: 'Riverbank',
          coords: [-8.61, 41.15],
        }),
      );
    });
  });

  it('still links the village when the application cannot be loaded', async () => {
    mockGet.mockRejectedValue(new Error('gone'));

    renderWithNextIntl(<CreateVillagePage />);

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(labelled('Village name *')).toHaveValue('');
  });

  it('opens an empty form when no application was passed', async () => {
    mockQuery({});

    renderWithNextIntl(<CreateVillagePage />);

    await waitFor(() => {
      expect(labelled('Village name *')).toHaveValue('');
    });
    expect(mockGet).not.toHaveBeenCalled();
  });
});
