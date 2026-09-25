import { useState } from 'react';

import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithNextIntl } from '../../../test/utils';
import type { HostChangeEntry } from '../../../types/stay';
import { getStayChanges, setStayStatus } from '../../../utils/stays.api';
import HostChangeHint from './hostChangeHint';
import StayHostActions, { HostActionId } from './stayHostActions';

jest.mock('../../../utils/stays.api', () => ({
  setStayStatus: jest.fn(),
  getStayChanges: jest.fn(),
}));

const mockedSetStatus = setStayStatus as jest.Mock;
const mockedChanges = getStayChanges as jest.Mock;

const Harness = ({
  status = 'confirmed',
  onStayChange = jest.fn(),
}: {
  status?: string;
  onStayChange?: jest.Mock;
}) => {
  const [openAction, setOpenAction] = useState<HostActionId | null>(null);
  return (
    <StayHostActions
      stayId="stay_1"
      status={status}
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
