import { useRouter } from 'next/router';

import { renderHook, waitFor } from '@testing-library/react';

import { resolveLegacyListingStaySlugRedirect } from '../../utils/stayRouting.helpers';
import { useStayRouteId } from '../useStayRouteId';

jest.mock('../../utils/stayRouting.helpers', () => ({
  ...jest.requireActual('../../utils/stayRouting.helpers'),
  resolveLegacyListingStaySlugRedirect: jest.fn(),
}));

const STAY_ID = '6a8b2dd0d70758e3651fe31f';
const replace = jest.fn();

const setRoute = (query: Record<string, string>, isReady = true) =>
  jest.mocked(useRouter).mockReturnValue({
    query,
    isReady,
    replace,
  } as unknown as ReturnType<typeof useRouter>);

describe('useStayRouteId', () => {
  beforeEach(() => {
    replace.mockClear();
    jest.mocked(resolveLegacyListingStaySlugRedirect).mockReset();
  });

  it('returns a valid stay id', () => {
    setRoute({ slug: STAY_ID });

    const { result } = renderHook(() => useStayRouteId());

    expect(result.current).toEqual({
      stayId: STAY_ID,
      isNotFound: false,
      isResolving: false,
    });
  });

  it('reports not found when the param is missing', () => {
    setRoute({});

    const { result } = renderHook(() => useStayRouteId());

    expect(result.current).toEqual({
      stayId: undefined,
      isNotFound: true,
      isResolving: false,
    });
  });

  it('waits for the router before reporting not found', () => {
    setRoute({}, false);

    const { result } = renderHook(() => useStayRouteId());

    expect(result.current).toEqual({
      stayId: undefined,
      isNotFound: false,
      isResolving: true,
    });
  });

  it('redirects a legacy listing slug without reporting not found', async () => {
    jest
      .mocked(resolveLegacyListingStaySlugRedirect)
      .mockResolvedValue('/stay/create?listingId=abc');
    setRoute({ slug: 'old-listing' });

    const { result } = renderHook(() => useStayRouteId());

    expect(result.current).toEqual({
      stayId: undefined,
      isNotFound: false,
      isResolving: true,
    });
    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith('/stay/create?listingId=abc'),
    );
    expect(result.current).toEqual({
      stayId: undefined,
      isNotFound: false,
      isResolving: true,
    });
  });

  it('reports not found once a non-id slug has no legacy redirect', async () => {
    jest.mocked(resolveLegacyListingStaySlugRedirect).mockResolvedValue(null);
    setRoute({ slug: 'not-a-stay' });

    const { result } = renderHook(() => useStayRouteId());

    expect(result.current.isNotFound).toBe(false);
    expect(result.current.isResolving).toBe(true);
    await waitFor(() => expect(result.current.isNotFound).toBe(true));
    expect(result.current.isResolving).toBe(false);
    expect(replace).not.toHaveBeenCalled();
  });
});
