import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithNextIntl } from '../../test/utils';
import type { PendingModification, Stay } from '../../types/stay';
import {
  confirmStayModification,
  discardStayModification,
  getStayModification,
  proposeStayModification,
} from '../../utils/stays.api';
import StayModifyFlow from './stayModifyFlow';

const push = jest.fn();
jest.mock('next/router', () => ({
  useRouter: () => ({ push, replace: jest.fn(), query: {}, asPath: '/' }),
}));

jest.mock('../../utils/stays.api', () => {
  const actual = jest.requireActual('../../utils/stays.api');
  return {
    ...actual,
    proposeStayModification: jest.fn(),
    getStayModification: jest.fn(),
    confirmStayModification: jest.fn(),
    discardStayModification: jest.fn(),
  };
});

const mockedPropose = proposeStayModification as jest.Mock;
const mockedRead = getStayModification as jest.Mock;
const mockedConfirm = confirmStayModification as jest.Mock;
const mockedDiscard = discardStayModification as jest.Mock;

const shortenHold: PendingModification = {
  id: 'hold_1',
  type: 'shorten',
  status: 'pending-payment',
  requestedBy: 'user_1',
  requestedAt: '2027-01-01T00:00:00.000Z',
  expiresAt: '2099-01-01T00:00:00.000Z',
  requiresHostApproval: false,
  overrides: { start: '2027-03-01', end: '2027-03-03', duration: 2 },
  quote: {
    fiatDelta: -60,
    currency: 'EUR',
    priceLockPreview: { total: { val: 120, cur: 'EUR' } },
  } as PendingModification['quote'],
};

const extendHold: PendingModification = {
  ...shortenHold,
  id: 'hold_2',
  type: 'dates',
  overrides: { start: '2027-03-01', end: '2027-03-06', duration: 5 },
  quote: {
    fiatDelta: 80,
    currency: 'EUR',
    priceLockPreview: { total: { val: 260, cur: 'EUR' } },
  } as PendingModification['quote'],
};

const baseStay = {
  _id: 'stay_1',
  status: 'paid',
  start: '2027-03-01T15:00:00.000Z',
  end: '2027-03-04T11:00:00.000Z',
  duration: 3,
  adults: 1,
  children: 0,
  infants: 0,
  pets: 0,
  createdBy: 'user_1',
  created: '2027-01-01T00:00:00.000Z',
  updated: '2027-01-01T00:00:00.000Z',
} as Stay;

const renderFlow = (stay: Stay, onStayChange = jest.fn()) =>
  renderWithNextIntl(
    <StayModifyFlow
      stay={stay}
      timeZone="Europe/Lisbon"
      onStayChange={onStayChange}
    />,
  );

describe('StayModifyFlow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedRead.mockResolvedValue(null);
  });

  it('shows what was paid, the new total and the delta from the held quote', async () => {
    mockedRead.mockResolvedValue(shortenHold);
    renderFlow({ ...baseStay, pendingModification: shortenHold });

    expect(await screen.findByText('Your change')).toBeInTheDocument();
    // paid is the new total less the delta: 120 - (-60)
    expect(screen.getByText('€180.00')).toBeInTheDocument();
    expect(screen.getByText('€120.00')).toBeInTheDocument();
    expect(screen.getByText('Back to you')).toBeInTheDocument();
    expect(screen.getByText('€60.00')).toBeInTheDocument();
  });

  it('resumes on the quote when the hold is still live', async () => {
    mockedRead.mockResolvedValue(extendHold);
    renderFlow({ ...baseStay, pendingModification: extendHold });

    expect(await screen.findByText('Your change')).toBeInTheDocument();
    expect(screen.getByText('Pay €80.00')).toBeInTheDocument();
  });

  it('shows nothing pending when the quote read comes back null', async () => {
    mockedRead.mockResolvedValue(null);
    renderFlow({ ...baseStay, pendingModification: extendHold });

    await waitFor(() =>
      expect(screen.getByText('Change your stay')).toBeInTheDocument(),
    );
    expect(screen.queryByText('Your change')).not.toBeInTheDocument();
  });

  it('proposes the picked dates rather than calling a per-kind route', async () => {
    const user = userEvent.setup();
    mockedPropose.mockResolvedValue({
      ...baseStay,
      pendingModification: extendHold,
    });
    renderFlow(baseStay);

    await waitFor(() => expect(mockedRead).toHaveBeenCalled());
    const checkout = screen.getByLabelText('New checkout');
    await user.clear(checkout);
    await user.type(checkout, '2027-03-06');
    await user.click(screen.getByRole('button', { name: 'Review change' }));

    await waitFor(() =>
      expect(mockedPropose).toHaveBeenCalledWith('stay_1', {
        start: '2027-03-01',
        end: '2027-03-06',
        adults: 1,
        children: 0,
        infants: 0,
        pets: 0,
      }),
    );
  });

  it('confirms a negative delta and reports the refund', async () => {
    const user = userEvent.setup();
    mockedRead.mockResolvedValue(shortenHold);
    mockedConfirm.mockResolvedValue({
      stay: { ...baseStay, pendingModification: null },
      refund: {
        refundVal: 60,
        stripe: { status: 'succeeded', refundedVal: 60 },
      },
    });
    renderFlow({ ...baseStay, pendingModification: shortenHold });

    await user.click(
      await screen.findByRole('button', { name: 'Confirm change' }),
    );

    await waitFor(() =>
      expect(mockedConfirm).toHaveBeenCalledWith('stay_1', undefined),
    );
    expect(
      await screen.findByText('Change confirmed. €60.00 refunded.'),
    ).toBeInTheDocument();
  });

  it('sends a positive delta to the stay payment page under the same booking id', async () => {
    const user = userEvent.setup();
    mockedRead.mockResolvedValue(extendHold);
    mockedConfirm.mockResolvedValue({
      stay: {
        ...baseStay,
        status: 'pending-payment',
        pendingModification: null,
        fiatTarget: { val: 260, cur: 'EUR' },
        fiatPaid: { val: 180, cur: 'EUR' },
      },
      refund: null,
    });
    renderFlow({ ...baseStay, pendingModification: extendHold });

    await user.click(await screen.findByRole('button', { name: 'Pay €80.00' }));

    await waitFor(() =>
      expect(push).toHaveBeenCalledWith('/stay/stay_1/payment'),
    );
    expect(mockedConfirm).not.toHaveBeenCalled();
  });

  it('discards the hold and goes back to the editor', async () => {
    const user = userEvent.setup();
    mockedRead.mockResolvedValue(shortenHold);
    mockedDiscard.mockResolvedValue({ ...baseStay, pendingModification: null });
    renderFlow({ ...baseStay, pendingModification: shortenHold });

    await user.click(
      await screen.findByRole('button', { name: 'Discard change' }),
    );

    await waitFor(() =>
      expect(mockedDiscard).toHaveBeenCalledWith('stay_1', undefined),
    );
    expect(await screen.findByText('Change your stay')).toBeInTheDocument();
  });

  it('waits for the host on an approval hold, with discard still offered', async () => {
    const approvalHold: PendingModification = {
      ...extendHold,
      status: 'pending-approval',
      expiresAt: null,
      requiresHostApproval: true,
    };
    mockedRead.mockResolvedValue(approvalHold);
    renderFlow({ ...baseStay, pendingModification: approvalHold });

    expect(
      await screen.findByText('Waiting for your host to approve this change.'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Discard change' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Pay €80.00' }),
    ).not.toBeInTheDocument();
  });

  it('lets a host approve the hold without being sent to pay for it', async () => {
    const user = userEvent.setup();
    const approvalHold: PendingModification = {
      ...extendHold,
      status: 'pending-approval',
      expiresAt: null,
      requiresHostApproval: true,
    };
    mockedRead.mockResolvedValue(approvalHold);
    mockedConfirm.mockResolvedValue({
      stay: {
        ...baseStay,
        status: 'pending-payment',
        pendingModification: null,
        fiatTarget: { val: 260, cur: 'EUR' },
        fiatPaid: { val: 180, cur: 'EUR' },
      },
      refund: null,
    });
    renderWithNextIntl(
      <StayModifyFlow
        stay={{ ...baseStay, pendingModification: approvalHold }}
        timeZone="Europe/Lisbon"
        isBookingOwner={false}
        onStayChange={jest.fn()}
      />,
    );

    // The delta is the guest's to pay, so the host never sees a Pay button.
    expect(
      screen.queryByRole('button', { name: 'Pay €80.00' }),
    ).not.toBeInTheDocument();
    await user.click(
      await screen.findByRole('button', { name: 'Approve change' }),
    );
    expect(mockedConfirm).not.toHaveBeenCalled();
    await user.type(screen.getByLabelText('Reason'), 'Room is free that week');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(mockedConfirm).toHaveBeenCalledWith(
        'stay_1',
        'Room is free that week',
      ),
    );
    expect(push).not.toHaveBeenCalled();
  });

  it('sends the owner, and only the owner, to pay a positive delta', async () => {
    const user = userEvent.setup();
    mockedRead.mockResolvedValue(extendHold);
    mockedConfirm.mockResolvedValue({
      stay: {
        ...baseStay,
        status: 'pending-payment',
        pendingModification: null,
        fiatTarget: { val: 260, cur: 'EUR' },
        fiatPaid: { val: 180, cur: 'EUR' },
      },
      refund: null,
    });
    renderWithNextIntl(
      <StayModifyFlow
        stay={{ ...baseStay, pendingModification: extendHold }}
        timeZone="Europe/Lisbon"
        isBookingOwner
        onStayChange={jest.fn()}
      />,
    );

    await user.click(await screen.findByRole('button', { name: 'Pay €80.00' }));

    await waitFor(() =>
      expect(push).toHaveBeenCalledWith('/stay/stay_1/payment'),
    );
    expect(mockedConfirm).not.toHaveBeenCalled();
  });

  it('shows a host who approved a change the guest pays for that it waits on that payment', async () => {
    const user = userEvent.setup();
    const approvalHold: PendingModification = {
      ...extendHold,
      status: 'pending-approval',
      expiresAt: null,
      requiresHostApproval: true,
    };
    const approvedHold: PendingModification = {
      ...approvalHold,
      status: 'pending-payment',
      expiresAt: '2099-01-01T00:00:00.000Z',
    };
    mockedRead.mockResolvedValue(approvalHold);
    mockedConfirm.mockResolvedValue({
      stay: { ...baseStay, pendingModification: approvedHold },
      refund: null,
    });
    renderWithNextIntl(
      <StayModifyFlow
        stay={{ ...baseStay, pendingModification: approvalHold }}
        timeZone="Europe/Lisbon"
        isBookingOwner={false}
        onStayChange={jest.fn()}
      />,
    );

    await user.click(
      await screen.findByRole('button', { name: 'Approve change' }),
    );
    await user.type(screen.getByLabelText('Reason'), 'Room is free');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(mockedConfirm).toHaveBeenCalledWith('stay_1', 'Room is free');
    expect(
      await screen.findByText(
        'Approved. The change applies once the guest pays the difference.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Approve change' }),
    ).not.toBeInTheDocument();
  });

  // closer-api#728: a change owing tokens, or card money and credits, is paid on the payment page, never confirmed first.
  it.each([
    ['tokens and card money', { tokensDelta: 2 }, 'Pay €80.00'],
    ['credits and card money', { creditsDelta: 2 }, 'Pay €80.00'],
    [
      'tokens alone',
      { fiatDelta: 0, tokensDelta: 2 },
      'Stake tokens to confirm',
    ],
  ])(
    'sends the owner of a change owing %s to the payment page without confirming',
    async (_label, quote, button) => {
      const user = userEvent.setup();
      const hold: PendingModification = {
        ...extendHold,
        quote: { ...extendHold.quote, ...quote },
      };
      mockedRead.mockResolvedValue(hold);
      renderFlow({ ...baseStay, pendingModification: hold });

      await user.click(await screen.findByRole('button', { name: button }));

      await waitFor(() =>
        expect(push).toHaveBeenCalledWith('/stay/stay_1/payment'),
      );
      expect(mockedConfirm).not.toHaveBeenCalled();
    },
  );

  it('confirms a change owing credits alone, which the confirm spends', async () => {
    const user = userEvent.setup();
    const hold: PendingModification = {
      ...extendHold,
      quote: { ...extendHold.quote, fiatDelta: 0, creditsDelta: 2 },
    };
    mockedRead.mockResolvedValue(hold);
    mockedConfirm.mockResolvedValue({
      stay: { ...baseStay, pendingModification: null },
      refund: null,
    });
    renderFlow({ ...baseStay, pendingModification: hold });

    await user.click(
      await screen.findByRole('button', { name: 'Confirm change' }),
    );

    await waitFor(() =>
      expect(mockedConfirm).toHaveBeenCalledWith('stay_1', undefined),
    );
    expect(push).not.toHaveBeenCalled();
  });

  it('surfaces the API message verbatim', async () => {
    const user = userEvent.setup();
    mockedRead.mockResolvedValue(shortenHold);
    mockedConfirm.mockRejectedValue({
      response: {
        data: { error: 'That change drops a night you have already stayed.' },
      },
    });
    renderFlow({ ...baseStay, pendingModification: shortenHold });

    await user.click(
      await screen.findByRole('button', { name: 'Confirm change' }),
    );

    expect(
      await screen.findByText(
        'That change drops a night you have already stayed.',
      ),
    ).toBeInTheDocument();
  });

  it('asks a host changing a guest stay for a reason, and offers it again on confirm', async () => {
    const user = userEvent.setup();
    mockedPropose.mockResolvedValue({
      ...baseStay,
      pendingModification: { ...extendHold, requestedBy: 'host_1' },
    });
    mockedConfirm.mockResolvedValue({
      stay: { ...baseStay, pendingModification: null },
      refund: null,
    });
    renderWithNextIntl(
      <StayModifyFlow
        stay={baseStay}
        timeZone="Europe/Lisbon"
        isBookingOwner={false}
        onStayChange={jest.fn()}
      />,
    );

    await waitFor(() => expect(mockedRead).toHaveBeenCalled());
    const checkout = screen.getByLabelText('New checkout');
    await user.clear(checkout);
    await user.type(checkout, '2027-03-06');
    await user.click(screen.getByRole('button', { name: 'Review change' }));
    expect(mockedPropose).not.toHaveBeenCalled();
    await user.type(screen.getByLabelText('Reason'), 'Guest asked by email');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(mockedPropose).toHaveBeenCalledWith(
        'stay_1',
        expect.objectContaining({
          end: '2027-03-06',
          reason: 'Guest asked by email',
        }),
      ),
    );
    await user.click(
      await screen.findByRole('button', { name: 'Approve change' }),
    );
    expect(screen.getByLabelText('Reason')).toHaveValue('Guest asked by email');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(mockedConfirm).toHaveBeenCalledWith(
        'stay_1',
        'Guest asked by email',
      ),
    );
  });

  it('asks a host discarding a guest change for a reason', async () => {
    const user = userEvent.setup();
    mockedRead.mockResolvedValue(shortenHold);
    mockedDiscard.mockResolvedValue({ ...baseStay, pendingModification: null });
    renderWithNextIntl(
      <StayModifyFlow
        stay={{ ...baseStay, pendingModification: shortenHold }}
        timeZone="Europe/Lisbon"
        isBookingOwner={false}
        onStayChange={jest.fn()}
      />,
    );

    await user.click(
      await screen.findByRole('button', { name: 'Discard change' }),
    );
    await user.type(
      screen.getByLabelText('Reason'),
      'Guest changed their mind',
    );
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(mockedDiscard).toHaveBeenCalledWith(
        'stay_1',
        'Guest changed their mind',
      ),
    );
  });
});

describe('an expired hold', () => {
  it('is not resumed even when the stay still carries it', async () => {
    jest.clearAllMocks();
    mockedRead.mockResolvedValue(null);
    const expired: PendingModification = {
      ...extendHold,
      expiresAt: '2000-01-01T00:00:00.000Z',
    };
    await act(async () => {
      renderFlow({ ...baseStay, pendingModification: expired });
    });

    expect(screen.getByText('Change your stay')).toBeInTheDocument();
  });
});
