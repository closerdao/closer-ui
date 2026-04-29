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
  rest.post('*/bookings/listing/availability', (req, res, ctx) =>
    res(ctx.status(200), ctx.json({ results: [] })),
  ),
  rest.post('*/carrots/availability', (req, res, ctx) =>
    res(ctx.status(200), ctx.json({ data: { results: { areCreditsAvailable: false } } })),
  ),
  rest.get('*/carrots/balance', (req, res, ctx) =>
    res(ctx.status(200), ctx.json({ data: { results: 0 } })),
  ),
  rest.get('*/my/CohousingApplication', (req, res, ctx) =>
    res(
      ctx.status(200),
      ctx.json({
        results: [
          {
            _id: 'cohousing-mock-1',
            createdBy: user._id,
            currentStep: 1,
            status: 'waitlist',
            isDraft: true,
            financingMode: null,
          },
        ],
      }),
    ),
  ),
  rest.get('*/cohousingapplication/:id', (req, res, ctx) => {
    const { id } = req.params;
    return res(
      ctx.status(200),
      ctx.json({
        results: {
          _id: id,
          createdBy: user._id,
          currentStep: 2,
          status: 'waitlist',
          isDraft: true,
          financingMode: null,
        },
      }),
    );
  }),
  rest.post('*/CohousingApplication', async (req, res, ctx) => {
    const body = (await req.json().catch(() => ({}))) as {
      status?: string;
      isDraft?: boolean;
      createdBy?: string;
    };
    return res(
      ctx.status(200),
      ctx.json({
        results: {
          _id: 'cohousing-new-mock',
          createdBy: body.createdBy || user._id,
          currentStep: 1,
          status: body.status || 'waitlist',
          isDraft: body.isDraft !== false,
        },
      }),
    );
  }),
  rest.patch('*/cohousingapplication/:id', (req, res, ctx) => {
    const { id } = req.params;
    return res(
      ctx.status(200),
      ctx.json({
        results: {
          _id: id,
          createdBy: user._id,
          currentStep: 3,
          status: 'waitlist',
          isDraft: true,
        },
      }),
    );
  }),
  rest.get('*/cohousingapplication', (req, res, ctx) =>
    res(
      ctx.status(200),
      ctx.json({
        results: [
          {
            _id: 'cohousing-mock-1',
            createdBy: user._id,
            currentStep: 2,
            status: 'waitlist',
            cohort: '2026-28',
          },
        ],
      }),
    ),
  ),
];
