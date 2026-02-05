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
  rest.get('*/count/user', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ results: 0 }));
  }),
  rest.get('*/user', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ results: [user] }));
  }),
  rest.get('*/config/booking', (req, res, ctx) =>
    res(ctx.status(200), ctx.json({ results: bookingSettings })),
  ),
  rest.get('https://api.example.com/config/webinar', (req, res, ctx) =>
    res(ctx.status(200), ctx.json({ results: {} })),
  ),
  rest.get('https://api.example.com/config/general', (req, res, ctx) =>
    res(ctx.status(200), ctx.json({ results: {} })),
  ),
  rest.post('https://api.example.com/metric', (req, res, ctx) =>
    res(ctx.status(200), ctx.json({})),
  ),
  rest.get('*/meta/countries', (req, res, ctx) =>
    res(
      ctx.status(200),
      ctx.json({
        results: [
          { name: 'Portugal', code: 'PT' },
          { name: 'United States', code: 'US' },
          { name: 'Germany', code: 'DE' },
        ],
      }),
    ),
  ),
  rest.post('*/carrots/availability', (req, res, ctx) =>
    res(ctx.status(200), ctx.json({ data: { results: { areCreditsAvailable: false } } })),
  ),
  rest.get('*/carrots/balance', (req, res, ctx) =>
    res(ctx.status(200), ctx.json({ data: { results: 0 } })),
  ),
];
