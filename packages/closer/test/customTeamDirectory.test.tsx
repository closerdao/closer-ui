import React from 'react';

import CustomTeamDirectory from '../components/custom-pages/CustomTeamDirectory';

import { screen, waitFor } from '@testing-library/react';

import { usePlatform } from '../contexts/platform';
import { renderWithNextIntl } from './utils';

jest.mock('../contexts/platform', () => ({
  usePlatform: jest.fn(),
}));

const mockedUsePlatform = usePlatform as unknown as jest.Mock;

/** Minimal stand-in for the platform's immutable user model. */
const makeUser = (user: Record<string, unknown>) => ({
  get: (key: string) => user[key],
});

const makeCollection = (users: Record<string, unknown>[]) => ({
  count: () => users.length,
  map: (fn: (user: any, index: number) => unknown) =>
    users.map(makeUser).map(fn),
});

/** Records the filters the block asks for so we can assert on the roles. */
const mockPlatform = (
  usersByRoles: Record<string, Record<string, unknown>[]>,
) => {
  const get = jest.fn().mockResolvedValue(undefined);
  const keyFor = (filter: any) => (filter?.where?.roles?.$in || []).join(',');
  mockedUsePlatform.mockReturnValue({
    platform: {
      user: {
        get,
        find: (filter: any) =>
          makeCollection(usersByRoles[keyFor(filter)] ?? []),
      },
    },
  });
  return get;
};

describe('CustomTeamDirectory', () => {
  beforeEach(() => mockedUsePlatform.mockReset());

  it('shows the photo and bio of every member with the configured role', async () => {
    mockPlatform({
      team: [
        {
          _id: '1',
          slug: 'ana',
          screenname: 'Ana',
          about: 'Grows the food.',
          photo: 'photo-ana',
        },
        { _id: '2', slug: 'bo', screenname: 'Bo', about: 'Fixes the roofs.' },
      ],
    });

    renderWithNextIntl(
      <CustomTeamDirectory content={{ roles: [{ role: 'team' }] }} />,
    );

    await waitFor(() => expect(screen.getByText('Ana')).toBeInTheDocument());
    expect(screen.getByText('Grows the food.')).toBeInTheDocument();
    expect(screen.getByText('Bo')).toBeInTheDocument();
    expect(screen.getByText('Fixes the roofs.')).toBeInTheDocument();
    expect(screen.getByAltText('Ana')).toBeInTheDocument();
  });

  it('queries every configured role, not just the first', async () => {
    const get = mockPlatform({
      'space-host,steward': [
        { _id: '3', slug: 'cy', screenname: 'Cy', about: 'Hosts guests.' },
      ],
    });

    renderWithNextIntl(
      <CustomTeamDirectory
        settings={{ limit: 10 }}
        content={{ roles: [{ role: 'space-host' }, { role: 'steward' }] }}
      />,
    );

    await waitFor(() => expect(get).toHaveBeenCalled());
    expect(get.mock.calls[0][0]).toMatchObject({
      where: { roles: { $in: ['space-host', 'steward'] } },
      limit: 10,
    });
    expect(screen.getByText('Cy')).toBeInTheDocument();
  });

  it('falls back to the team role when none is configured', async () => {
    const get = mockPlatform({ team: [] });

    renderWithNextIntl(<CustomTeamDirectory />);

    await waitFor(() => expect(get).toHaveBeenCalled());
    expect(get.mock.calls[0][0].where.roles.$in).toEqual(['team']);
    expect(
      screen.getByText('No team members to show yet.'),
    ).toBeInTheDocument();
  });
});
