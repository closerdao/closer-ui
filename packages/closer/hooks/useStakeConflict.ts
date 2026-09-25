import { useState } from 'react';

import { isExistingStakeConflictError } from '../utils/stakeBookingError.helpers';

export const useStakeConflict = () => {
  const [hasStakeConflict, setHasStakeConflict] = useState(false);

  const clearStakeConflict = () => setHasStakeConflict(false);

  /** True when the wallet already holds these nights, so a retry can never succeed. */
  const catchStakeConflict = (error: unknown, stakedNightCount: number) => {
    const isConflict =
      stakedNightCount === 0 && isExistingStakeConflictError(error);
    if (isConflict) setHasStakeConflict(true);
    return isConflict;
  };

  return { hasStakeConflict, clearStakeConflict, catchStakeConflict };
};
