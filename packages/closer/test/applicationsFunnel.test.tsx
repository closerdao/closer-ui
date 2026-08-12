import React from 'react';

import { screen, waitFor } from '@testing-library/react';

import { usePlatform } from '../contexts/platform';
import ApplicationsFunnel from '../pages/dashboard/performance/components/ApplicationsFunnel';
import { renderWithNextIntl } from './utils';

jest.mock('../contexts/platform', () => ({
  usePlatform: jest.fn(),
}));

const mockedUsePlatform = usePlatform as unknown as jest.Mock;

/** Counts keyed by the status list the filter asks for; '' is "no status". */
const mockPlatform = (counts: Record<string, number>) => {
  const keyFor = (filter: any) =>
    (filter?.where?.status?.$in || []).join(',');

  mockedUsePlatform.mockReturnValue({
    platform: {
      application: {
        findCount: (filter: any) => counts[keyFor(filter)] ?? 0,
        getCount: jest.fn().mockResolvedValue(undefined),
      },
    },
  });
};

const props = { timeFrame: 'currentMonth', fromDate: '', toDate: '' };

describe('ApplicationsFunnel', () => {
  beforeEach(() => mockedUsePlatform.mockReset());

  it('renders each funnel step from its own count', async () => {
    mockPlatform({
      '': 40,
      'conversation,approved': 22,
      approved: 10,
      rejected: 12,
    });

    renderWithNextIntl(<ApplicationsFunnel {...props} />);

    await waitFor(() => {
      expect(screen.getByText('Total Applications')).toBeInTheDocument();
    });
    expect(screen.getByText('40')).toBeInTheDocument();
    expect(screen.getByText('22')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('reports the acceptance rate against all applications', async () => {
    mockPlatform({
      '': 40,
      'conversation,approved': 22,
      approved: 10,
      rejected: 12,
    });

    renderWithNextIntl(<ApplicationsFunnel {...props} />);

    await waitFor(() => {
      expect(screen.getByText('25%')).toBeInTheDocument();
    });
    expect(screen.getByText('10 / 40')).toBeInTheDocument();
  });

  it('counts everything not yet decided as awaiting a decision', async () => {
    mockPlatform({
      '': 40,
      'conversation,approved': 22,
      approved: 10,
      rejected: 12,
    });

    renderWithNextIntl(<ApplicationsFunnel {...props} />);

    // 40 total - 10 approved - 12 rejected
    await waitFor(() => {
      expect(screen.getByText('18')).toBeInTheDocument();
    });
    expect(screen.getByText('Awaiting Decision')).toBeInTheDocument();
  });

  it('does not divide by zero on a platform with no applications', async () => {
    mockPlatform({});

    renderWithNextIntl(<ApplicationsFunnel {...props} />);

    await waitFor(() => {
      expect(screen.getByText('0%')).toBeInTheDocument();
    });
    expect(screen.getByText('0 / 0')).toBeInTheDocument();
  });
});
