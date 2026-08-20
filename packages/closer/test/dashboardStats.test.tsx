import React from 'react';

import { screen, waitFor } from '@testing-library/react';

import DashboardStats from '../components/Dashboard/DashboardStats';
import { useConfig } from '../hooks/useConfig';
import { fetchStatValue } from '../utils/dashboardStats.helpers';
import { renderWithNextIntl } from './utils';

jest.mock('../hooks/useConfig', () => ({
  useConfig: jest.fn(),
}));

jest.mock('../utils/dashboardStats.helpers', () => {
  const actual = jest.requireActual('../utils/dashboardStats.helpers');
  return { ...actual, fetchStatValue: jest.fn() };
});

const mockedUseConfig = useConfig as jest.Mock;
const mockedFetch = fetchStatValue as jest.Mock;

const baseConfig = {
  TIME_ZONE: 'Europe/Lisbon',
  booking: { enabled: true },
  events: { enabled: true },
  citizenship: { enabled: true },
};

const props = { timeFrame: 'currentMonth', fromDate: '', toDate: '' };

describe('DashboardStats', () => {
  beforeEach(() => {
    mockedUseConfig.mockReturnValue(baseConfig);
    mockedFetch.mockReset();
    process.env.NEXT_PUBLIC_FEATURE_BOOKING = 'true';
    process.env.NEXT_PUBLIC_FEATURE_CITIZENSHIP = 'true';
  });

  it('renders a tile per enabled feature and hides the rest', async () => {
    mockedFetch.mockResolvedValue(10);

    renderWithNextIntl(<DashboardStats {...props} />);

    await waitFor(() => {
      expect(screen.getByText('Accounts')).toBeInTheDocument();
    });
    expect(screen.getByText('Bookings')).toBeInTheDocument();
    expect(screen.getByText('Nights')).toBeInTheDocument();
    expect(screen.getByText('Event guests')).toBeInTheDocument();
    expect(screen.getByText('Citizens')).toBeInTheDocument();

    // Volunteering and subscriptions are off in this config.
    expect(screen.queryByText('Volunteers')).not.toBeInTheDocument();
    expect(screen.queryByText('Subscribers')).not.toBeInTheDocument();
  });

  it('drops booking tiles when booking is disabled in config', async () => {
    mockedUseConfig.mockReturnValue({
      ...baseConfig,
      booking: { enabled: false },
      events: { enabled: false },
    });
    mockedFetch.mockResolvedValue(3);

    renderWithNextIntl(<DashboardStats {...props} />);

    await waitFor(() => {
      expect(screen.getByText('Accounts')).toBeInTheDocument();
    });
    expect(screen.queryByText('Bookings')).not.toBeInTheDocument();
    expect(screen.queryByText('Nights')).not.toBeInTheDocument();
  });

  it('shows the change against the previous period', async () => {
    // Five tiles are enabled here; the component asks for the current period
    // first and the preceding one second, so doubling the first batch is a
    // uniform +100%.
    let call = 0;
    mockedFetch.mockImplementation(() => {
      call += 1;
      return Promise.resolve(call <= 5 ? 200 : 100);
    });

    renderWithNextIntl(<DashboardStats {...props} />);

    await waitFor(() => {
      expect(screen.getAllByText('+100%').length).toBeGreaterThan(0);
    });
    expect(screen.getAllByText('vs. previous period').length).toBeGreaterThan(0);
  });

  it('labels current-total tiles instead of comparing them', async () => {
    mockedFetch.mockResolvedValue(42);

    renderWithNextIntl(<DashboardStats {...props} />);

    await waitFor(() => {
      expect(screen.getAllByText('42').length).toBeGreaterThan(0);
    });
    // Only the citizens tile is a current total here.
    expect(screen.getAllByText('total').length).toBe(1);
  });

  it('shows a loading placeholder before the numbers arrive', async () => {
    const resolvers: ((value: number) => void)[] = [];
    mockedFetch.mockImplementation(
      () => new Promise<number>((resolve) => resolvers.push(resolve)),
    );

    renderWithNextIntl(<DashboardStats {...props} />);

    expect(screen.getAllByRole('status').length).toBeGreaterThan(0);

    resolvers.forEach((resolve) => resolve(1));
    await waitFor(() => {
      expect(screen.queryAllByRole('status').length).toBe(0);
    });
  });

  it('stops loading when custom timeframe has no dates', async () => {
    renderWithNextIntl(
      <DashboardStats timeFrame="custom" fromDate="" toDate="" />,
    );

    await waitFor(() => {
      expect(screen.queryAllByRole('status').length).toBe(0);
    });
    expect(mockedFetch).not.toHaveBeenCalled();
  });
});
