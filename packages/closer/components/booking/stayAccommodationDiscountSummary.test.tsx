import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';

import messagesEn from '../../locales/base-en.json';
import messagesPt from '../../locales/base-pt.json';
import type { PriceLock } from '../../types/stay';
import { StayAccommodationDiscountSummary } from './stayAccommodationDiscountSummary';

const priceLock = {
  accommodationDiscount: {
    duration: { tier: 'weekly', fraction: 0.335 },
    passport: { fraction: 0 },
    combinedFraction: 0.335,
  },
} as PriceLock;

const renderSummary = (locale: 'en' | 'pt') =>
  render(
    <NextIntlClientProvider
      locale={locale}
      messages={locale === 'pt' ? messagesPt : messagesEn}
      timeZone="Europe/Lisbon"
    >
      <StayAccommodationDiscountSummary priceLock={priceLock} />
    </NextIntlClientProvider>,
  );

describe('StayAccommodationDiscountSummary', () => {
  it('formats fractional percentages with the English locale', () => {
    renderSummary('en');
    expect(screen.getByText('Duration −33.5%')).toBeVisible();
  });

  it('formats fractional percentages with the Portuguese locale', () => {
    renderSummary('pt');
    expect(screen.getByText('Duração −33,5%')).toBeVisible();
  });
});
