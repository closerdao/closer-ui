import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';

import { tokenAmountNumberFromWei } from '../../hooks/useTokenAmountFormatter';
import messagesEn from '../../locales/base-en.json';
import messagesPt from '../../locales/base-pt.json';
import type { PriceLock, StayTokenStakePlan } from '../../types/stay';
import { StayTokenStakeAmountSummary } from './stayTokenStakeAmountSummary';

const weeklyPriceLock = {
  accommodationDiscount: {
    duration: { tier: 'weekly', fraction: 0.3 },
    passport: { fraction: 0 },
    combinedFraction: 0.3,
  },
  accommodationPricing: {
    token: {
      grossWei: '70000000000000000',
      discountedWei: '49000000000000000',
    },
  },
} as PriceLock;

const sevenNightPlan: StayTokenStakePlan = {
  pricePerNightWei: '7000000000000000',
  totalWei: '49000000000000000',
  decimals: 18,
  displayDecimals: 6,
  bookingNights: Array.from({ length: 7 }, (_, index) => [2026, 335 + index]),
  tokenAmount: 0.049,
};

const renderSummary = ({
  locale = 'en',
  priceLock = weeklyPriceLock,
  stakePlan = sevenNightPlan,
  tokensOwed = stakePlan.tokenAmount,
}: {
  locale?: 'en' | 'pt';
  priceLock?: PriceLock;
  stakePlan?: StayTokenStakePlan;
  tokensOwed?: number;
} = {}) =>
  render(
    <NextIntlClientProvider
      locale={locale}
      messages={locale === 'pt' ? messagesPt : messagesEn}
      timeZone="Europe/Lisbon"
    >
      <StayTokenStakeAmountSummary
        priceLock={priceLock}
        stakePlan={stakePlan}
        tokensOwed={tokensOwed}
      />
    </NextIntlClientProvider>,
  );

describe('StayTokenStakeAmountSummary', () => {
  it('shows exact small token values and the applied weekly discount', () => {
    renderSummary();

    expect(screen.getByText('0.07 $TDF')).toHaveClass('line-through');
    expect(screen.getByText('0.049 $TDF')).toBeVisible();
    expect(screen.getByText('for 7 nights')).toBeVisible();
    expect(screen.getByText('Weekly stay −30%')).toBeVisible();
  });

  it('removes unnecessary trailing zeros from whole and fractional values', () => {
    renderSummary({
      priceLock: {} as PriceLock,
      stakePlan: {
        ...sevenNightPlan,
        pricePerNightWei: '4000000000000000000',
        totalWei: '4000000000000000000',
        bookingNights: [[2026, 335]],
        tokenAmount: 4,
      },
    });

    expect(screen.getByText('4 $TDF')).toBeVisible();
    expect(screen.getByText('for 1 night')).toBeVisible();
    expect(screen.queryByText(/4\.00/)).not.toBeInTheDocument();
  });

  it('keeps meaningful fractional digits without padding them', () => {
    renderSummary({
      priceLock: {} as PriceLock,
      stakePlan: {
        ...sevenNightPlan,
        pricePerNightWei: '4500000000000000000',
        totalWei: '4500000000000000000',
        bookingNights: [[2026, 335]],
        tokenAmount: 4.5,
      },
    });

    expect(screen.getByText('4.5 $TDF')).toBeVisible();
    expect(screen.getByText('for 1 night')).toBeVisible();
    expect(screen.queryByText(/4\.50/)).not.toBeInTheDocument();
  });

  it('uses the on-chain per-night price for a partial token stake', () => {
    renderSummary({
      priceLock: {} as PriceLock,
      stakePlan: {
        ...sevenNightPlan,
        pricePerNightWei: '3710000000000000000',
        totalWei: '25970000000000000000',
        tokenAmount: 25.97,
      },
    });

    expect(screen.getByText('25.97 $TDF')).toBeVisible();
    expect(screen.getByText('for 7 nights')).toBeVisible();
    expect(screen.queryByText('49 $TDF')).not.toBeInTheDocument();
  });

  it('uses locale-aware decimal formatting in Portuguese', () => {
    renderSummary({ locale: 'pt' });

    expect(screen.getByText('0,07 $TDF')).toHaveClass('line-through');
    expect(screen.getByText('0,049 $TDF')).toBeVisible();
    expect(screen.getByText('por 7 noites')).toBeVisible();
    expect(screen.getByText('Estadia semanal −30%')).toBeVisible();
  });
});

describe('tokenAmountNumberFromWei', () => {
  it('returns a safe fallback signal for invalid wei input', () => {
    expect(tokenAmountNumberFromWei('not-wei', 18)).toBeNull();
  });
});
