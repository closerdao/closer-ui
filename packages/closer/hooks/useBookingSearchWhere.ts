import { useEffect, useMemo, useRef, useState } from 'react';

import {
  BOOKING_SEARCH_MIN_LENGTH,
  buildBookingSearchWhere,
  isBookingIdSearch,
} from '../utils/bookingSearch.helpers';
import { fetchUsersBySearchQuery } from '../utils/searchUser';
import { useDebounce } from './useDebounce';

/**
 * A common first name can be shared by many guests, so resolve well past the
 * typeahead default before narrowing bookings by `createdBy`/`paidBy`.
 */
const GUEST_SEARCH_USER_LIMIT = 100;

const needsGuestLookup = (term: string) =>
  term.length >= BOOKING_SEARCH_MIN_LENGTH && !isBookingIdSearch(term);

interface BookingSearchWhere {
  /** `where` fragment to merge into the booking filter, or null when inactive. */
  searchWhere: Record<string, any> | null;
  /** True while the term is still settling or guests are being resolved. */
  isSearching: boolean;
}

/**
 * Debounces a booking search term and resolves the guest names in it to user
 * ids, so the caller can filter bookings server-side.
 *
 * While a term is resolving `searchWhere` stays null, which keeps the list
 * showing its previous contents rather than flashing empty between keystrokes.
 */
export function useBookingSearchWhere(
  term: string,
  delay = 300,
): BookingSearchWhere {
  const trimmedTerm = term.trim();
  const debouncedTerm = useDebounce(trimmedTerm, delay);

  const [resolved, setResolved] = useState<{
    term: string;
    userIds: string[];
  } | null>(null);
  const requestRef = useRef(0);

  useEffect(() => {
    if (!needsGuestLookup(debouncedTerm)) {
      return;
    }

    const requestId = ++requestRef.current;
    let isCurrent = true;

    fetchUsersBySearchQuery(debouncedTerm, GUEST_SEARCH_USER_LIMIT)
      .then((hits) => {
        if (!isCurrent || requestRef.current !== requestId) return;
        setResolved({
          term: debouncedTerm,
          userIds: hits.map((hit) => hit._id),
        });
      })
      .catch(() => {
        if (!isCurrent || requestRef.current !== requestId) return;
        setResolved({ term: debouncedTerm, userIds: [] });
      });

    return () => {
      isCurrent = false;
    };
  }, [debouncedTerm]);

  const isResolvingGuests =
    needsGuestLookup(debouncedTerm) && resolved?.term !== debouncedTerm;

  const searchWhere = useMemo(() => {
    if (!debouncedTerm || isResolvingGuests) {
      return null;
    }
    return buildBookingSearchWhere({
      term: debouncedTerm,
      userIds: resolved?.term === debouncedTerm ? resolved.userIds : null,
    });
  }, [debouncedTerm, isResolvingGuests, resolved]);

  return {
    searchWhere,
    isSearching: trimmedTerm !== debouncedTerm || isResolvingGuests,
  };
}
