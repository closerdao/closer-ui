import type {
  Booking,
  StakeConflictStay,
  StakeHoldingCandidate,
} from '../types/booking';
import { fetchOverlappingOwnStays } from './bookings';

const holdsTokens = (booking: StakeHoldingCandidate) =>
  (booking.tokensStaked?.val ?? 0) > 0 ||
  booking.status === 'tokens-staked' ||
  Boolean(booking.transactionId);

const overlaps = (booking: StakeHoldingCandidate, stay: StakeConflictStay) =>
  !!booking.start &&
  !!booking.end &&
  !!stay.start &&
  !!stay.end &&
  new Date(booking.start) < new Date(stay.end) &&
  new Date(booking.end) > new Date(stay.start);

/** The guest's other stay whose staked nights overlap this one, if any. */
export const pickStayHoldingNights = <T extends StakeHoldingCandidate>(
  stay: StakeConflictStay,
  candidates: T[],
): T | null =>
  candidates.find(
    (booking) =>
      booking._id !== stay._id &&
      overlaps(booking, stay) &&
      holdsTokens(booking),
  ) ?? null;

export const fetchStayHoldingNights = async (
  stay: StakeConflictStay,
  userId: string,
): Promise<Booking | null> => {
  return pickStayHoldingNights(
    stay,
    await fetchOverlappingOwnStays(stay, userId),
  );
};
