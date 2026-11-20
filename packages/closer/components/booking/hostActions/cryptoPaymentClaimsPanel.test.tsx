import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithNextIntl } from '../../../test/utils';
import type { CryptoPaymentClaim } from '../../../types/stay';
import { decideCryptoPaymentClaim } from '../../../utils/stays.api';
import CryptoPaymentClaimsPanel from './cryptoPaymentClaimsPanel';

jest.mock('../../../utils/stays.api', () => ({
  ...jest.requireActual('../../../utils/stays.api'),
  decideCryptoPaymentClaim: jest.fn(),
}));

const mockedDecide = decideCryptoPaymentClaim as jest.Mock;
const txHash = `0x${'c'.repeat(64)}`;

const claim = (over: Partial<CryptoPaymentClaim> = {}): CryptoPaymentClaim => ({
  txHash,
  status: 'pending',
  submittedAt: '2026-11-10T12:00:00.000Z',
  receivedAmount: 95,
  exactMatch: false,
  sender: '0xguest',
  blockTime: '2026-11-10T11:00:00.000Z',
  ...over,
});

const renderPanel = (claims: CryptoPaymentClaim[], onDone = jest.fn()) =>
  renderWithNextIntl(
    <CryptoPaymentClaimsPanel
      stayId="stay_1"
      claims={claims}
      owed={{ val: 100, cur: 'EUR' }}
      onDone={onDone}
    />,
  );

beforeEach(() => {
  jest.clearAllMocks();
  mockedDecide.mockResolvedValue({ _id: 'stay_1' });
});

describe('Crypto payment claims (host)', () => {
  it('shows received vs due, the match, sender, block time and an explorer link', () => {
    renderPanel([claim()]);

    expect(screen.getByText(/Received .*95.*, due .*100/)).toBeInTheDocument();
    expect(screen.getByText(/not the amount due/)).toBeInTheDocument();
    expect(
      screen.getByText(/From 0xguest, sent 10\/11\/2026/),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: txHash })).toHaveAttribute(
      'href',
      expect.stringMatching(new RegExp(`/tx/${txHash}$`)),
    );
  });

  it('approves the claim, then refreshes the stay', async () => {
    const onDone = jest.fn();
    renderPanel([claim()], onDone);

    await userEvent.click(screen.getByRole('button', { name: 'Approve' }));

    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(mockedDecide).toHaveBeenCalledWith('stay_1', 'approve', txHash);
  });

  it('shows the API error when approval is refused', async () => {
    mockedDecide.mockRejectedValue(
      new Error('This transaction has already been recorded.'),
    );
    renderPanel([claim()]);

    await userEvent.click(screen.getByRole('button', { name: 'Approve' }));

    expect(
      await screen.findByText('This transaction has already been recorded.'),
    ).toBeInTheDocument();
  });

  it('rejects with the reason the guest will see', async () => {
    const onDone = jest.fn();
    renderPanel([claim()], onDone);

    await userEvent.click(screen.getByRole('button', { name: 'Reject' }));
    await userEvent.type(
      screen.getByLabelText('Reason (optional, the guest sees it)'),
      'Wrong network',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(mockedDecide).toHaveBeenCalledWith(
        'stay_1',
        'reject',
        txHash,
        'Wrong network',
      ),
    );
    expect(onDone).toHaveBeenCalled();
  });

  it('shows nothing when no claim is pending', () => {
    const { container } = renderPanel([claim({ status: 'approved' })]);

    expect(container).toBeEmptyDOMElement();
  });
});
