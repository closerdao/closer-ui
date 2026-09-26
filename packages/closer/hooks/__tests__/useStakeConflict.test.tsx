import { act, renderHook } from '@testing-library/react';

import { BOOK_ACCOMMODATION_EXISTING_CONFLICT_PREFIX } from '../../utils/stakeBookingError.helpers';
import { useStakeConflict } from '../useStakeConflict';

const conflict = () => new Error(BOOK_ACCOMMODATION_EXISTING_CONFLICT_PREFIX);

describe('useStakeConflict', () => {
  it('flags a conflict before any night of the plan is staked', () => {
    const { result } = renderHook(() => useStakeConflict());

    let caught = false;
    act(() => {
      caught = result.current.catchStakeConflict(conflict(), 0);
    });

    expect(caught).toBe(true);
    expect(result.current.hasStakeConflict).toBe(true);
  });

  it('leaves other failures and partial stakes to the generic error', () => {
    const { result } = renderHook(() => useStakeConflict());

    act(() => {
      result.current.catchStakeConflict(new Error('execution reverted'), 0);
      result.current.catchStakeConflict(conflict(), 2);
    });

    expect(result.current.hasStakeConflict).toBe(false);
  });

  it('clears once the guest leaves the modal or stakes again', () => {
    const { result } = renderHook(() => useStakeConflict());

    act(() => {
      result.current.catchStakeConflict(conflict(), 0);
    });
    act(() => result.current.clearStakeConflict());

    expect(result.current.hasStakeConflict).toBe(false);
  });
});
