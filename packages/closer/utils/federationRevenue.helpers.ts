/**
 * Revenue on a federation hub (closer.earth) is not the revenue of a village.
 *
 * A hub sells two things and nothing else:
 *
 *  - **Subscriptions** — the plan a founder pays to run their village on
 *    Closer. Ordinary `subscription` charges, created by the subscriber.
 *  - **Platform fee** — the cut of each village's own income. Every village
 *    posts a nightly report to `POST /billing/income` and the hub books it as
 *    one `villagePlatformFee` charge carrying `linkedObjectType: 'Village'`
 *    and `linkedObjectId: <village _id>` (see closer-api `routes/billing.js`).
 *    A report can be negative — a day whose refunds outweighed its payments.
 *
 * So the hospitality/token-sale breakdown the operator dashboard draws is all
 * zeroes here, and the numbers that matter are per village. These helpers do
 * that grouping; the fetching lives in `components/Dashboard/FederationRevenue`.
 */

export const VILLAGE_PLATFORM_FEE_CHARGE_TYPE = 'villagePlatformFee';

export type FederationChargeKind = 'platformFee' | 'subscription';

/** The slice of a charge this dashboard reads. */
export interface FederationCharge {
  _id: string;
  kind: FederationChargeKind;
  date: string;
  /** Signed: a platform-fee report is negative when refunds outweighed sales. */
  amount: number;
  currency: string;
  status: string;
  method: string;
  description: string;
  /** Village `_id` for a platform fee; `null` for a subscription. */
  villageId: string | null;
  /** The subscriber, for attributing a subscription back to a village. */
  createdBy: string | null;
  /** Village-side charges this report billed for, and how many were refunds. */
  chargeCount: number;
  refundCount: number;
  /** The plan slug, on a subscription charge. */
  subscriptionPlan: string | null;
}

export interface FederationVillage {
  _id: string;
  name: string;
  /** The founder. The only ownership link a subscription can be traced by. */
  createdBy: string | null;
  onboardingStatus?: string | null;
  status?: string | null;
}

export interface VillageEarningsRow {
  villageId: string | null;
  name: string;
  onboardingStatus: string | null;
  platformFee: number;
  subscriptions: number;
  total: number;
  /** Nightly reports received from this village in the period. */
  reports: number;
  /** Village-side charges those reports billed for. */
  chargesBilled: number;
  refunds: number;
  /**
   * True for the catch-all row holding subscription revenue that no village
   * claims — a subscriber who has not created a village yet, or one whose
   * village predates `createdBy` being recorded.
   */
  isUnattributed?: boolean;
}

const toId = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') {
    const oid = (value as { $oid?: string }).$oid;
    if (typeof oid === 'string') return oid;
  }
  return value == null ? '' : String(value);
};

const toIsoDate = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (value instanceof Date) return value.toISOString();
  if (value && typeof value === 'object') {
    const date = (value as { $date?: string }).$date;
    if (typeof date === 'string') return date;
  }
  return '';
};

const toNumber = (value: unknown): number => {
  const parsed = typeof value === 'number' ? value : parseFloat(String(value));
  return Number.isFinite(parsed) ? parsed : 0;
};

/**
 * `/charge` answers `{ results: [...] }`. Anything else — a 401 the API turns
 * into an empty body, a shape change — degrades to no charges rather than
 * throwing inside a render.
 */
export const parseFederationCharges = (
  payload: unknown,
  kind: FederationChargeKind,
): FederationCharge[] => {
  const results = (payload as { results?: unknown } | null)?.results;
  if (!Array.isArray(results)) return [];

  return results.map((raw: any): FederationCharge => {
    const meta = raw?.meta || {};
    return {
      _id: toId(raw?._id ?? raw?.id),
      kind,
      date: toIsoDate(raw?.date),
      amount: toNumber(raw?.amount?.total?.val),
      currency: String(raw?.amount?.total?.cur || '').toUpperCase(),
      status: String(raw?.status || ''),
      method: String(raw?.method || ''),
      description: String(raw?.description || ''),
      villageId:
        kind === 'platformFee'
          ? toId(raw?.linkedObjectId ?? meta.villageId) || null
          : null,
      createdBy: toId(raw?.createdBy) || null,
      chargeCount: toNumber(meta.chargeCount),
      refundCount: toNumber(meta.refundCount),
      subscriptionPlan: meta.subscriptionPlan
        ? String(meta.subscriptionPlan)
        : null,
    };
  });
};

export const parseFederationVillages = (
  payload: unknown,
): FederationVillage[] => {
  const results = (payload as { results?: unknown } | null)?.results;
  if (!Array.isArray(results)) return [];
  return results.map((raw: any) => ({
    _id: toId(raw?._id),
    name: String(raw?.name || ''),
    createdBy: toId(raw?.createdBy) || null,
    onboardingStatus: raw?.onboardingStatus ?? null,
    status: raw?.status ?? null,
  }));
};

/** Village ids a set of platform-fee charges refers to, deduplicated. */
export const getBilledVillageIds = (charges: FederationCharge[]): string[] => {
  const ids = new Set<string>();
  charges.forEach((charge) => {
    if (charge.villageId) ids.add(charge.villageId);
  });
  return [...ids];
};

/** A refunded charge is money that left again, so it is never earnings. */
const isEarned = (charge: FederationCharge) => charge.status !== 'refunded';

export const sumFederationCharges = (charges: FederationCharge[]): number =>
  charges.filter(isEarned).reduce((total, charge) => total + charge.amount, 0);

export const sumFederationRefunds = (charges: FederationCharge[]): number =>
  charges
    .filter((charge) => charge.status === 'refunded')
    .reduce((total, charge) => total + charge.amount, 0);

/**
 * The name to show for a village that produced fees but is not in the fetched
 * village list (deleted, or private to this admin). The billing route writes
 * `Platform fees · <name> · <from> – <to>` as the charge description, so the
 * name is recoverable from any one of its charges.
 */
export const getVillageNameFromChargeDescription = (
  description: string,
): string | null => {
  const parts = description.split('·').map((part) => part.trim());
  return parts.length >= 2 && parts[1] ? parts[1] : null;
};

/**
 * One row per village that earned the hub something in the period, plus a
 * trailing row for subscription revenue no village claims — so the column
 * totals always add back up to the headline figures.
 *
 * Subscriptions carry no village link of their own (`inferLinkedObjectFromChargeDoc`
 * in closer-api never sets one for them), so they are attributed through
 * `Village.createdBy`: the founder who created the village is the one paying
 * for it. `managedBy` is deliberately not used — one hub admin manages several
 * villages, and their single subscription would be counted once per village.
 */
export const buildVillageEarningsRows = (
  platformFeeCharges: FederationCharge[],
  subscriptionCharges: FederationCharge[],
  villages: FederationVillage[],
): VillageEarningsRow[] => {
  const villagesById = new Map(
    villages.map((village) => [village._id, village]),
  );

  const foundersVillage = new Map<string, string>();
  villages.forEach((village) => {
    if (village.createdBy && !foundersVillage.has(village.createdBy)) {
      foundersVillage.set(village.createdBy, village._id);
    }
  });

  const rows = new Map<string, VillageEarningsRow>();
  const rowFor = (villageId: string, fallbackName: string) => {
    const existing = rows.get(villageId);
    if (existing) return existing;
    const village = villagesById.get(villageId);
    const row: VillageEarningsRow = {
      villageId,
      name: village?.name || fallbackName || villageId,
      onboardingStatus: village?.onboardingStatus ?? null,
      platformFee: 0,
      subscriptions: 0,
      total: 0,
      reports: 0,
      chargesBilled: 0,
      refunds: 0,
    };
    rows.set(villageId, row);
    return row;
  };

  platformFeeCharges.forEach((charge) => {
    if (!charge.villageId) return;
    const row = rowFor(
      charge.villageId,
      getVillageNameFromChargeDescription(charge.description) || '',
    );
    row.reports += 1;
    row.chargesBilled += charge.chargeCount;
    row.refunds += charge.refundCount;
    if (isEarned(charge)) row.platformFee += charge.amount;
  });

  let unattributed = 0;
  subscriptionCharges.forEach((charge) => {
    if (!isEarned(charge)) return;
    const villageId = charge.createdBy
      ? foundersVillage.get(charge.createdBy)
      : undefined;
    if (!villageId) {
      unattributed += charge.amount;
      return;
    }
    rowFor(villageId, '').subscriptions += charge.amount;
  });

  const ordered = [...rows.values()]
    .map((row) => ({ ...row, total: row.platformFee + row.subscriptions }))
    .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));

  if (unattributed !== 0) {
    ordered.push({
      villageId: null,
      name: '',
      onboardingStatus: null,
      platformFee: 0,
      subscriptions: unattributed,
      total: unattributed,
      reports: 0,
      chargesBilled: 0,
      refunds: 0,
      isUnattributed: true,
    });
  }

  return ordered;
};
