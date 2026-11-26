import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithNextIntl } from '../../test/utils';
import type { CryptoPaymentClaim } from '../../types/stay';
import { submitCryptoPaymentClaim } from '../../utils/stays.api';
import CryptoPaymentClaimForm from './cryptoPaymentClaimForm';

jest.mock('../../utils/stays.api', () => ({
  submitCryptoPaymentClaim: jest.fn(),
}));

const mockedSubmit = submitCryptoPaymentClaim as jest.Mock;
const txHash = `0x${'aB'.repeat(32)}`;
const label = 'Already paid in crypto? Paste the transaction hash';

const claim = (over: Partial<CryptoPaymentClaim>): CryptoPaymentClaim => ({
  txHash,
  status: 'pending',
  submittedAt: '2026-11-10T12:00:00.000Z',
  receivedAmount: 100,
  exactMatch: true,
  ...over,
});

beforeEach(() => {
  jest.clearAllMocks();
  mockedSubmit.mockResolvedValue({ _id: 'stay_1' });
});

describe('Crypto payment claim (guest)', () => {
  it('submits a valid hash, then refreshes the stay', async () => {
    const onSubmitted = jest.fn();
    renderWithNextIntl(
      <CryptoPaymentClaimForm
        stayId="stay_1"
        claims={[]}
        canSubmit
        onSubmitted={onSubmitted}
      />,
    );

    await userEvent.type(screen.getByLabelText(label), ` ${txHash} `);
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => expect(onSubmitted).toHaveBeenCalled());
    expect(mockedSubmit).toHaveBeenCalledWith('stay_1', txHash);
  });

  it('refuses anything but 0x and 64 hex characters before calling the API', async () => {
    renderWithNextIntl(
      <CryptoPaymentClaimForm
        stayId="stay_1"
        claims={[]}
        canSubmit
        onSubmitted={jest.fn()}
      />,
    );

    await userEvent.type(screen.getByLabelText(label), '0x1234');
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));

    expect(
      screen.getByText(/0x followed by 64 characters/),
    ).toBeInTheDocument();
    expect(mockedSubmit).not.toHaveBeenCalled();
  });

  it('shows the API error', async () => {
    mockedSubmit.mockRejectedValue(
      new Error('This transaction was sent before the stay was booked.'),
    );
    renderWithNextIntl(
      <CryptoPaymentClaimForm
        stayId="stay_1"
        claims={[]}
        canSubmit
        onSubmitted={jest.fn()}
      />,
    );

    await userEvent.type(screen.getByLabelText(label), txHash);
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));

    expect(
      await screen.findByText(
        'This transaction was sent before the stay was booked.',
      ),
    ).toBeInTheDocument();
  });

  it('lists each claim with its status, and the reject reason, without the form once nothing is owed', () => {
    renderWithNextIntl(
      <CryptoPaymentClaimForm
        stayId="stay_1"
        claims={[
          claim({ status: 'pending' }),
          claim({ txHash: `0x${'1'.repeat(64)}`, status: 'approved' }),
          claim({
            txHash: `0x${'2'.repeat(64)}`,
            status: 'rejected',
            reason: 'Wrong network',
          }),
        ]}
        canSubmit={false}
        onSubmitted={jest.fn()}
      />,
    );

    expect(
      screen.getByText('Waiting for the host to confirm'),
    ).toBeInTheDocument();
    expect(screen.getByText('Confirmed by the host')).toBeInTheDocument();
    expect(
      screen.getByText('Rejected by the host: Wrong network'),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText(label)).not.toBeInTheDocument();
  });
});
