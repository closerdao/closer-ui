import { TRPCClientError } from '@trpc/client';

import api from '../api';
import { parseMessageFromError } from '../common';
import {
  adjustStayFiat,
  decideUnstakedNights,
  exemptStayFromAutoCancel,
  getAutoCancelExemptStays,
  getChargedAwaitingSettlementCount,
  getHostNotes,
  getStayChanges,
  recordStayPayment,
  reverseStayPayment,
  saveHostNote,
} from '../stays.api';
import { isTrpcEnabled, trpc } from '../trpc';

jest.mock('../api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
  },
}));

jest.mock('../trpc', () => ({
  ...jest.requireActual('../trpc'),
  isTrpcEnabled: jest.fn(() => false),
  trpc: {
    stay: {
      exemptFromAutoCancel: { mutate: jest.fn() },
      autoCancelExempt: { query: jest.fn() },
      chargedAwaitingSettlement: { query: jest.fn() },
      changeLog: { query: jest.fn() },
      hostNotes: { query: jest.fn() },
      setHostNote: { mutate: jest.fn() },
      adjustFiat: { mutate: jest.fn() },
      setUnstakedNights: { mutate: jest.fn() },
      recordPayment: { mutate: jest.fn() },
      reversePayment: { mutate: jest.fn() },
    },
  },
}));

const mockedEnabled = isTrpcEnabled as jest.Mock;
const stay = (
  trpc as unknown as {
    stay: Record<string, { query?: jest.Mock; mutate?: jest.Mock }>;
  }
).stay;
const exemptMutate = stay.exemptFromAutoCancel.mutate as jest.Mock;
const exemptQuery = stay.autoCancelExempt.query as jest.Mock;
const settlementQuery = stay.chargedAwaitingSettlement.query as jest.Mock;
const changeLogQuery = stay.changeLog.query as jest.Mock;
const hostNotesQuery = stay.hostNotes.query as jest.Mock;
const setHostNoteMutate = stay.setHostNote.mutate as jest.Mock;
const adjustFiatMutate = stay.adjustFiat.mutate as jest.Mock;
const unstakedNightsMutate = stay.setUnstakedNights.mutate as jest.Mock;
const recordPaymentMutate = stay.recordPayment.mutate as jest.Mock;
const reversePaymentMutate = stay.reversePayment.mutate as jest.Mock;

const mockedApi = api as unknown as {
  get: jest.Mock;
  post: jest.Mock;
  put: jest.Mock;
};

const note = {
  text: 'Late arrival',
  updatedBy: 'u1',
  updatedAt: '2026-10-01T00:00:00.000Z',
};
const changes = {
  total: 1,
  page: 2,
  limit: 20,
  entries: [{ action: 'edit-host-note' }],
};
const exemptStay = {
  _id: 'stay_1',
  status: 'confirmed',
  autoCancelExemption: {
    action: 'do-not-auto-cancel',
    at: '2026-10-01',
    by: 'u1',
  },
};

const ids = (n: number) => Array.from({ length: n }, (_, i) => `id${i}`);

describe('host operations on legacy', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('exempts a stay from auto-cancel', async () => {
    mockedApi.post.mockResolvedValue({
      data: { results: { booking: { _id: 'stay_1' } } },
    });

    await expect(exemptStayFromAutoCancel('stay_1', 'VIP')).resolves.toEqual({
      _id: 'stay_1',
    });
    expect(mockedApi.post).toHaveBeenCalledWith(
      '/stays/stay_1/do-not-auto-cancel',
      { reason: 'VIP' },
    );
  });

  it('lists the auto-cancel exempt stays', async () => {
    mockedApi.get.mockResolvedValue({ data: { results: [exemptStay] } });

    await expect(getAutoCancelExemptStays()).resolves.toEqual([exemptStay]);
    expect(mockedApi.get).toHaveBeenCalledWith(
      '/stays/host/auto-cancel-exempt',
      { cache: false },
    );
  });

  it('counts the stays charged awaiting settlement', async () => {
    mockedApi.get.mockResolvedValue({ data: { results: { count: 3 } } });

    await expect(getChargedAwaitingSettlementCount()).resolves.toBe(3);
    expect(mockedApi.get).toHaveBeenCalledWith(
      '/stays/host/charged-awaiting-settlement',
      { cache: false },
    );
  });

  it('reads a page of the change log', async () => {
    mockedApi.get.mockResolvedValue({ data: { results: changes } });

    await expect(getStayChanges('stay_1', 2)).resolves.toEqual(changes);
    expect(mockedApi.get).toHaveBeenCalledWith('/stays/stay_1/changes', {
      params: { page: 2 },
      cache: false,
    });
  });

  it('reads host notes in batches of 100', async () => {
    mockedApi.get
      .mockResolvedValueOnce({ data: { results: { id0: note } } })
      .mockResolvedValueOnce({ data: { results: { id100: note } } });

    await expect(getHostNotes(ids(101))).resolves.toEqual({
      id0: note,
      id100: note,
    });
    expect(mockedApi.get).toHaveBeenCalledTimes(2);
    expect(mockedApi.get).toHaveBeenLastCalledWith('/stays/host/notes', {
      params: { ids: 'id100' },
      cache: false,
    });
  });

  it('saves a host note', async () => {
    mockedApi.put.mockResolvedValue({ data: { results: note } });

    await expect(saveHostNote('stay_1', 'Late arrival', null)).resolves.toEqual(
      note,
    );
    expect(mockedApi.put).toHaveBeenCalledWith('/stays/stay_1/host-note', {
      text: 'Late arrival',
      updatedAt: null,
    });
  });

  it('posts the host payment adjustments to the legacy admin routes', async () => {
    mockedApi.post.mockResolvedValue({
      data: { results: { booking: { _id: 'stay_1' } } },
    });
    const payment = { method: 'cash' as const, amount: 50, reason: 'Paid' };

    await expect(adjustStayFiat('stay_1', -20, 'Deal')).resolves.toEqual({
      _id: 'stay_1',
    });
    await decideUnstakedNights('stay_1', 'waive', 'Deal');
    await recordStayPayment('stay_1', payment);
    await reverseStayPayment('stay_1', 'ch_1', 'Typo');

    expect(mockedEnabled).toHaveBeenCalledWith('11.3a');
    expect(mockedApi.post.mock.calls).toEqual([
      ['/stays/stay_1/admin/adjust-fiat', { amount: -20, reason: 'Deal' }],
      [
        '/stays/stay_1/admin/unstaked-nights',
        { decision: 'waive', reason: 'Deal' },
      ],
      ['/stays/stay_1/admin/record-payment', payment],
      [
        '/stays/stay_1/admin/reverse-payment',
        { chargeId: 'ch_1', reason: 'Typo' },
      ],
    ]);
    expect(adjustFiatMutate).not.toHaveBeenCalled();
  });
});

describe('host operations with tRPC', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedEnabled.mockReturnValue(true);
  });

  afterEach(() => {
    mockedEnabled.mockReturnValue(false);
  });

  it('exempts a stay through stay.exemptFromAutoCancel', async () => {
    exemptMutate.mockResolvedValue({ _id: 'stay_1' });

    await expect(exemptStayFromAutoCancel('stay_1', 'VIP')).resolves.toEqual({
      _id: 'stay_1',
    });
    expect(exemptMutate).toHaveBeenCalledWith({ id: 'stay_1', reason: 'VIP' });
    expect(mockedApi.post).not.toHaveBeenCalled();
  });

  it('lists the exempt stays through stay.autoCancelExempt', async () => {
    exemptQuery.mockResolvedValue([exemptStay]);

    await expect(getAutoCancelExemptStays()).resolves.toEqual([exemptStay]);
    expect(mockedApi.get).not.toHaveBeenCalled();
  });

  it('counts through stay.chargedAwaitingSettlement', async () => {
    settlementQuery.mockResolvedValue({ count: 3 });

    await expect(getChargedAwaitingSettlementCount()).resolves.toBe(3);
    expect(mockedApi.get).not.toHaveBeenCalled();
  });

  it('reads the change log through stay.changeLog', async () => {
    changeLogQuery.mockResolvedValue(changes);

    await expect(getStayChanges('stay_1', 2)).resolves.toEqual(changes);
    expect(changeLogQuery).toHaveBeenCalledWith({ id: 'stay_1', page: 2 });
    expect(mockedApi.get).not.toHaveBeenCalled();
  });

  it('reads host notes through stay.hostNotes in batches of 100', async () => {
    hostNotesQuery
      .mockResolvedValueOnce({ id0: note })
      .mockResolvedValueOnce({ id100: note });

    await expect(getHostNotes(ids(101))).resolves.toEqual({
      id0: note,
      id100: note,
    });
    expect(hostNotesQuery).toHaveBeenCalledTimes(2);
    expect(hostNotesQuery).toHaveBeenLastCalledWith({ ids: ['id100'] });
    expect(mockedApi.get).not.toHaveBeenCalled();
  });

  it('sends the next host-notes batch only after the previous one answers', async () => {
    let answerFirst: (value: unknown) => void = () => {};
    hostNotesQuery
      .mockReturnValueOnce(
        new Promise((resolve) => {
          answerFirst = resolve;
        }),
      )
      .mockResolvedValueOnce({ id100: note });

    const pending = getHostNotes(ids(101));
    await Promise.resolve();
    expect(hostNotesQuery).toHaveBeenCalledTimes(1);

    answerFirst({ id0: note });
    await expect(pending).resolves.toEqual({ id0: note, id100: note });
    expect(hostNotesQuery).toHaveBeenCalledTimes(2);
  });

  it('saves a host note through stay.setHostNote', async () => {
    setHostNoteMutate.mockResolvedValue(note);

    await expect(
      saveHostNote('stay_1', 'Late arrival', note.updatedAt),
    ).resolves.toEqual(note);
    expect(setHostNoteMutate).toHaveBeenCalledWith({
      id: 'stay_1',
      text: 'Late arrival',
      updatedAt: note.updatedAt,
    });
    expect(mockedApi.put).not.toHaveBeenCalled();
  });

  it('rejects a stale note with a 409 and the API message', async () => {
    const message =
      'This note changed since you opened it. Reload to see it, then edit again.';
    setHostNoteMutate.mockRejectedValue(
      new TRPCClientError(message, {
        result: {
          error: {
            message,
            code: -32009,
            data: { code: 'CONFLICT', httpStatus: 409, zodError: null },
          },
        },
      }),
    );

    const error = await saveHostNote('stay_1', 'x', null).catch(
      (e: unknown) => e,
    );
    expect((error as { response: { status: number } }).response.status).toBe(
      409,
    );
    expect(parseMessageFromError(error)).toBe(message);
  });

  it('adjusts a stay through stay.adjustFiat', async () => {
    adjustFiatMutate.mockResolvedValue({ _id: 'stay_1' });

    await expect(adjustStayFiat('stay_1', -20, 'Deal')).resolves.toEqual({
      _id: 'stay_1',
    });
    expect(adjustFiatMutate).toHaveBeenCalledWith({
      id: 'stay_1',
      amount: -20,
      reason: 'Deal',
    });
    expect(mockedApi.post).not.toHaveBeenCalled();
  });

  it('decides unstaked nights through stay.setUnstakedNights', async () => {
    unstakedNightsMutate.mockResolvedValue({ _id: 'stay_1' });

    await expect(
      decideUnstakedNights('stay_1', 'owe', 'Deal'),
    ).resolves.toEqual({ _id: 'stay_1' });
    expect(unstakedNightsMutate).toHaveBeenCalledWith({
      id: 'stay_1',
      decision: 'owe',
      reason: 'Deal',
    });
    expect(mockedApi.post).not.toHaveBeenCalled();
  });

  it('records a payment through stay.recordPayment', async () => {
    recordPaymentMutate.mockResolvedValue({ _id: 'stay_1' });

    await expect(
      recordStayPayment('stay_1', {
        method: 'bank-transfer',
        amount: 50,
        reference: 'REF1',
        reason: 'Paid',
      }),
    ).resolves.toEqual({ _id: 'stay_1' });
    expect(recordPaymentMutate).toHaveBeenCalledWith({
      id: 'stay_1',
      method: 'bank-transfer',
      amount: 50,
      reference: 'REF1',
      reason: 'Paid',
    });
    expect(mockedApi.post).not.toHaveBeenCalled();
  });

  it('reverses a payment through stay.reversePayment', async () => {
    reversePaymentMutate.mockResolvedValue({ _id: 'stay_1' });

    await expect(reverseStayPayment('stay_1', 'ch_1', 'Typo')).resolves.toEqual(
      { _id: 'stay_1' },
    );
    expect(reversePaymentMutate).toHaveBeenCalledWith({
      id: 'stay_1',
      chargeId: 'ch_1',
      reason: 'Typo',
    });
    expect(mockedApi.post).not.toHaveBeenCalled();
  });

  it('rejects a payment adjustment with the API message', async () => {
    const message = 'The stay changed while you were editing it.';
    adjustFiatMutate.mockRejectedValue(
      new TRPCClientError(message, {
        result: {
          error: {
            message,
            code: -32009,
            data: { code: 'CONFLICT', httpStatus: 409, zodError: null },
          },
        },
      }),
    );

    const error = await adjustStayFiat('stay_1', 5, 'x').catch(
      (e: unknown) => e,
    );
    expect((error as { response: { status: number } }).response.status).toBe(
      409,
    );
    expect(parseMessageFromError(error)).toBe(message);
  });
});
