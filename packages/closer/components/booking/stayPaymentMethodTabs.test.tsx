import { useState } from 'react';

import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithNextIntl } from '../../test/utils';
import {
  StayPaymentMethodTabs,
  type StayPaymentMethodTab,
} from './stayCryptoPaymentSection';

function Harness({ initial = 'card' }: { initial?: StayPaymentMethodTab }) {
  const [active, setActive] = useState<StayPaymentMethodTab>(initial);
  return (
    <>
      <StayPaymentMethodTabs active={active} onChange={setActive} />
      <p>{active === 'card' ? 'card-panel' : 'crypto-panel'}</p>
    </>
  );
}

describe('StayPaymentMethodTabs', () => {
  it('renders card and crypto tabs with card selected by default', () => {
    renderWithNextIntl(<Harness />);

    const cardTab = screen.getByRole('tab', { name: /pay with card/i });
    const cryptoTab = screen.getByRole('tab', { name: /pay with crypto/i });
    expect(cardTab).toHaveAttribute('aria-selected', 'true');
    expect(cryptoTab).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByText('card-panel')).toBeInTheDocument();
  });

  it('switches the active tab on click', async () => {
    const user = userEvent.setup();
    renderWithNextIntl(<Harness />);

    await user.click(screen.getByRole('tab', { name: /pay with crypto/i }));

    expect(
      screen.getByRole('tab', { name: /pay with crypto/i }),
    ).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: /pay with card/i })).toHaveAttribute(
      'aria-selected',
      'false',
    );
    expect(screen.getByText('crypto-panel')).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: /pay with card/i }));
    expect(screen.getByText('card-panel')).toBeInTheDocument();
  });
});
