import { screen } from '@testing-library/react';

import { renderWithNextIntl } from '../test/utils';
import StayVatSummary from './StayVatSummary';
import type { PriceLock } from '../types/stay';
import { getCachedConfig } from '../utils/cachedConfig.helpers';

jest.mock('../utils/cachedConfig.helpers', () => ({
  getCachedConfig: jest.fn(),
}));

const mockedGetCachedConfig = getCachedConfig as jest.Mock;

const money = (val: number) => ({ val, cur: 'EUR' });

const priceLock = (over: Partial<Record<string, number>> = {}): PriceLock =>
  ({
    lines: {
      accommodation: money(over.accommodation ?? 117),
      accommodationGross: money(117),
      utility: money(over.utility ?? 0),
      food: money(over.food ?? 0),
      event: money(over.event ?? 0),
    },
    subtotal: money(117),
    vat: money(over.vat ?? 17),
    platformFee: money(0),
    affiliateFee: money(0),
    total: money(117),
    dailyRentalFiat: money(0),
    dailyRentalToken: money(0),
    appliedCredits: money(0),
    appliedTokens: money(0),
    currency: 'EUR',
    lockedAt: '',
  } as PriceLock);

const mockConfigs = (vatByProductType?: Record<string, number>) => {
  mockedGetCachedConfig.mockImplementation((slug: string) => {
    if (slug === 'accounting-entities') {
      return vatByProductType
        ? { enabled: true, vatByProductType }
        : { enabled: false };
    }
    if (slug === 'payment') return { vatRate: 0.23 };
    return null;
  });
};

describe('StayVatSummary', () => {
  beforeEach(() => {
    mockedGetCachedConfig.mockReset();
  });

  it('shows only the backend total when a single rate applies', () => {
    mockConfigs();
    renderWithNextIntl(<StayVatSummary priceLock={priceLock()} />);

    expect(screen.getByText('Including Tax (VAT)')).toBeInTheDocument();
    expect(screen.getByText(/17/)).toBeInTheDocument();
    expect(screen.queryByText(/Accommodation \(/)).not.toBeInTheDocument();
  });

  it('itemizes per product when lines carry different rates', () => {
    mockConfigs({ accommodations: 17, food: 21 });
    renderWithNextIntl(
      <StayVatSummary priceLock={priceLock({ food: 121, vat: 40 })} />,
    );

    expect(screen.getByText('Including Tax (VAT)')).toBeInTheDocument();
    expect(screen.getByText('Accommodation (17%)')).toBeInTheDocument();
    expect(screen.getByText('Food (21%)')).toBeInTheDocument();
    // Total is the sum of the itemized parts: 17 + 21. Matched loosely since
    // priceFormat's separators and decimals depend on the machine locale.
    expect(screen.getByText(/38/)).toBeInTheDocument();
  });

  it('keeps a single row when every line shares one rate', () => {
    mockConfigs({ accommodations: 23, food: 23 });
    renderWithNextIntl(
      <StayVatSummary priceLock={priceLock({ food: 123 })} />,
    );

    expect(screen.queryByText(/Accommodation \(/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Food \(/)).not.toBeInTheDocument();
  });
});
