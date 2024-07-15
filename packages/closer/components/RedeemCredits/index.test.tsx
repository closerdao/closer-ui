import { screen } from '@testing-library/react';

import RedeemCredits from '.';
import { CloserCurrencies } from '../../types';
import { renderWithNextIntl } from '../../test/utils';

jest.mock('../../hooks/useConfig', () => ({
  // Replace with the actual path to useConfig
  useConfig: jest.fn().mockReturnValue({
    APP_NAME: 'TDF',
  }),
}));

describe('RedeemCredits', () => {
  it('should have correct heading in demo mode', () => {
    renderWithNextIntl(<RedeemCredits isDemo={true} />);
    const heading = screen.getByRole('heading', {
      name: /redeem your carrots \[demo\]/i,
    });
    expect(heading).toBeInTheDocument();
  });

  it('should have correct heading in live checkout mode', () => {
    renderWithNextIntl(
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
    renderWithNextIntl(
      <RedeemCredits
        rentalFiat={{ val: 0, cur: CloserCurrencies.EUR }}
        hasAppliedCredits={true}
      />,
    );
    const message = screen.getByText(
      /carrots will be redeemed! Accommodation cost updated./i,
    );
    expect(message).toBeInTheDocument();
  });

  it('should display error message if creditsError is passed', () => {
    renderWithNextIntl(<RedeemCredits creditsError={'Some error'} />);

    const errorMessage = screen.getByText(/Some error/i);
    expect(errorMessage).toBeInTheDocument();
  });
});
