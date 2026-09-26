import { screen } from '@testing-library/react';

import { renderWithNextIntl } from '../test/utils';
import { CloserCurrencies } from '../types';
import type { Charge } from '../types/booking';
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
