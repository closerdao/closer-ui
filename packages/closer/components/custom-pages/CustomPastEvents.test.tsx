import React from 'react';

import { screen } from '@testing-library/react';
import { fromJS } from 'immutable';

import { renderWithNextIntl } from '../../test/utils';
import CustomPastEvents from './CustomPastEvents';

const get = jest.fn();
// The provider memoises platform; the effect reloads on a new one.
const mockPlatform = { event: { get } };

jest.mock('../../contexts/platform', () => ({
  usePlatform: () => ({ platform: mockPlatform }),
}));

describe('CustomPastEvents on the legacy API', () => {
  beforeEach(() => get.mockReset());

  it('says there are no events when the store get() returns none', async () => {
    get.mockResolvedValue({ results: fromJS([]) });

    renderWithNextIntl(<CustomPastEvents />);

    expect(await screen.findByText('No upcoming events.')).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('lists the past events the store get() returns', async () => {
    get.mockResolvedValue({
      results: fromJS([{ _id: 'e1', slug: 'fest', name: 'Fest' }]),
    });

    renderWithNextIntl(<CustomPastEvents />);

    expect(await screen.findByRole('link', { name: 'Fest' })).toHaveAttribute(
      'href',
      '/events/fest',
    );
    expect(get.mock.calls[0][0]).toMatchObject({
      limit: 20,
      sort_by: '-start',
    });
  });
});
