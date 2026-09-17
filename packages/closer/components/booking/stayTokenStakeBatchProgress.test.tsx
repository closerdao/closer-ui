import { screen } from '@testing-library/react';

import { renderWithNextIntl } from '../../test/utils';
import { StayTokenStakeBatchProgress } from './stayTokenStakeBatchProgress';

describe('StayTokenStakeBatchProgress', () => {
  it('does not show batching information for a single transaction', () => {
    const { container } = renderWithNextIntl(
      <StayTokenStakeBatchProgress
        completedNights={0}
        totalNights={42}
        requiresMultipleTransactions={false}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('shows progress only after multiple transactions are required', () => {
    renderWithNextIntl(
      <StayTokenStakeBatchProgress
        completedNights={60}
        totalNights={180}
        requiresMultipleTransactions
        phase="awaiting-wallet"
      />,
    );

    expect(
      screen.getByText(
        'This long stay requires multiple wallet confirmations.',
      ),
    ).toBeVisible();
    expect(screen.getByText('60 of 180 nights secured')).toBeVisible();
    expect(
      screen.getByText('Confirm the current transaction in your wallet.'),
    ).toBeVisible();
  });

  it('does not show progress merely because a single transaction completed', () => {
    const { container } = renderWithNextIntl(
      <StayTokenStakeBatchProgress
        completedNights={60}
        totalNights={60}
        requiresMultipleTransactions={false}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
