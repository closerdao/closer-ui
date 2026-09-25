import { screen } from '@testing-library/react';

import { renderWithProviders } from '../test/utils';
import { CloserCurrencies } from '../types';
import SummaryCosts from './SummaryCosts';

const eur = (val: number) => ({ val, cur: CloserCurrencies.EUR });

const renderCosts = (hostAdjustment?: { val: number; cur: CloserCurrencies }) =>
  renderWithProviders(
    <SummaryCosts
      rentalFiat={eur(300)}
      rentalToken={{ val: 0, cur: CloserCurrencies.TDF }}
      totalToken={{ val: 0, cur: CloserCurrencies.TDF }}
      totalFiat={eur(300 + (hostAdjustment?.val ?? 0))}
      hostAdjustment={hostAdjustment}
      useTokens={false}
      useCredits={false}
      isFoodIncluded={false}
      priceDuration="night"
    />,
  );

describe('SummaryCosts host adjustment', () => {
  it('shows the guest the adjustment as a line of its own', () => {
    renderCosts(eur(-20));

    const label = screen.getByText('Adjustment by host');
    expect(label.parentElement).toHaveTextContent(
      /-\s?€\s?20\.00|−\s?€\s?20\.00|-20\.00\s?€/,
    );
  });

  it('shows nothing when there is no adjustment', () => {
    renderCosts();

    expect(screen.queryByText('Adjustment by host')).not.toBeInTheDocument();
  });
});
