import { renderHook, waitFor } from '@testing-library/react';

import { PaymentConfig } from '../../types/api';
import { getCachedConfig } from '../../utils/cachedConfig.helpers';
import {
  overlayLivePaymentConfig,
  parseLivePaymentConfigValue,
  useLivePaymentConfig,
} from '../useLivePaymentConfig';

jest.mock('../../utils/api.js', () => ({
  __esModule: true,
  default: {
    get: jest.fn(() => Promise.resolve({ data: {} })),
  },
}));

jest.mock('../../utils/cachedConfig.helpers', () => ({
  getCachedConfig: jest.fn(),
}));

const mockedGetCachedConfig = getCachedConfig as jest.MockedFunction<
  typeof getCachedConfig
>;

const mockedApiGet = jest.requireMock('../../utils/api.js').default
  .get as jest.Mock;

const snapshotPayment: PaymentConfig = {
  cardPayment: false,
  connectedAccountId: '',
  connectStatus: 'pending',
  vatRate: 23,
} as PaymentConfig;

const livePayment: PaymentConfig = {
  cardPayment: true,
  connectedAccountId: 'acct_live',
  connectStatus: 'active',
} as PaymentConfig;

describe('parseLivePaymentConfigValue', () => {
  test('reads a CRUD payment row', () => {
    expect(
      parseLivePaymentConfigValue({
        results: { value: livePayment },
      }),
    ).toEqual(livePayment);
  });

  test('ignores arrays, empty mocks, and missing value', () => {
    expect(parseLivePaymentConfigValue({ results: [] })).toBeNull();
    expect(parseLivePaymentConfigValue({ results: {} })).toBeNull();
    expect(parseLivePaymentConfigValue({})).toBeNull();
    expect(parseLivePaymentConfigValue(null)).toBeNull();
  });
});

describe('overlayLivePaymentConfig', () => {
  test('live Connect fields win over the snapshot', () => {
    expect(overlayLivePaymentConfig(snapshotPayment, livePayment)).toEqual({
      ...snapshotPayment,
      ...livePayment,
    });
  });

  test('keeps the snapshot object when Connect gating is unchanged', () => {
    const liveSameGating = {
      ...livePayment,
      connectedAccountId: '',
      cardPayment: false,
      connectStatus: 'pending',
      vatRate: 10,
    } as PaymentConfig;
    expect(overlayLivePaymentConfig(snapshotPayment, liveSameGating)).toBe(
      snapshotPayment,
    );
  });

  test('keeps the snapshot when there is no live row', () => {
    expect(overlayLivePaymentConfig(snapshotPayment, null)).toBe(
      snapshotPayment,
    );
  });
});

describe('useLivePaymentConfig', () => {
  beforeEach(() => {
    mockedGetCachedConfig.mockReset();
    mockedApiGet.mockReset();
    mockedGetCachedConfig.mockReturnValue(snapshotPayment);
  });

  test('overlays live Connect fields on the snapshot', async () => {
    mockedApiGet.mockResolvedValue({
      data: { results: { value: livePayment } },
    });

    const { result } = renderHook(() => useLivePaymentConfig());
    expect(result.current).toEqual(snapshotPayment);

    await waitFor(() => {
      expect(result.current?.connectedAccountId).toBe('acct_live');
    });
    expect(result.current).toEqual({
      ...snapshotPayment,
      ...livePayment,
    });
    expect(mockedApiGet).toHaveBeenCalledWith(
      '/config/payment',
      expect.objectContaining({ cache: false }),
    );
  });

  test('keeps the snapshot when the request fails', async () => {
    mockedApiGet.mockRejectedValue(new Error('network'));

    const { result } = renderHook(() => useLivePaymentConfig());
    expect(result.current).toEqual(snapshotPayment);

    await waitFor(() => {
      expect(mockedApiGet).toHaveBeenCalled();
    });
    expect(result.current).toEqual(snapshotPayment);
  });

  test('ignores a junk payload and keeps the snapshot', async () => {
    mockedApiGet.mockResolvedValue({ data: { results: [] } });

    const { result } = renderHook(() => useLivePaymentConfig());

    await waitFor(() => {
      expect(mockedApiGet).toHaveBeenCalled();
    });
    expect(result.current).toEqual(snapshotPayment);
  });
});
