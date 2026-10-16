import { act, renderHook, waitFor } from '@testing-library/react';

import api from '../../utils/api';
import { useBookingLinkedCharges } from '../useBookingLinkedCharges';

const get = jest.spyOn(api, 'get');
beforeEach(() => get.mockReset());
afterAll(() => get.mockRestore());

test('keeps known history after an RPC/API error and permits retry', async () => {
  const charges = [{ id: 'paid_1' }];
  get
    .mockResolvedValueOnce({ data: { results: charges } })
    .mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValueOnce({
      data: { results: [...charges, { id: 'paid_2' }] },
    });
  const { result } = renderHook(() => useBookingLinkedCharges('booking_1'));
  await waitFor(() => expect(result.current.linkedCharges).toEqual(charges));
  act(() => result.current.refetchCharges());
  await waitFor(() => expect(result.current.error).toBe(true));
  expect(result.current.linkedCharges).toEqual(charges);
  act(() => result.current.refetchCharges());
  await waitFor(() => expect(result.current.linkedCharges).toHaveLength(2));
  expect(result.current.error).toBe(false);
});

test('refreshes after a new stay response, isolates booking navigation and ignores stale requests', async () => {
  const charges = [{ id: 'booking_1_paid' }];
  let resolveOld!: (value: unknown) => void;
  get
    .mockResolvedValueOnce({ data: { results: charges } })
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveOld = resolve;
        }),
    )
    .mockRejectedValueOnce(new Error('offline'));
  const { result, rerender } = renderHook(
    ({ id, version }) => useBookingLinkedCharges(id, version),
    { initialProps: { id: 'booking_1', version: 1 } },
  );
  await waitFor(() => expect(result.current.linkedCharges).toEqual(charges));
  rerender({ id: 'booking_1', version: 2 });
  expect(get).toHaveBeenCalledTimes(2);
  rerender({ id: 'booking_2', version: 3 });
  await waitFor(() => expect(result.current.error).toBe(true));
  expect(result.current.linkedCharges).toBeUndefined();
  await act(async () => resolveOld({ data: { results: charges } }));
  expect(result.current.linkedCharges).toBeUndefined();
});
