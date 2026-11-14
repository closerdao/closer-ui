import { renderHook, waitFor } from '@testing-library/react';

import type { Stay } from '../../types/stay';
import { useStayCreditsEligibility } from '../useStayCreditsEligibility';

const mockCheckCreditsAvailability = jest.fn();
const mockGetCreditsBalance = jest.fn();
let mockTokenTotal = 0;
let mockTokenPerNight = 0;

jest.mock('../../contexts/auth', () => ({
  useAuth: () => ({ user: { _id: 'user-1' } }),
}));

jest.mock('../../utils/stays.api', () => ({
  checkCreditsAvailability: (...args: unknown[]) =>
    mockCheckCreditsAvailability(...args),
  getCreditsBalance: (...args: unknown[]) => mockGetCreditsBalance(...args),
  getStayAccommodationTokenTotal: () => mockTokenTotal,
  getStayTokenPricePerNight: () => mockTokenPerNight,
}));

const stay = {
  _id: 'stay-1',
  start: '2026-10-01T13:00:00.000Z',
} as unknown as Stay;

describe('useStayCreditsEligibility', () => {
  beforeEach(() => {
    mockCheckCreditsAvailability.mockReset().mockResolvedValue(true);
    mockGetCreditsBalance.mockReset().mockResolvedValue(3);
  });

  it('does not ask the API when the stay owes zero accommodation tokens', async () => {
    mockTokenTotal = 0;
    mockTokenPerNight = 0.75;

    const { result } = renderHook(() => useStayCreditsEligibility(stay));

    await waitFor(() => {
      expect(result.current.canApplyCreditsAtStart).toBe(false);
    });
    expect(mockCheckCreditsAvailability).not.toHaveBeenCalled();
    expect(mockGetCreditsBalance).not.toHaveBeenCalled();
  });

  it('checks availability with the accommodation total when tokens are owed', async () => {
    mockTokenTotal = 3;
    mockTokenPerNight = 0.75;

    const { result } = renderHook(() => useStayCreditsEligibility(stay));

    await waitFor(() => {
      expect(result.current.canApplyCreditsAtStart).toBe(true);
    });
    expect(mockCheckCreditsAvailability).toHaveBeenCalledWith({
      startDate: stay.start,
      creditsAmount: 3,
      minCreditsAmount: 0.75,
    });
    expect(result.current.creditsBalance).toBe(3);
  });
});
