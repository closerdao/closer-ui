import { useState } from 'react';

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithNextIntl } from '../../../test/utils';
import type { Charge } from '../../../types/booking';
import { offPlatformRevenue } from '../../../utils/bookingChargesLedger.helpers';
import { fetchAllCharges } from '../../../utils/chargePages';
import {
  recordStayPayment,
  reverseStayPayment,
} from '../../../utils/stays.api';
import { reversibleOffPlatformCharges } from './hostChangeLog.helpers';
import StayHostActions, { HostActionId } from './stayHostActions';

jest.mock('../../../utils/stays.api', () => ({
  recordStayPayment: jest.fn(),
  reverseStayPayment: jest.fn(),
  getStayChanges: jest.fn(),
  setStayStatus: jest.fn(),
}));
jest.mock('../../../utils/chargePages', () => ({
  fetchAllCharges: jest.fn(),
}));

const mockedRecord = recordStayPayment as jest.Mock;
const mockedReverse = reverseStayPayment as jest.Mock;
const mockedCharges = fetchAllCharges as jest.Mock;

const charge = (over: Partial<Charge>): Charge =>
  ({
    id: 'uuid',
    _id: 'c1',
    status: 'paid',
    method: 'cash',
    type: 'booking',
    date: new Date('2026-09-20T10:00:00.000Z'),
    amount: { total: { val: 50, cur: 'EUR' } },
    meta: {},
    ...over,
  }) as Charge;

const Harness = ({
  onStayChange = jest.fn(),
}: {
  onStayChange?: jest.Mock;
}) => {
  const [openAction, setOpenAction] = useState<HostActionId | null>(null);
  return (
    <StayHostActions
      stayId="stay_1"
      status="confirmed"
      openAction={openAction}
      onOpenActionChange={setOpenAction}
      onStayChange={onStayChange}
    />
  );
};

const openRecordPayment = async () => {
  await userEvent.click(screen.getByRole('button', { name: 'Host actions' }));
  await userEvent.click(
    screen.getByRole('menuitem', { name: 'Record payment' }),
  );
};

beforeEach(() => {
  jest.clearAllMocks();
  mockedCharges.mockResolvedValue([]);
});

describe('Record payment', () => {
  it('records a cash payment with its amount, reference and reason', async () => {
    const onStayChange = jest.fn();
    const updated = { _id: 'stay_1', status: 'confirmed' };
    mockedRecord.mockResolvedValue(updated);
    renderWithNextIntl(<Harness onStayChange={onStayChange} />);

    await openRecordPayment();
    expect(screen.queryByLabelText('What happened')).not.toBeInTheDocument();
    const save = screen.getByRole('button', { name: 'Save' });
    await userEvent.type(screen.getByLabelText('Reason'), 'Paid at the door');
    expect(save).toBeDisabled();

    await userEvent.type(screen.getByLabelText('Amount'), '50');
    const referenceField = screen.getByLabelText(
      'Reference (optional, the guest sees it)',
    );
    expect(referenceField).toHaveAccessibleDescription(
      /Shown to the guest next to the payment/,
    );
    await userEvent.type(referenceField, 'till 3');
    await userEvent.click(save);

    await waitFor(() =>
      expect(mockedRecord).toHaveBeenCalledWith('stay_1', {
        method: 'cash',
        amount: 50,
        reference: 'till 3',
        reason: 'Paid at the door',
      }),
    );
    expect(onStayChange).toHaveBeenCalledWith(updated);
  });

  it('after a saved payment whose refresh fails, says so and never posts it again', async () => {
    mockedRecord.mockResolvedValue({ _id: 'stay_1' });
    const onStayChange = jest.fn().mockRejectedValue(new Error('network'));
    renderWithNextIntl(<Harness onStayChange={onStayChange} />);

    await openRecordPayment();
    await userEvent.type(screen.getByLabelText('Amount'), '40');
    await userEvent.type(screen.getByLabelText('Reason'), 'Door');
    const save = screen.getByRole('button', { name: 'Save' });
    await userEvent.click(save);

    expect(
      await screen.findByText(
        /The payment was saved, but the stay could not be refreshed/,
      ),
    ).toBeInTheDocument();
    expect(save).toBeDisabled();
    await userEvent.click(save);
    expect(mockedRecord).toHaveBeenCalledTimes(1);
  });

  it('records a bank transfer', async () => {
    mockedRecord.mockResolvedValue({ _id: 'stay_1' });
    renderWithNextIntl(<Harness />);

    await openRecordPayment();
    await userEvent.selectOptions(
      screen.getByLabelText('Paid by'),
      'bank-transfer',
    );
    await userEvent.type(screen.getByLabelText('Amount'), '120.5');
    await userEvent.type(screen.getByLabelText('Reason'), 'IBAN transfer');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(mockedRecord).toHaveBeenCalledWith('stay_1', {
        method: 'bank-transfer',
        amount: 120.5,
        reason: 'IBAN transfer',
      }),
    );
  });

  it('undoes a recorded payment that has not been undone yet', async () => {
    mockedCharges.mockResolvedValue([
      charge({}),
      charge({
        _id: 'c2',
        amount: { total: { val: 30, cur: 'EUR' } } as Charge['amount'],
      }),
      charge({
        _id: 'c3',
        status: 'refunded',
        meta: { reversesChargeId: 'c2' },
      }),
      charge({ _id: 's1', method: 'stripe' }),
    ]);
    mockedReverse.mockResolvedValue({ _id: 'stay_1' });
    renderWithNextIntl(<Harness />);

    await openRecordPayment();
    expect(mockedCharges).toHaveBeenCalledWith({
      linkedObjectType: 'Booking',
      linkedObjectId: 'stay_1',
      method: { $in: ['cash', 'bank-transfer'] },
      status: { $in: ['paid', 'refunded'] },
    });
    await userEvent.selectOptions(
      await screen.findByLabelText('What happened'),
      'reverse',
    );
    const options = Array.from(
      (screen.getByLabelText('Payment to undo') as HTMLSelectElement).options,
    ).map((option) => option.value);
    expect(options).toEqual(['', 'c1']);

    await userEvent.selectOptions(
      screen.getByLabelText('Payment to undo'),
      'c1',
    );
    await userEvent.type(screen.getByLabelText('Reason'), 'Wrong stay');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(mockedReverse).toHaveBeenCalledWith('stay_1', 'c1', 'Wrong stay'),
    );
    expect(mockedRecord).not.toHaveBeenCalled();
  });
});

describe('reversibleOffPlatformCharges', () => {
  it('keeps paid cash and bank transfers that nothing reversed', () => {
    const rows = reversibleOffPlatformCharges([
      charge({ _id: 'a' }),
      charge({ _id: 'b', method: 'bank-transfer' }),
      charge({ _id: 'c', status: 'refunded', meta: { reversesChargeId: 'a' } }),
      charge({ _id: 'd', method: 'manual' }),
    ]);
    expect(rows.map((row) => row._id)).toEqual(['b']);
  });
});

describe('offPlatformRevenue', () => {
  it('subtracts what a refund returned, not the charge total', () => {
    expect(
      offPlatformRevenue([
        charge({
          amount: { total: { val: 100, cur: 'EUR' } } as Charge['amount'],
        }),
        charge({
          status: 'refunded',
          amount: {
            total: { val: 100, cur: 'EUR' },
            totalRefunded: { val: 30, cur: 'EUR' },
          } as Charge['amount'],
        }),
      ]),
    ).toEqual({ cash: 70, 'bank transfer': 0 });
  });

  it('nets each method, reversals included, and ignores other rails', () => {
    expect(
      offPlatformRevenue([
        charge({
          amount: { total: { val: 50, cur: 'EUR' } } as Charge['amount'],
        }),
        charge({
          status: 'refunded',
          amount: { total: { val: 20, cur: 'EUR' } } as Charge['amount'],
        }),
        charge({
          method: 'bank-transfer',
          amount: { total: { val: 100, cur: 'EUR' } } as Charge['amount'],
        }),
        charge({
          method: 'stripe',
          amount: { total: { val: 999, cur: 'EUR' } } as Charge['amount'],
        }),
      ]),
    ).toEqual({ cash: 30, 'bank transfer': 100 });
  });
});
