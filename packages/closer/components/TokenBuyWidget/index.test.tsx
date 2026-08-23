import { act, fireEvent, screen, waitFor } from '@testing-library/react';

import { renderWithProviders } from '../../test/utils';
import TokenBuyWidget from './index';

describe('TokenBuyWidget', () => {
  const defaultTokensToBuy = 15;
  const defaultTokensToSpend = 100;
  const defaultAccommodationPrice = 1;

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should have correct inputs', async () => {
    await act(async () => {
      renderWithProviders(
        <TokenBuyWidget
          tokensToBuy={defaultTokensToBuy}
          setTokensToBuy={jest.fn()}
          tokensToSpend={defaultTokensToSpend}
          setTokensToSpend={jest.fn()}
        />,
      );
    });

    await act(async () => {
      jest.advanceTimersByTime(350);
    });

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

  it('rounds the nights-per-year estimate to two decimals', async () => {
    // Under NODE_ENV=test the widget prices every listing at one token a
    // night, so feed the repeating decimal straight in: a 10-token balance
    // against a 3-token listing used to render 3.3333333333333335.
    await act(async () => {
      renderWithProviders(
        <TokenBuyWidget
          tokensToBuy={10 / 3}
          setTokensToBuy={jest.fn()}
          tokensToSpend={defaultTokensToSpend}
          setTokensToSpend={jest.fn()}
        />,
      );
    });

    await act(async () => {
      jest.advanceTimersByTime(350);
    });

    expect(screen.getByText('3.33')).toBeInTheDocument();
    expect(screen.queryByText('3.3333333333333335')).not.toBeInTheDocument();
  });
});
