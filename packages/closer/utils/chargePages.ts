import { Charge } from '../types/booking';
import { type ChargeWhere, listCharges } from './charges';

// closer-api caps a list read at 300 rows (getLimitOption), so anything that sums charges pages to the end.
export const CHARGE_PAGE_SIZE = 300;
const MAX_PAGES = 200;

export const fetchAllCharges = async (
  where: ChargeWhere,
): Promise<Charge[]> => {
  const rows: Charge[] = [];
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    // eslint-disable-next-line no-await-in-loop
    const res = await listCharges(where, {
      limit: CHARGE_PAGE_SIZE,
      page,
      cache: false,
    });
    const batch: Charge[] = Array.isArray(res?.data?.results)
      ? res.data.results
      : [];
    rows.push(...batch);
    if (batch.length < CHARGE_PAGE_SIZE) return rows;
  }
  throw new Error(
    `More than ${MAX_PAGES * CHARGE_PAGE_SIZE} charges match; narrow the date range.`,
  );
};
