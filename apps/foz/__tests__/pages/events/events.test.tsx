import { server } from '@/test/server';
import { renderWithProviders } from '@/test/utils';

import { screen } from '@testing-library/react';
import { rest } from 'msw';

import Events from '../../../pages/events/index';
import eventsMock from './events.json';

describe.skip('Events', () => {
  it('should render and have proper subtitles', async () => {
    server.use(
      rest.get('*/event', (req, res, ctx) => {
        const params = req.url.searchParams;
        const where = params.get('where');
        if (where?.includes('gt')) {
          return res(ctx.json({ results: [] }));
        }
        return res(ctx.json({ results: eventsMock }));
      }),
    );

    renderWithProviders(<Events />);
    const titleUpcoming = screen.getByRole('heading', {
      name: /upcoming events/i,
    });
    const titlePast = screen.getByRole('heading', { name: /past events/i });
    expect(titleUpcoming).toBeInTheDocument();
    expect(titlePast).toBeInTheDocument();
    const eventCards = await screen.findAllByRole('listitem');
    expect(eventCards).toHaveLength(eventsMock.length);
  });
});
