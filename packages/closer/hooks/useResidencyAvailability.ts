import { useEffect, useMemo, useRef, useState } from 'react';

import { ResidencyAccommodation } from '../types/residency';
import { countUnavailableNights } from '../utils/listings.helpers';
import { toUtcDateIso } from '../utils/residency.helpers';
import { checkStayListingAvailability } from '../utils/stays.api';
import { useDebounce } from './useDebounce';

/** How long the sliders have to settle before the rooms are re-checked. */
const SETTLE_MS = 400;

/** What the platform said about one room over the window on screen. */
export interface ResidencyRoomAvailability {
  isAvailable: boolean;
  /**
   * Nights of the window the room is spoken for. A season is long enough that
   * this is the difference between a date to move and a dead end, so it is
   * carried rather than collapsed into the boolean.
   */
  unavailableNights: number;
  /** Nights the calendar actually covered, so the count has a denominator. */
  checkedNights: number;
}

export interface ResidencyAvailability {
  /**
   * Listing id → what the platform said about it. A room the platform has not
   * answered on yet is absent, never present-and-available: a missing entry is
   * "not known", and the page must not draw it as either state.
   */
  byListing: Record<string, ResidencyRoomAvailability>;
  /** True while an answer for the current window is still outstanding. */
  isLoading: boolean;
  /** Whether the answers held describe the window currently selected. */
  isCurrent: boolean;
}

const EMPTY: Record<string, ResidencyRoomAvailability> = {};

/**
 * Which of the rooms open to residents are actually free for the season the
 * volunteer has laid out, and for how much of it they are not.
 *
 * A season holds a room for months, so the covered room being open to
 * residents says nothing about it being open *then* — somebody else's booking
 * anywhere inside the window takes it for the whole of it. The apply endpoint
 * creates a real stay and rejects a taken listing, so without this the tool
 * would let a volunteer read, agree to and sign a season it was always going
 * to refuse.
 *
 * Each room is asked about separately rather than through `/stays/search`:
 * the search filters its results by what a listing is open for, and a room
 * missing from the results would be indistinguishable from a room that is
 * taken. It also returns one flag per listing, where the per-listing endpoint
 * hands back the calendar the clash can be counted off. The question here is
 * only ever about the handful of listings a platform opened to residents.
 *
 * **It fails open.** A room the platform could not answer for is left absent
 * rather than marked taken: the server checks again at apply time, and a flaky
 * network is not a reason to tell a volunteer the village is full.
 */
export const useResidencyAvailability = ({
  accommodations,
  arrival,
  departure,
  isEnabled = true,
}: {
  accommodations: ResidencyAccommodation[];
  /** The window as the plan has it, or null before there is a plan. */
  arrival: Date | null;
  departure: Date | null;
  /** False while there is nothing to check — no season, or no rooms. */
  isEnabled?: boolean;
}): ResidencyAvailability => {
  const start = arrival ? toUtcDateIso(arrival) : '';
  const end = departure ? toUtcDateIso(departure) : '';
  const listingIds = accommodations.map((item) => item.id);
  /*
   * The whole question in one string, so a drag across a fortnight of the
   * slider settles into a single round of requests rather than one per day
   * passed through.
   */
  const windowKey =
    isEnabled && start && end && listingIds.length
      ? `${start}|${end}|${listingIds.join(',')}`
      : '';
  const settledKey = useDebounce(windowKey, SETTLE_MS);

  const [answers, setAnswers] =
    useState<Record<string, ResidencyRoomAvailability>>(EMPTY);
  const [answeredKey, setAnsweredKey] = useState('');
  /** The request in flight, so a slower earlier one cannot land on top. */
  const latestKey = useRef('');

  useEffect(() => {
    latestKey.current = settledKey;
    if (!settledKey) {
      setAnswers(EMPTY);
      setAnsweredKey('');
      return;
    }

    const [windowStart, windowEnd, ids] = settledKey.split('|');
    let isStale = false;

    (async () => {
      const checked = await Promise.all(
        ids.split(',').map(async (listingId) => {
          try {
            const response = await checkStayListingAvailability(listingId, {
              /*
               * The same stay the agreement would book: one adult, and the
               * team booking a season is — a volunteer's room is program
               * accommodation, so the guest calendar's event blocks do not
               * apply to it. Asking any other question would grey out rooms
               * `POST /residencies/apply` accepts.
               */
              start: windowStart,
              end: windowEnd,
              adults: 1,
              isTeamBooking: true,
            });
            // Only an explicit no is a no; anything else is left unknown.
            if (typeof response?.results !== 'boolean') return null;
            const { unavailableNights, checkedNights } = countUnavailableNights(
              listingId,
              response.availability,
            );
            return [
              listingId,
              {
                isAvailable: response.results,
                /*
                 * A room the platform refused without saying which nights
                 * still has to read as taken, so an uncounted clash is one
                 * night rather than none.
                 */
                unavailableNights:
                  response.results || unavailableNights > 0
                    ? unavailableNights
                    : 1,
                checkedNights,
              },
            ] as const;
          } catch {
            return null;
          }
        }),
      );

      if (isStale || latestKey.current !== settledKey) return;
      setAnswers(
        Object.fromEntries(
          checked.filter(Boolean) as [string, ResidencyRoomAvailability][],
        ),
      );
      setAnsweredKey(settledKey);
    })();

    return () => {
      isStale = true;
    };
  }, [settledKey]);

  return useMemo(
    () => ({
      byListing: answeredKey === windowKey ? answers : EMPTY,
      // Sliding is already a wait: the rooms are stale from the first move,
      // not from the moment the debounced request finally goes out.
      isLoading: Boolean(windowKey) && answeredKey !== windowKey,
      isCurrent: Boolean(windowKey) && answeredKey === windowKey,
    }),
    [answers, answeredKey, windowKey],
  );
};
