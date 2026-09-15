/**
 * The API writes booking statuses with no schema enum, so `StayStatus` is the
 * only place the set is written down. These lists are annotated
 * `ReadonlyArray<StayStatus>`, which makes a typo or an unlisted status a
 * compile error at the declaration — the assertions below fail to compile if
 * that annotation is ever dropped, and the runtime check catches a member that
 * is no longer a known status.
 */
import { StayStatus } from '../../types/stay';
import { ACTIVE_BOOKING_STATUSES } from '../../utils/events.helpers';
import { dashboardRelevantStatuses, paidStatuses } from '../shared.constants';

const KNOWN_STAY_STATUSES: Record<StayStatus, true> = {
  open: true,
  draft: true,
  pending: true,
  confirmed: true,
  'pending-payment': true,
  'pending-refund': true,
  paid: true,
  cancelled: true,
  rejected: true,
  'tokens-staked': true,
  'credits-paid': true,
  'checked-in': true,
  'checked-out': true,
};

const onlyStayStatuses = <T extends ReadonlyArray<StayStatus>>(list: T): T =>
  list;

const STATUS_LISTS: ReadonlyArray<[string, ReadonlyArray<StayStatus>]> = [
  ['paidStatuses', onlyStayStatuses(paidStatuses)],
  ['dashboardRelevantStatuses', onlyStayStatuses(dashboardRelevantStatuses)],
  ['ACTIVE_BOOKING_STATUSES', onlyStayStatuses(ACTIVE_BOOKING_STATUSES)],
];

describe('booking status lists', () => {
  STATUS_LISTS.forEach(
    ([name, statuses]: [string, ReadonlyArray<StayStatus>]) => {
      it(`${name} only holds known stay statuses`, () => {
        expect(statuses.length > 0).toBe(true);
        statuses.forEach((status: StayStatus) => {
          expect(KNOWN_STAY_STATUSES[status]).toBe(true);
        });
      });
    },
  );
});
