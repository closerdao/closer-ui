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
  rest.get('*/user/:id', (req, res, ctx) => {
    const { id } = req.params;
    if (id === 'null' || id === 'undefined') {
      return res(ctx.status(404), ctx.json({ results: null }));
    }
    if (id === user._id) {
      return res(ctx.status(200), ctx.json({ results: user }));
    }
    return res(ctx.status(404), ctx.json({ results: null }));
  }),
  rest.get('*/config', (req, res, ctx) =>
    res(
      ctx.status(200),
      ctx.json({
        results: [
          { slug: 'general', value: {} },
          { slug: 'booking', value: bookingSettings },
        ],
      }),
    ),
  ),
  rest.get('*/config/booking', (req, res, ctx) =>
    res(ctx.status(200), ctx.json({ results: bookingSettings })),
  ),
  rest.get('https://api.example.com/config/webinar', (req, res, ctx) =>
    res(ctx.status(200), ctx.json({ results: {} })),
  ),
  rest.get('https://api.example.com/config/general', (req, res, ctx) =>
    res(ctx.status(200), ctx.json({ results: {} })),
  ),
  rest.get('*/config/community', (req, res, ctx) =>
    res(ctx.status(200), ctx.json({ results: { value: { enabled: true } } })),
  ),
  rest.options('*/config/community', (req, res, ctx) => res(ctx.status(200))),
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
