import { screen } from '@testing-library/react';

import { renderWithNextIntl } from '../test/utils';
import { CloserCurrencies } from '../types';
import type { Charge } from '../types/booking';
import type { Stay } from '../types/stay';
import SummaryCosts from './SummaryCosts';

jest.mock('../hooks/useConfig', () => ({
  useConfig: () => ({ APP_NAME: 'tdf' }),
}));

const cash = {
  id: 'uuid',
  _id: 'c1',
  status: 'paid',
  method: 'cash',
  type: 'booking',
  date: new Date('2026-09-20T10:00:00.000Z'),
  amount: { total: { val: 50, cur: CloserCurrencies.EUR } },
  meta: { reference: 'till 3' },
} as Charge;

describe('SummaryCosts paid rows', () => {
  const money = (val: number) => ({ val, cur: CloserCurrencies.EUR });
  const token = (val: number) => ({ val, cur: CloserCurrencies.TDF });
  const stay = {
    tokensTarget: token(8.669192),
    tokensStaked: token(8.669192),
    priceLock: {
      lines: {
        accommodation: money(97.15),
        food: money(70),
        utility: money(20),
        event: money(0),
      },
      appliedTokens: token(10.836489),
      appliedCredits: { val: 0, cur: 'credits' },
      vat: money(44.46),
      total: money(237.72),
    },
  } as Stay;

  it.each([undefined, 'event-id'])(
    'separates fiat and tokens while preserving linked free events (%s)',
    (eventId) => {
      renderWithNextIntl(
        <SummaryCosts
          stay={{ ...stay, eventId }}
          useTokens
          useCredits={false}
          isFoodIncluded
          totalToken={token(15)}
          totalFiat={money(237.72)}
          rentalFiat={money(97.15)}
          rentalToken={token(15)}
          eventCost={money(0)}
          charges={[cash]}
          paymentDelta={{ fiat: money(50.57), token: token(-0.000001) }}
        />,
      );
      expect(
        screen.getByText('EUR portion of accommodation'),
      ).toBeInTheDocument();
      expect(screen.getByText('Total in EUR')).toBeInTheDocument();
      expect(screen.getByText('TDF 8.67')).toBeInTheDocument();
      expect(screen.getByText(/44[.,]46/)).toBeInTheDocument();
      expect(screen.getByText('Payment history')).toBeInTheDocument();
      expect(screen.queryByText(/Daily rate.*Nights/)).not.toBeInTheDocument();
      expect(
        screen.queryByText(/15[.,]00.*TDF|TDF.*15[.,]00/),
      ).not.toBeInTheDocument();
      if (eventId) expect(screen.getByText('Event cost')).toBeInTheDocument();
      else expect(screen.queryByText('Event cost')).not.toBeInTheDocument();
    },
  );
  it('shows the reference a host recorded next to an off-platform payment', () => {
    renderWithNextIntl(
      <SummaryCosts
        useTokens={false}
        useCredits={false}
        isFoodIncluded={false}
        totalToken={{ val: 0, cur: CloserCurrencies.TDF }}
        totalFiat={{ val: 100, cur: CloserCurrencies.EUR }}
        rentalFiat={{ val: 100, cur: CloserCurrencies.EUR }}
        status="confirmed"
        charges={[cash]}
        guestCostsLedger
      />,
    );

    expect(screen.getByText('cash')).toBeInTheDocument();
    expect(screen.getByText('till 3')).toBeInTheDocument();
  });
});
