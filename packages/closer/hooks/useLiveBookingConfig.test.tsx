import { act, renderHook, waitFor } from '@testing-library/react';
import { fromJS } from 'immutable';

import { useLiveBookingConfig } from './useLiveBookingConfig';

const mockPlatform: any = { config: { getOne: jest.fn(), findOne: jest.fn() } };
const mockAuth: { isAuthenticated: boolean } = { isAuthenticated: true };

jest.mock('../contexts/platform', () => ({
  usePlatform: () => ({ platform: mockPlatform }),
}));

jest.mock('../contexts/auth', () => ({
  useAuth: () => mockAuth,
}));

/**
 * `configCached` values are defaults-merged, so the snapshot a page holds
 * always has every key. Only a couple matter here.
 */
const SNAPSHOT = {
  enabled: true,
  pickUpEnabled: true,
  checkinTime: 18,
  minDuration: 1,
};

/**
 * What `getOne` resolves with: the dispatched `GET_ONE_SUCCESS` action, whose
 * `results` is the *raw* API doc wrapped in Immutable. The hook reads the value
 * from here rather than from the store — see the note in the hook for why a
 * store read can never work on the awaited continuation.
 */
const successAction = (value: Record<string, unknown>) => ({
  type: 'GET_ONE_SUCCESS',
  id: 'booking',
  model: 'config',
  results: fromJS({ _id: 'booking', slug: 'booking', value }),
});

describe('useLiveBookingConfig', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.isAuthenticated = true;
    mockPlatform.config.getOne = jest.fn().mockResolvedValue(undefined);
    mockPlatform.config.findOne = jest.fn().mockReturnValue(undefined);
  });

  describe('fallback to the build-time snapshot', () => {
    it('keeps the snapshot when the config fetch rejects', async () => {
      mockPlatform.config.getOne = jest
        .fn()
        .mockRejectedValue(new Error('config service down'));

      const { result } = renderHook(() => useLiveBookingConfig(SNAPSHOT));

      expect(result.current).toEqual(SNAPSHOT);
      await act(async () => {
        await Promise.resolve();
      });
      expect(result.current).toEqual(SNAPSHOT);
      expect(mockPlatform.config.findOne).not.toHaveBeenCalled();
    });

    it('keeps the snapshot when the fetch resolves without an action', async () => {
      mockPlatform.config.getOne = jest.fn().mockResolvedValue(undefined);

      const { result } = renderHook(() => useLiveBookingConfig(SNAPSHOT));

      await act(async () => {
        await Promise.resolve();
      });
      expect(result.current).toEqual(SNAPSHOT);
    });

    it('keeps the snapshot when the live doc has an empty value', async () => {
      mockPlatform.config.getOne = jest
        .fn()
        .mockResolvedValue(successAction({}));

      const { result } = renderHook(() => useLiveBookingConfig(SNAPSHOT));

      await act(async () => {
        await Promise.resolve();
      });
      // An empty live value merged over defaults would yield `enabled: false`
      // and blank the page. It must be ignored.
      expect(result.current).toEqual(SNAPSHOT);
    });

    it('keeps the snapshot when unwrapping the action throws', async () => {
      mockPlatform.config.getOne = jest.fn().mockResolvedValue({
        results: {
          get: () => {
            throw new Error('action shape changed');
          },
        },
      });

      const { result } = renderHook(() => useLiveBookingConfig(SNAPSHOT));

      await act(async () => {
        await Promise.resolve();
      });
      expect(result.current).toEqual(SNAPSHOT);
    });

    it('survives a platform context without a config model', async () => {
      const { result } = renderHook(() => {
        const saved = mockPlatform.config;
        mockPlatform.config = undefined;
        const value = useLiveBookingConfig(SNAPSHOT);
        mockPlatform.config = saved;
        return value;
      });

      await act(async () => {
        await Promise.resolve();
      });
      expect(result.current).toEqual(SNAPSHOT);
    });

    it('passes a null snapshot straight through when the fetch fails', async () => {
      mockPlatform.config.getOne = jest.fn().mockRejectedValue(new Error('x'));

      const { result } = renderHook(() =>
        useLiveBookingConfig<null | Record<string, unknown>>(null),
      );

      await act(async () => {
        await Promise.resolve();
      });
      expect(result.current).toBeNull();
    });
  });

  describe('no flicker on render-gating values', () => {
    it('returns the snapshot synchronously on first render', () => {
      const { result } = renderHook(() => useLiveBookingConfig(SNAPSHOT));
      expect(result.current.enabled).toBe(true);
    });
  });

  describe('applying the live value', () => {
    it('overlays the live doc and reflects a flipped toggle', async () => {
      mockPlatform.config.getOne = jest.fn().mockResolvedValue(
        successAction({
          enabled: true,
          pickUpEnabled: false,
          minDuration: 10,
        }),
      );

      const { result } = renderHook(() => useLiveBookingConfig(SNAPSHOT));

      expect(result.current.pickUpEnabled).toBe(true);
      await waitFor(() => expect(result.current.pickUpEnabled).toBe(false));
      expect(result.current.enabled).toBe(true);
      expect(result.current.minDuration).toBe(10);
    });

    it('fills unset keys from the config defaults, not from the stale snapshot', async () => {
      // `checkinTime` is absent from the live doc; the defaults-merge must
      // supply it rather than leaving the snapshot's value in place.
      mockPlatform.config.getOne = jest
        .fn()
        .mockResolvedValue(successAction({ enabled: true }));

      const { result } = renderHook(() => useLiveBookingConfig(SNAPSHOT));

      await waitFor(() =>
        expect(mockPlatform.config.getOne).toHaveBeenCalled(),
      );
      await waitFor(() => expect(result.current.checkinTime).not.toBe(18));
    });

    it('reads the doc from the wrapper on a cache hit', async () => {
      // `getOne`'s cache path resolves with the store wrapper
      // (`{data, loading, error, receivedAt}`) rather than the document, so the
      // value sits one level down. Unreachable while `force: true` is passed,
      // but pinned so dropping that flag cannot silently disable the feature.
      mockPlatform.config.getOne = jest.fn().mockResolvedValue({
        type: 'GET_ONE_SUCCESS',
        fromCache: true,
        results: fromJS({
          data: {
            _id: 'booking',
            slug: 'booking',
            value: { pickUpEnabled: false },
          },
          loading: false,
        }),
      });

      const { result } = renderHook(() => useLiveBookingConfig(SNAPSHOT));

      await waitFor(() => expect(result.current.pickUpEnabled).toBe(false));
    });

    it('forces the request past the platform cache', async () => {
      renderHook(() => useLiveBookingConfig(SNAPSHOT));
      await waitFor(() =>
        expect(mockPlatform.config.getOne).toHaveBeenCalledWith('booking', {
          force: true,
        }),
      );
    });
  });

  describe('guest page loads', () => {
    it('adds no config request when the visitor is unauthenticated', async () => {
      mockAuth.isAuthenticated = false;

      const { result } = renderHook(() => useLiveBookingConfig(SNAPSHOT));

      await act(async () => {
        await Promise.resolve();
      });
      expect(mockPlatform.config.getOne).not.toHaveBeenCalled();
      expect(result.current).toEqual(SNAPSHOT);
    });
  });
});
