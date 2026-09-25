import type { Booking } from '../types/booking';
import api from './api';
import { ACTIVE_BOOKING_STATUSES } from './events.helpers';

type StayDates = { _id: string; start?: string | Date; end?: string | Date };

type HoldingCandidate = Pick<
  Booking,
  '_id' | 'start' | 'end' | 'status' | 'tokensStaked' | 'transactionId'
>;

const holdsTokens = (booking: HoldingCandidate) =>
  (booking.tokensStaked?.val ?? 0) > 0 ||
  booking.status === 'tokens-staked' ||
  Boolean(booking.transactionId);

const overlaps = (booking: HoldingCandidate, stay: StayDates) =>
  !!booking.start &&
  !!booking.end &&
  !!stay.start &&
  !!stay.end &&
  new Date(booking.start) < new Date(stay.end) &&
  new Date(booking.end) > new Date(stay.start);

/** The guest's other stay whose staked nights overlap this one, if any. */
export const pickStayHoldingNights = <T extends HoldingCandidate>(
  stay: StayDates,
  candidates: T[],
): T | null =>
  candidates.find(
    (booking) =>
      booking._id !== stay._id &&
      overlaps(booking, stay) &&
      holdsTokens(booking),
  ) ?? null;

export const fetchStayHoldingNights = async (
  stay: StayDates,
  userId: string,
): Promise<Booking | null> => {
  const { data } = await api.get('/booking', {
    params: {
      where: {
        createdBy: userId,
        _id: { $ne: stay._id },
        status: ACTIVE_BOOKING_STATUSES,
        start: { $lt: stay.end },
        end: { $gt: stay.start },
      },
      limit: 20,
    },
  });
  return pickStayHoldingNights(stay, (data?.results as Booking[]) || []);
};
