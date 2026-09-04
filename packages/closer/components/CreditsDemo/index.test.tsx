import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithNextIntl } from '../../test/utils';
import CreditsDemo from './index';

describe('CreditsDemo', () => {
  it('shows an unpaid stay before credits are applied', () => {
    renderWithNextIntl(<CreditsDemo creditsBalance={10} />);

    // 3 nights x €45 accommodation + €24 utilities.
    expect(screen.getByText('€159.00')).toBeInTheDocument();
    expect(screen.queryByText(/credits redeemed/)).toBeNull();
  });

  it('zeroes the accommodation line when credits are applied', async () => {
    renderWithNextIntl(<CreditsDemo creditsBalance={10} />);

    await userEvent.click(
      screen.getByRole('button', { name: /Apply discount/i }),
    );

    // Only the utility fee is left to pay, so it reads twice: as its own
    // line and as the total.
    expect(screen.getAllByText('€24.00')).toHaveLength(2);
    expect(
      screen.getByText(/3 credits redeemed — 3 nights/),
    ).toBeInTheDocument();
  });

  it('counts the demo spend against the real balance', async () => {
    renderWithNextIntl(<CreditsDemo creditsBalance={10} />);

    await userEvent.click(
      screen.getByRole('button', { name: /Apply discount/i }),
    );

    expect(screen.getByText(/balance would be 🥕 7/)).toBeInTheDocument();
  });

  it('never shows a negative balance for a member without credits', async () => {
    renderWithNextIntl(<CreditsDemo creditsBalance={0} />);

    await userEvent.click(
      screen.getByRole('button', { name: /Apply discount/i }),
    );

    expect(screen.getByText(/balance would be 🥕 0/)).toBeInTheDocument();
  });

  it('can be replayed', async () => {
    renderWithNextIntl(<CreditsDemo creditsBalance={10} />);

    await userEvent.click(
      screen.getByRole('button', { name: /Apply discount/i }),
    );
    await userEvent.click(screen.getByRole('button', { name: /Start over/i }));

    expect(screen.getByText('€159.00')).toBeInTheDocument();
  });
});
