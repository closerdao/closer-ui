import { render, screen } from '@testing-library/react';

import RedeemCredits from '.';
import { CloserCurrencies } from '../../types';

describe('RedeemCredits', () => {
  it('should have correct heading in demo mode', () => {
    render(<RedeemCredits isDemo={true} />);
    const heading = screen.getByRole('heading', {
      name: /redeem your carrots \[demo\]/i,
    });
    expect(heading).toBeInTheDocument();
  });

  it('should have correct heading in live checkout mode', () => {
    render(
      <RedeemCredits
        rentalFiat={{ val: 30, cur: CloserCurrencies.EUR }}
        hasAppliedCredits={false}
      />,
    );
    const heading = screen.getByRole('heading', {
      name: /redeem your carrots/i,
    });
    expect(heading).toBeInTheDocument();
  });

  it('should have correct success message', () => {
    render(
      <RedeemCredits
        rentalFiat={{ val: 0, cur: CloserCurrencies.EUR }}
        hasAppliedCredits={true}
      />,
    );
    const message = screen.getByText(
      /carrots redeemed successfully! Accommodation cost updated./i,
    );
    expect(message).toBeInTheDocument();
  });

  it('should display error message if creditsError is passed', () => {
    render(<RedeemCredits creditsError={'Some error'} />);

    const errorMessage = screen.getByText(/Some error/i);
    expect(errorMessage).toBeInTheDocument();
  });
});