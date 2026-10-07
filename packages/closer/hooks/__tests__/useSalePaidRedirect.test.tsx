import { useRouter } from 'next/router';

import { act, renderHook } from '@testing-library/react';

import api from '../../utils/api.js';
import { useSalePaidRedirect } from '../useSalePaidRedirect';

jest.mock('../../utils/api.js', () => ({
  __esModule: true,
  default: { get: jest.fn() },
  formatSearch: JSON.stringify,
}));

const replace = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(useRouter).mockReturnValue({
    query: { saleId: 'sale-1' },
    isReady: true,
    replace,
  } as unknown as ReturnType<typeof useRouter>);
});

it.each(['paid', 'completed'])(
  'redirects a %s sale to its summary using fresh sale data',
  async (status) => {
    jest.mocked(api.get).mockResolvedValue({
      data: { results: [{ _id: 'sale-1', status }] },
    });

    await act(async () => {
      renderHook(() => useSalePaidRedirect());
    });

    expect(replace).toHaveBeenCalledWith('/sale/sale-1');
    expect(api.get).toHaveBeenCalledWith(
      '/sale',
      expect.objectContaining({ cache: false }),
    );
  },
);

it('keeps a pending sale in checkout', async () => {
  jest.mocked(api.get).mockResolvedValue({
    data: { results: [{ _id: 'sale-1', status: 'pending-payment' }] },
  });

  await act(async () => {
    renderHook(() => useSalePaidRedirect());
  });

  expect(replace).not.toHaveBeenCalled();
});
