import React from 'react';

import ApplicationsFunnel from '../pages/dashboard/performance/components/ApplicationsFunnel';
import CitizenshipFunnel from '../pages/dashboard/performance/components/CitizenshipFunnel';
import StaysFunnel from '../pages/dashboard/performance/components/StaysFunnel';
import SubscriptionsFunnel from '../pages/dashboard/performance/components/SubscriptionsFunnel';
import TokenSalesFunnel from '../pages/dashboard/performance/components/TokenSalesFunnel';

import { screen, waitFor } from '@testing-library/react';
import { render } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';

import { PlatformProvider } from '../contexts/platform';
import messagesBase from '../locales/base-en.json';

// jest.config maps the bare "../utils/api" specifier to a different module than
// the "../../utils/api" the platform store imports, so mock the real path.
jest.mock('../utils/api.js', () => ({
  __esModule: true,
  default: {
    get: jest.fn(() => Promise.resolve({ data: { results: [] } })),
    post: jest.fn(() => Promise.resolve({ data: {} })),
  },
  formatSearch: (where: unknown) => encodeURIComponent(JSON.stringify(where)),
  cdn: '',
}));

const mockedApiGet = jest.requireMock('../utils/api.js').default
  .get as jest.Mock;

const renderInPlatform = (ui: React.ReactElement) =>
  render(
    <NextIntlClientProvider
      locale="en"
      messages={messagesBase as any}
      timeZone="Europe/Lisbon"
    >
      <PlatformProvider>{ui}</PlatformProvider>
    </NextIntlClientProvider>,
  );

const funnelProps = { timeFrame: 'month', fromDate: '', toDate: '' };

describe('performance funnels render the counts the API returns', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('applications funnel shows the application count', async () => {
    mockedApiGet.mockImplementation((url: string) => {
      if (url === '/count/application') {
        return Promise.resolve({ data: { results: 11 } });
      }
      return Promise.resolve({ data: { results: [] } });
    });

    renderInPlatform(<ApplicationsFunnel {...funnelProps} />);

    await waitFor(() => {
      expect(mockedApiGet).toHaveBeenCalledWith(
        '/count/application',
        expect.anything(),
      );
    });

    const totalRow = await screen.findByText('Total Applications');
    await waitFor(() => {
      expect(totalRow.parentElement).toHaveTextContent('11');
    });
  });

  it('subscriptions funnel shows the metric counts', async () => {
    mockedApiGet.mockImplementation((url: string) => {
      if (url === '/count/metric') {
        return Promise.resolve({ data: { results: 7 } });
      }
      if (url === '/count/user') {
        return Promise.resolve({ data: { results: 3 } });
      }
      return Promise.resolve({ data: { results: [] } });
    });

    renderInPlatform(<SubscriptionsFunnel {...funnelProps} />);

    await waitFor(() => {
      expect(mockedApiGet).toHaveBeenCalledWith(
        '/count/metric',
        expect.anything(),
      );
    });

    const pageViews = await screen.findByText('Page Views');
    await waitFor(() => {
      expect(pageViews.parentElement).toHaveTextContent('7');
    });
  });
});

describe('the other funnels read the same store', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('stays funnel shows the booking count', async () => {
    mockedApiGet.mockImplementation((url: string) => {
      if (url === '/count/booking') {
        return Promise.resolve({ data: { results: 5 } });
      }
      return Promise.resolve({ data: { results: 4 } });
    });

    renderInPlatform(<StaysFunnel {...funnelProps} />);

    await waitFor(() => {
      expect(mockedApiGet).toHaveBeenCalledWith(
        '/count/booking',
        expect.anything(),
      );
    });

    const totalRow = await screen.findByText('Total Bookings');
    await waitFor(() => {
      expect(totalRow.parentElement).toHaveTextContent('5');
    });
  });

  it('citizenship funnel shows the metric count', async () => {
    mockedApiGet.mockImplementation(() =>
      Promise.resolve({ data: { results: 6 } }),
    );

    renderInPlatform(<CitizenshipFunnel {...funnelProps} />);

    await waitFor(() => {
      expect(mockedApiGet).toHaveBeenCalledWith(
        '/count/metric',
        expect.anything(),
      );
    });

    const pageViews = await screen.findByText('Page Views');
    await waitFor(() => {
      expect(pageViews.parentElement).toHaveTextContent('6');
    });
  });
});

/**
 * Several filters were declared and read but never requested, so their rows sat
 * at zero no matter what the API held. Each of these pins one of them.
 */
describe('every filter a funnel reads is also fetched', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const whereOf = (call: any[]) => JSON.stringify(call[1]?.params?.where ?? {});

  it('subscriptions fetches the subscribe-button clicks its conversion rate divides by', async () => {
    mockedApiGet.mockImplementation(() =>
      Promise.resolve({ data: { results: 4 } }),
    );

    renderInPlatform(<SubscriptionsFunnel {...funnelProps} />);

    await waitFor(() => {
      expect(
        mockedApiGet.mock.calls.some(
          (call) =>
            call[0] === '/count/metric' &&
            whereOf(call).includes('subscribe-button-click'),
        ),
      ).toBe(true);
    });
  });

  it('subscriptions fetches the 3+ months subscriber count', async () => {
    mockedApiGet.mockImplementation((url: string) =>
      Promise.resolve({ data: { results: url === '/count/user' ? 2 : 0 } }),
    );

    renderInPlatform(<SubscriptionsFunnel {...funnelProps} />);

    const threeMonths = await screen.findByText('3+ Months');
    await waitFor(() => {
      expect(threeMonths.parentElement).toHaveTextContent('2');
    });
  });

  it('the 3+ months window is not also bounded by the selected period', async () => {
    mockedApiGet.mockImplementation(() =>
      Promise.resolve({ data: { results: 0 } }),
    );

    renderInPlatform(<SubscriptionsFunnel {...funnelProps} />);

    await waitFor(() => {
      expect(
        mockedApiGet.mock.calls.some((call) => call[0] === '/count/user'),
      ).toBe(true);
    });

    const threeMonthCall = mockedApiGet.mock.calls.find(
      (call) => call[0] === '/count/user' && whereOf(call).includes('$lte'),
    );
    expect(threeMonthCall).toBeDefined();
    // A $gte alongside it would ask for a subscribeDate both inside the window
    // and older than three months, which never matches.
    expect(whereOf(threeMonthCall as any[])).not.toContain('$gte');
  });

  it('citizenship fetches the become-citizen button clicks', async () => {
    mockedApiGet.mockImplementation(() =>
      Promise.resolve({ data: { results: 0 } }),
    );

    renderInPlatform(<CitizenshipFunnel {...funnelProps} />);

    await waitFor(() => {
      expect(
        mockedApiGet.mock.calls.some(
          (call) =>
            call[0] === '/count/metric' &&
            whereOf(call).includes('become-citizen-button-click'),
        ),
      ).toBe(true);
    });
  });

  it('token sales fetches the baskets it sums tokens from', async () => {
    mockedApiGet.mockImplementation((url: string) =>
      Promise.resolve({
        data: {
          results: url === '/metric' ? [{ point: 3 }, { point: 4 }] : 0,
        },
      }),
    );

    renderInPlatform(<TokenSalesFunnel {...funnelProps} />);

    const tokensSold = await screen.findByText('Tokens Sold');
    await waitFor(() => {
      expect(tokensSold.parentElement).toHaveTextContent('7');
    });
  });

  it('token sales fetches the financed-purchase-started count', async () => {
    mockedApiGet.mockImplementation((url: string) =>
      Promise.resolve({ data: { results: url === '/metric' ? [] : 0 } }),
    );

    renderInPlatform(<TokenSalesFunnel {...funnelProps} />);

    await waitFor(() => {
      expect(
        mockedApiGet.mock.calls.some(
          (call) =>
            call[0] === '/count/metric' &&
            whereOf(call).includes('financed-token-purchase-started'),
        ),
      ).toBe(true);
    });
  });
});

/**
 * The tier split was decided by `plan.title === 'Wanderer'`, so every platform
 * but TDF filed all of its traffic as tier 2. One event per step now — and the
 * retired names stay counted so older windows do not go blank.
 */
describe('subscriptions funnel counts steps without tiers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const eventsOf = (call: any[]) =>
    (call[1]?.params?.where?.event?.$in ?? []) as string[];

  it('counts the new and the retired event names as one step', async () => {
    mockedApiGet.mockImplementation(() =>
      Promise.resolve({ data: { results: 0 } }),
    );

    renderInPlatform(<SubscriptionsFunnel {...funnelProps} />);

    await waitFor(() => {
      expect(
        mockedApiGet.mock.calls.some((call) => call[0] === '/count/metric'),
      ).toBe(true);
    });

    const metricCalls = mockedApiGet.mock.calls.filter(
      (call) => call[0] === '/count/metric',
    );

    const step = (newEvent: string) =>
      metricCalls.map(eventsOf).find((events) => events.includes(newEvent));

    expect(step('subscription-plan-view')).toEqual([
      'subscription-plan-view',
      'tier-1-page-view',
      'tier-2-page-view',
    ]);
    expect(step('subscription-checkout')).toEqual([
      'subscription-checkout',
      'tier-1-checkout',
      'tier-2-checkout',
    ]);
    expect(step('subscription-first-payment')).toEqual([
      'subscription-first-payment',
      'tier-1-first-payment',
      'tier-2-first-payment',
    ]);
  });

  it('never counts a checkout twice through the event that shadowed it', async () => {
    mockedApiGet.mockImplementation(() =>
      Promise.resolve({ data: { results: 0 } }),
    );

    renderInPlatform(<SubscriptionsFunnel {...funnelProps} />);

    await waitFor(() => {
      expect(
        mockedApiGet.mock.calls.some((call) => call[0] === '/count/metric'),
      ).toBe(true);
    });

    // It was logged on the same mount as tier-*-checkout, so counting it
    // alongside them would double every checkout in that span.
    expect(
      mockedApiGet.mock.calls.some((call) =>
        eventsOf(call).includes('subscription-checkout-started'),
      ),
    ).toBe(false);
  });

  it('shows one plan-views figure rather than a tier pair', async () => {
    mockedApiGet.mockImplementation((url: string) =>
      Promise.resolve({ data: { results: url === '/count/metric' ? 9 : 0 } }),
    );

    renderInPlatform(<SubscriptionsFunnel {...funnelProps} />);

    const planViews = await screen.findByText('Plan Views');
    await waitFor(() => {
      expect(planViews.parentElement).toHaveTextContent('9');
    });
  });
});
