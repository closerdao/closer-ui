import { useEffect, useRef } from 'react';

// Fire a moment after the end date so anything the callback reads (a proposal's
// effective status, for one) already sees the voting period as closed.
const END_GRACE_MS = 500;

// setTimeout overflows past ~24.8 days and fires immediately instead.
const MAX_TIMEOUT_MS = 2147483647;

/**
 * Calls `onEnd` when the clock passes `endDate` while the page is open.
 *
 * Voting closes on a clock, not on an event, so nothing re-renders at the
 * moment it happens: the countdown that used to be the only trigger is mounted
 * for the last 24 hours only, and the results poll would take up to its next
 * tick to notice. This makes the transition its own scheduled event.
 */
export const useVotingPeriodEnd = (
  endDate: string | undefined,
  onEnd: () => void,
) => {
  const onEndRef = useRef(onEnd);

  useEffect(() => {
    onEndRef.current = onEnd;
  });

  useEffect(() => {
    if (!endDate) {
      return;
    }

    const endTimestamp = new Date(endDate).getTime();

    if (Number.isNaN(endTimestamp)) {
      return;
    }

    const msUntilEnd = endTimestamp - Date.now() + END_GRACE_MS;

    // Already over: whoever renders next reads the result from the clock.
    if (msUntilEnd <= 0 || msUntilEnd > MAX_TIMEOUT_MS) {
      return;
    }

    const timeoutId = window.setTimeout(() => onEndRef.current(), msUntilEnd);

    return () => window.clearTimeout(timeoutId);
  }, [endDate]);
};
