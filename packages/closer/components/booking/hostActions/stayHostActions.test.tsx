import { useState } from 'react';

import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithNextIntl } from '../../../test/utils';
import type { HostChangeEntry } from '../../../types/stay';
import {
  exemptStayFromAutoCancel,
  getHostNotes,
  getStayChanges,
  getStayStripeIntents,
  releaseStayModification,
  saveHostNote,
  setStayStatus,
  settleStayStripe,
} from '../../../utils/stays.api';
import HostNoteBadge from '../hostNoteBadge';
import HostChangeHint from './hostChangeHint';
import StayHostActions, { HostActionId } from './stayHostActions';

jest.mock('../../../utils/stays.api', () => ({
  setStayStatus: jest.fn(),
  getStayChanges: jest.fn(),
  exemptStayFromAutoCancel: jest.fn(),
  getHostNotes: jest.fn(),
  saveHostNote: jest.fn(),
  getStayStripeIntents: jest.fn(),
  settleStayStripe: jest.fn(),
  releaseStayModification: jest.fn(),
  formatStayMoney: (money: { val: number; cur: string }) =>
    `${money.val} ${money.cur}`,
}));

const mockedSetStatus = setStayStatus as jest.Mock;
const mockedChanges = getStayChanges as jest.Mock;
const mockedExempt = exemptStayFromAutoCancel as jest.Mock;
const mockedHostNotes = getHostNotes as jest.Mock;
const mockedSaveHostNote = saveHostNote as jest.Mock;
const mockedIntents = getStayStripeIntents as jest.Mock;
const mockedSettle = settleStayStripe as jest.Mock;
const mockedRelease = releaseStayModification as jest.Mock;

const Harness = ({
  status = 'confirmed',
  pendingModificationStatus,
  onStayChange = jest.fn(),
}: {
  status?: string;
  pendingModificationStatus?: string;
  onStayChange?: jest.Mock;
}) => {
  const [openAction, setOpenAction] = useState<HostActionId | null>(null);
  return (
    <StayHostActions
      stayId="stay_1"
      status={status}
      pendingModificationStatus={pendingModificationStatus}
      openAction={openAction}
      onOpenActionChange={setOpenAction}
      onStayChange={onStayChange}
    />
  );
};

const entry = (over: Partial<HostChangeEntry>): HostChangeEntry => ({
  at: '2026-09-20T10:00:00.000Z',
  by: { _id: 'host_1', screenname: 'Seed Host' },
  action: 'set-status',
  before: { status: 'confirmed' },
  after: { status: 'cancelled' },
  reason: 'Guest asked by phone',
  ...over,
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('StayHostActions', () => {
  it('sets a status with the reason the host gave, then refreshes the stay', async () => {
    const onStayChange = jest.fn();
    const updated = { _id: 'stay_1', status: 'cancelled' };
    mockedSetStatus.mockResolvedValue(updated);
    renderWithNextIntl(<Harness onStayChange={onStayChange} />);

    await userEvent.click(screen.getByRole('button', { name: 'Host actions' }));
    await userEvent.click(screen.getByRole('menuitem', { name: 'Set status' }));

    const save = screen.getByRole('button', { name: 'Save' });
    await userEvent.selectOptions(
      screen.getByLabelText('New status'),
      'cancelled',
    );
    expect(save).toBeDisabled();

    await userEvent.type(
      screen.getByLabelText('Reason'),
      'Guest asked by phone',
    );
    await userEvent.click(save);

    await waitFor(() =>
      expect(mockedSetStatus).toHaveBeenCalledWith(
        'stay_1',
        'confirmed',
        'cancelled',
        'Guest asked by phone',
      ),
    );
    expect(onStayChange).toHaveBeenCalledWith(updated);
    await waitFor(() =>
      expect(screen.queryByLabelText('Reason')).not.toBeInTheDocument(),
    );
  });

  it.each([
    ['pending-payment', ['', 'confirmed', 'cancelled']],
    ['confirmed', ['', 'pending', 'cancelled']],
    ['paid', ['', 'cancelled']],
  ])(
    'never offers paid or pending payment (from %s)',
    async (status, expected) => {
      renderWithNextIntl(<Harness status={status} />);

      await userEvent.click(
        screen.getByRole('button', { name: 'Host actions' }),
      );
      await userEvent.click(
        screen.getByRole('menuitem', { name: 'Set status' }),
      );

      const options = within(screen.getByLabelText('New status'))
        .getAllByRole('option')
        .map((option) => (option as HTMLOptionElement).value);
      expect(options).toEqual(expected);
    },
  );

  it('keeps the modal open and shows the server refusal', async () => {
    mockedSetStatus.mockRejectedValue(
      new Error('Illegal stay status transition'),
    );
    renderWithNextIntl(<Harness />);

    await userEvent.click(screen.getByRole('button', { name: 'Host actions' }));
    await userEvent.click(screen.getByRole('menuitem', { name: 'Set status' }));
    await userEvent.selectOptions(
      screen.getByLabelText('New status'),
      'pending',
    );
    await userEvent.type(screen.getByLabelText('Reason'), 'why');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(
      await screen.findByText('Illegal stay status transition'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Reason')).toBeInTheDocument();
  });

  it('exempts a confirmed stay from auto-cancel with the reason the host gave', async () => {
    const onStayChange = jest.fn();
    const updated = { _id: 'stay_1', status: 'confirmed' };
    mockedExempt.mockResolvedValue(updated);
    renderWithNextIntl(<Harness onStayChange={onStayChange} />);

    await userEvent.click(screen.getByRole('button', { name: 'Host actions' }));
    await userEvent.click(
      screen.getByRole('menuitem', { name: 'Do not auto-cancel' }),
    );
    await userEvent.type(
      screen.getByLabelText('Reason'),
      'Paying cash at the door',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(mockedExempt).toHaveBeenCalledWith(
        'stay_1',
        'Paying cash at the door',
      ),
    );
    expect(onStayChange).toHaveBeenCalledWith(updated);
  });

  it.each(['pending', 'paid', 'cancelled'])(
    'offers Do not auto-cancel only on confirmed stays (not %s)',
    async (status) => {
      renderWithNextIntl(<Harness status={status} />);

      await userEvent.click(
        screen.getByRole('button', { name: 'Host actions' }),
      );

      expect(
        screen.queryByRole('menuitem', { name: 'Do not auto-cancel' }),
      ).not.toBeInTheDocument();
    },
  );

  it('History lists each change with who, what and why, and pages', async () => {
    mockedChanges
      .mockResolvedValueOnce({
        total: 2,
        page: 1,
        limit: 1,
        entries: [entry({})],
      })
      .mockResolvedValueOnce({
        total: 2,
        page: 2,
        limit: 1,
        entries: [
          entry({
            by: { _id: 'admin_1', screenname: 'Seed Admin' },
            action: 'edit-guest-note',
            before: { message: 'tent' },
            after: { message: 'van' },
            reason: undefined,
          }),
        ],
      });
    renderWithNextIntl(<Harness />);

    await userEvent.click(screen.getByRole('button', { name: 'Host actions' }));
    await userEvent.click(screen.getByRole('menuitem', { name: 'History' }));

    expect(
      await screen.findByText('status: confirmed → cancelled'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Reason: Guest asked by phone'),
    ).toBeInTheDocument();
    expect(screen.getByText(/Seed Host/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Load more' }));

    expect(await screen.findByText('message: tent → van')).toBeInTheDocument();
    expect(screen.getByText('Edit guest note')).toBeInTheDocument();
    expect(mockedChanges).toHaveBeenLastCalledWith('stay_1', 2);
    expect(
      screen.queryByRole('button', { name: 'Load more' }),
    ).not.toBeInTheDocument();
  });

  it('Notes edits the current host note with no reason asked, then refreshes the stay', async () => {
    const onStayChange = jest.fn();
    mockedHostNotes.mockResolvedValue({
      stay_1: {
        text: 'Booked for 2',
        updatedBy: 'host_1',
        updatedAt: '2026-09-20T10:00:00.000Z',
      },
    });
    mockedSaveHostNote.mockResolvedValue({
      text: 'Booked for 2, 2nd on the 12th',
    });
    renderWithNextIntl(<Harness onStayChange={onStayChange} />);

    await userEvent.click(screen.getByRole('button', { name: 'Host actions' }));
    await userEvent.click(screen.getByRole('menuitem', { name: 'Host note' }));

    const note = screen.getByLabelText('Host note');
    await waitFor(() => expect(note).toHaveValue('Booked for 2'));
    expect(mockedHostNotes).toHaveBeenCalledWith(['stay_1']);
    expect(screen.queryByLabelText('Reason')).not.toBeInTheDocument();

    await userEvent.type(note, ', 2nd on the 12th');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(mockedSaveHostNote).toHaveBeenCalledWith(
        'stay_1',
        'Booked for 2, 2nd on the 12th',
        '2026-09-20T10:00:00.000Z',
      ),
    );
    expect(onStayChange).toHaveBeenCalled();
    await waitFor(() =>
      expect(screen.queryByLabelText('Host note')).not.toBeInTheDocument(),
    );
  });

  it('Notes keeps the modal open and says so when the note changed since it was opened', async () => {
    mockedHostNotes.mockResolvedValue({});
    mockedSaveHostNote.mockRejectedValue(
      new Error(
        'This note changed since you opened it. Reload to see it, then edit again.',
      ),
    );
    renderWithNextIntl(<Harness />);

    await userEvent.click(screen.getByRole('button', { name: 'Host actions' }));
    await userEvent.click(screen.getByRole('menuitem', { name: 'Host note' }));
    const note = screen.getByLabelText('Host note');
    await waitFor(() => expect(note).toBeEnabled());
    await userEvent.type(note, 'mine');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(mockedSaveHostNote).toHaveBeenCalledWith('stay_1', 'mine', null);
    expect(
      await screen.findByText(/changed since you opened it/),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Host note')).toBeInTheDocument();
  });

  it('Notes says the note failed to load and keeps saving off', async () => {
    mockedHostNotes.mockRejectedValue(new Error('Could not load host notes'));
    renderWithNextIntl(<Harness />);

    await userEvent.click(screen.getByRole('button', { name: 'Host actions' }));
    await userEvent.click(screen.getByRole('menuitem', { name: 'Host note' }));

    expect(
      await screen.findByText('Could not load host notes'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Host note')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    expect(mockedSaveHostNote).not.toHaveBeenCalled();
  });

  it('Sync with Stripe shows what Stripe holds, then settles with the reason', async () => {
    const onStayChange = jest.fn();
    const paid = { _id: 'stay_1', status: 'paid' };
    mockedIntents.mockResolvedValue([
      {
        id: 'pi_new',
        status: 'succeeded',
        amount: { val: 160, cur: 'EUR' },
        created: '2026-09-20T10:00:00.000Z',
        action: 'settle',
        reason: null,
      },
      {
        id: 'pi_done',
        status: 'succeeded',
        amount: { val: 40, cur: 'EUR' },
        created: '2026-09-19T10:00:00.000Z',
        action: 'none',
        reason: 'already_settled',
      },
      {
        id: 'pi_refunded',
        status: 'succeeded',
        amount: { val: 80, cur: 'EUR' },
        created: '2026-09-18T10:00:00.000Z',
        action: 'none',
        reason: 'intent_refunded',
      },
    ]);
    mockedSettle.mockResolvedValue(paid);
    renderWithNextIntl(<Harness onStayChange={onStayChange} />);

    await userEvent.click(screen.getByRole('button', { name: 'Host actions' }));
    await userEvent.click(
      screen.getByRole('menuitem', { name: 'Sync with Stripe' }),
    );

    expect(await screen.findByText('pi_new')).toBeInTheDocument();
    expect(screen.getByText('160 EUR')).toBeInTheDocument();
    expect(
      screen.getByText('succeeded · will be recorded as paid'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('succeeded · already recorded'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('succeeded · refunded in Stripe, will not be recorded'),
    ).toBeInTheDocument();
    expect(mockedSettle).not.toHaveBeenCalled();

    await userEvent.type(screen.getByLabelText('Reason'), 'Guest closed tab');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(mockedSettle).toHaveBeenCalledWith('stay_1', 'Guest closed tab'),
    );
    expect(onStayChange).toHaveBeenCalledWith(paid);
  });

  it('Sync with Stripe cannot save when there is nothing to settle', async () => {
    mockedIntents.mockResolvedValue([]);
    renderWithNextIntl(<Harness />);

    await userEvent.click(screen.getByRole('button', { name: 'Host actions' }));
    await userEvent.click(
      screen.getByRole('menuitem', { name: 'Sync with Stripe' }),
    );

    expect(
      await screen.findByText('Stripe has no payments for this stay.'),
    ).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Reason'), 'Check');
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  it('offers Clear stuck hold only while a change is stuck settling', async () => {
    const onStayChange = jest.fn();
    const released = { _id: 'stay_1', status: 'paid' };
    mockedRelease.mockResolvedValue(released);
    const { unmount } = renderWithNextIntl(
      <Harness pendingModificationStatus="pending-payment" />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Host actions' }));
    expect(
      screen.queryByRole('menuitem', { name: 'Clear stuck hold' }),
    ).not.toBeInTheDocument();
    unmount();

    renderWithNextIntl(
      <Harness
        pendingModificationStatus="settling"
        onStayChange={onStayChange}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Host actions' }));
    await userEvent.click(
      screen.getByRole('menuitem', { name: 'Clear stuck hold' }),
    );
    await userEvent.type(screen.getByLabelText('Reason'), 'Stuck for a day');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(mockedRelease).toHaveBeenCalledWith('stay_1', 'Stuck for a day'),
    );
    expect(onStayChange).toHaveBeenCalledWith(released);
  });

  it('History says so when there is nothing yet', async () => {
    mockedChanges.mockResolvedValue({
      total: 0,
      page: 1,
      limit: 20,
      entries: [],
    });
    renderWithNextIntl(<Harness />);

    await userEvent.click(screen.getByRole('button', { name: 'Host actions' }));
    await userEvent.click(screen.getByRole('menuitem', { name: 'History' }));

    expect(await screen.findByText('No host changes yet.')).toBeInTheDocument();
  });
});

describe('HostNoteBadge', () => {
  it('renders nothing without a note', () => {
    const { container } = renderWithNextIntl(<HostNoteBadge note={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the note text', () => {
    renderWithNextIntl(
      <HostNoteBadge
        note={{ text: 'Late arrival', updatedBy: null, updatedAt: null }}
      />,
    );
    expect(screen.getByTestId('host-note-badge')).toHaveTextContent(
      'Late arrival',
    );
  });
});

describe('HostChangeHint', () => {
  it('renders nothing for an empty log', () => {
    const { container } = renderWithNextIntl(
      <HostChangeHint latest={null} onOpenHistory={jest.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('names who changed the stay and what, and opens History', async () => {
    const onOpenHistory = jest.fn();
    renderWithNextIntl(
      <HostChangeHint latest={entry({})} onOpenHistory={onOpenHistory} />,
    );

    const hint = screen.getByRole('button', {
      name: /^Last changed by Seed Host, .* ago — Set status$/,
    });
    await userEvent.click(hint);
    expect(onOpenHistory).toHaveBeenCalled();
  });
});
