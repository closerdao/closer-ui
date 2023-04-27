import { bookingSettings, user } from '@/__tests__/mocks';

import { rest } from 'msw';

export const handlers = [
  rest.get('*/mine/user', (req, res, ctx) =>
    res(ctx.status(200), ctx.json(user)),
  ),
  rest.get('*/config/booking', (req, res, ctx) =>
    res(ctx.status(200), ctx.json(bookingSettings)),
  ),
];
