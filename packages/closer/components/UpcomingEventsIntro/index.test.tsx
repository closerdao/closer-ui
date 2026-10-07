import React from 'react';

import { screen, waitFor } from '@testing-library/react';
import { fromJS } from 'immutable';

import { renderWithNextIntl } from '../../test/utils';
import UpcomingEventsIntro from './index';

const get = jest.fn();

// A cold store: find() reads nothing until the provider re-renders.
jest.mock('../../contexts/platform', () => ({
  usePlatform: () => ({
    platform: { event: { get, find: () => undefined } },
  }),
}));

describe('UpcomingEventsIntro on the legacy API', () => {
  beforeEach(() => get.mockReset());

  it('hides when the store get() returns no upcoming events', async () => {
    get.mockResolvedValue({ results: fromJS([]) });

    const { container } = renderWithNextIntl(<UpcomingEventsIntro />);

    await waitFor(() => expect(get).toHaveBeenCalled());
    expect(get.mock.calls[0][0]).toMatchObject({ limit: 1, sort_by: 'start' });
    expect(container).toBeEmptyDOMElement();
  });

  it('shows when the store get() returns an upcoming event', async () => {
    get.mockResolvedValue({
      results: fromJS([{ _id: 'e1', slug: 'fest', name: 'Fest' }]),
    });

    renderWithNextIntl(<UpcomingEventsIntro />);

    expect(await screen.findByText('See all events')).toBeInTheDocument();
  });
});
