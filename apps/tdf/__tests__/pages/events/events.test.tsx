import { server } from '@/test/server';
import { renderWithProviders } from '@/test/utils';

import { screen } from '@testing-library/react';
import { rest } from 'msw';

import Events from '../../../pages/events/index';
import eventsMock from './events.json';

describe('Events', () => {
  it('should render and have proper subtitles', async () => {
    server.use(
      rest.get('https://api.closer.earth/event', (req, res, ctx) => {
        const params = req.url.searchParams;
        const where = params.get('where');
        if (where?.includes('gt')) {
          return res(ctx.json({ results: [] }));
        }
        return res(ctx.json({ results: eventsMock }));
      }),
    );

    renderWithProviders(<Events />);
    const titleUpcoming = screen.getAllByRole('heading', { level: 1 })[0];
    const titlePast = screen.getAllByRole('heading', { level: 1 })[1];
    expect(titleUpcoming).toHaveTextContent(/upcoming events/i);
    expect(titlePast).toHaveTextContent(/past events/i);
    const eventCards = await screen.findAllByRole('listitem');
    expect(eventCards).toHaveLength(eventsMock.length+1);
  });
});
