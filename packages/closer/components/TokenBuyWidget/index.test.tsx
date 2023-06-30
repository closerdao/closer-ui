import { screen, waitFor } from '@testing-library/react';

import TokenBuyWidget from '.';
import { renderWithProviders } from '../../test/utils';

describe('TokenBuyWidget',  () => {
  const defaultTokensToBuy = 15;
  const defaultTokenPrice = 230.23;
  const defaultAccommodationPrice = 1;

  it('should have correct inputs', () => {
    renderWithProviders(
      <TokenBuyWidget
        tokensToBuy={defaultTokensToBuy}
        setTokensToBuy={jest.fn()}
      />,
    );

    const tokensToBuyInput = screen.getByLabelText(/\$tdf/i);
    const tokensToSellInput = screen.getByLabelText(/ceur/i);
    const daysToStayInput = screen.getByLabelText(/for/i);
    expect(tokensToBuyInput).toBeInTheDocument();
    expect(tokensToSellInput).toBeInTheDocument();
    expect(daysToStayInput).toBeInTheDocument();
  });

  it.skip('should calculate correct default values based on amount of tokens to buy', async () => {
    renderWithProviders(
      <TokenBuyWidget tokensToBuy={defaultTokensToBuy} setTokensToBuy={jest.fn()} />,
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
