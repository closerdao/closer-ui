import { useEffect, useMemo, useRef, useState } from 'react';

import {
  BOOKING_SEARCH_MIN_LENGTH,
  buildBookingSearchWhere,
  isBookingIdSearch,
  isPartialBookingIdSearch,
  parseBookingSearchDate,
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

const hasNonGuestSearchClause = (term: string) =>
  isBookingIdSearch(term) ||
  isPartialBookingIdSearch(term) ||
  parseBookingSearchDate(term) != null;

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
 * While guests are resolving, id/date clauses still apply; name-only terms keep
 * `searchWhere` null so the list does not flash empty between keystrokes.
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
    if (!debouncedTerm) {
      return null;
    }

    if (isResolvingGuests) {
      if (!hasNonGuestSearchClause(debouncedTerm)) {
        return null;
      }
      return buildBookingSearchWhere({
        term: debouncedTerm,
        userIds: null,
      });
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
