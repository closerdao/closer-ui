import { bookingSettings, user } from '@/__tests__/mocks';

import { rest } from 'msw';

export const handlers = [
  rest.get('*/mine/user', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        results: user,
      }),
    );
  }),
  rest.get('*/config/booking', (req, res, ctx) =>
    res(ctx.status(200), ctx.json({ results: bookingSettings })),
  ),
];
