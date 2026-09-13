import { AMBASSADOR_REVENUE_SHARE_PERCENT } from '../constants/village.constants';
import { AffiliateConfig } from '../types/api';
import { DateRange } from '../types/affiliate';
import { Charge } from '../types/booking';

export type AffiliateRevenueType =
  | 'stays'
  | 'events'
  | 'subscriptions'
  | 'products'
  | 'tokenSales'
  | 'financedTokenSales'
  // Hub only: the platform fees a village reports (charge type
  // `villagePlatformFee`). No community rate - it does not exist off the hub.
  | 'villagePlatformFees';

const CONFIG_KEY_BY_TYPE: Partial<
  Record<AffiliateRevenueType, keyof AffiliateConfig>
> = {
  stays: 'staysCommissionPercent',
  events: 'eventsCommissionPercent',
  subscriptions: 'subscriptionCommissionPercent',
  products: 'productsCommissionPercent',
  tokenSales: 'tokenSaleCommissionPercent',
  financedTokenSales: 'financedTokenSaleCommissionPercent',
};

/** The closer.earth hub, where affiliates are Ambassadors maintaining villages. */
export const isFederationHub = () =>
  process.env.NEXT_PUBLIC_FEATURE_FEDERATION === 'true';

/**
 * Commission rate to show next to a revenue type. A federation hub pays its
 * Ambassadors a flat share of Closer's revenue whatever the charge type, so
 * the per-type config percentages only apply to a community's own program.
 */
export const getCommissionPercent = (
  type: AffiliateRevenueType,
  config: AffiliateConfig | null | undefined,
  hub: boolean = isFederationHub(),
): number => {
  if (hub) return AMBASSADOR_REVENUE_SHARE_PERCENT;
  const key = CONFIG_KEY_BY_TYPE[type];
  return key ? Number(config?.[key]) || 0 : 0;
};

export const calculateAffiliateRevenue = (charges: Charge[]) => {
  // we double check if affiliateRevenue currency is either EUR fiat or EUR stablecoin
  // events revenue is calculated based on ticket price only
  // stays revenue is calculated based on accommodation price only

  const filteredCharges = charges?.filter((charge: Charge) => {
    return charge.affiliateRevenue?.cur?.toLowerCase()?.includes('eur');
  });

  const subscriptionsRevenue =
    filteredCharges
      ?.filter((charge: Charge) => charge.type === 'subscription')
      .reduce(
        (acc: number, charge: Charge) =>
          acc + (charge.affiliateRevenue?.val || 0),
        0,
      ) || 0;

  const staysRevenue =
    filteredCharges
      ?.filter(
        (charge: Charge) =>
          charge.type === 'booking' &&
          (!charge.amount.event || charge.amount.event.val === 0),
      )
      .reduce(
        (acc: number, charge: Charge) =>
          acc + (charge.affiliateRevenue?.val || 0),
        0,
      ) || 0;

  const eventsRevenue =
    filteredCharges
      ?.filter(
        (charge: Charge) =>
          charge.type === 'booking' &&
          charge?.amount?.event?.val &&
          charge?.amount?.event?.val > 0,
      )
      .reduce(
        (acc: number, charge: Charge) =>
          acc + (charge.affiliateRevenue?.val || 0),
        0,
      ) || 0;

  const tokenSaleRevenue =
    filteredCharges
      ?.filter((charge: Charge) => charge.type === 'tokenSale')
      .reduce(
        (acc: number, charge: Charge) =>
          acc + (charge.affiliateRevenue?.val || 0),
        0,
      ) || 0;

  const financedTokenRevenue =
    filteredCharges
      ?.filter((charge: Charge) => charge.type === 'financedToken')
      .reduce(
        (acc: number, charge: Charge) =>
          acc + (charge.affiliateRevenue?.val || 0),
        0,
      ) || 0;

  // Platform fees a village reported to the hub, credited to its Ambassador.
  const villagePlatformFeesRevenue =
    filteredCharges
      ?.filter((charge: Charge) => charge.type === 'villagePlatformFee')
      .reduce(
        (acc: number, charge: Charge) =>
          acc + (charge.affiliateRevenue?.val || 0),
        0,
      ) || 0;

  const totalRevenue =
    subscriptionsRevenue +
    staysRevenue +
    eventsRevenue +
    tokenSaleRevenue +
    financedTokenRevenue +
    villagePlatformFeesRevenue;

  return {
    totalRevenue,
    subscriptionsRevenue,
    staysRevenue,
    eventsRevenue,
    tokenSaleRevenue,
    financedTokenRevenue,
    villagePlatformFeesRevenue,
  };
};

export const getDays = (dateRange: DateRange): number => {
  switch (dateRange.value) {
    case '7d':
      return 7;
    case '30d':
      return 30;
    case '90d':
      return 90;
    case '365d':
      return 365;
    default:
      return 30;
  }
};
