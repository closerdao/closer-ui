import { screen, waitFor } from '@testing-library/react';

import TokenBuyWidget from '.';
import { renderWithProviders } from '../../test/utils';

describe('TokenBuyWidget', () => {
  const defaultTokensToBuy = 15;
  const defaultTokensToSpend = 100;
  const defaultAccommodationPrice = 1;

  it('should have correct inputs', () => {
    renderWithProviders(
      <TokenBuyWidget
        tokensToBuy={defaultTokensToBuy}
        setTokensToBuy={jest.fn()}
        tokensToSpend={defaultTokensToSpend}
        setTokensToSpend={jest.fn()}
      />,
    );

    const tokensToBuyInput = screen.getByLabelText(/\$tdf/i);
    const tokensToSellInput = screen.getByLabelText(/eur/i);
    expect(tokensToBuyInput).toBeInTheDocument();
    expect(tokensToSellInput).toBeInTheDocument();
  });

  it.skip('should calculate correct default values based on amount of tokens to buy', async () => {
    renderWithProviders(
      <TokenBuyWidget
        tokensToBuy={defaultTokensToBuy}
        setTokensToBuy={jest.fn()}
        tokensToSpend={defaultTokensToSpend}
        setTokensToSpend={jest.fn()}
      />,
    );

    const tokensToBuyInput = screen.getByLabelText(/\$tdf/i);
    const daysToStayInput = screen.getByLabelText(/for/i);
    expect(tokensToBuyInput).toHaveValue(defaultTokensToBuy.toString());

    await waitFor(() => {
      expect(daysToStayInput).toHaveValue(
        Math.ceil(defaultTokensToBuy * defaultAccommodationPrice).toString(),
      );
    });
  });
});
