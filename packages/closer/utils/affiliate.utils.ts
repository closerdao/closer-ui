import { DateRange } from '../types/affiliate';
import { Charge } from '../types/booking';

export const calculateAffiliateRevenue = (
  charges: Charge[],
) => {
  // we double check if affiliateRevenue currency is either EUR fiat or EUR stablecoin
  // events revenue is calculated based on ticket price only
  // stays revenue is calculated based on accommodation price only

  const filteredCharges = charges?.filter((charge: Charge) => {
    return charge.affiliateRevenue?.cur.toLowerCase().includes('eur');
  });

  const subscriptionsRevenue =
    (filteredCharges
      ?.filter((charge: Charge) => charge.type === 'subscription')
      .reduce(
        (acc: number, charge: Charge) =>
          acc + (charge.affiliateRevenue?.val || 0),
        0,
      ) )  || 0;

  const staysRevenue =
    (filteredCharges
      ?.filter(
        (charge: Charge) =>
          charge.type === 'booking' &&
          (!charge.amount.event || charge.amount.event.val === 0),
      )
      .reduce(
        (acc: number, charge: Charge) =>
          acc + (charge.affiliateRevenue?.val || 0),
        0,
      )) || 0;

  const eventsRevenue =
    (filteredCharges
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
      ) ) || 0;

  const tokenSaleRevenue =
    (filteredCharges
      ?.filter((charge: Charge) => charge.type === 'tokenSale')
      .reduce(
        (acc: number, charge: Charge) =>
          acc + (charge.affiliateRevenue?.val || 0),
        0,
      ) ) || 0;

  const financedTokenRevenue =
    (filteredCharges
      ?.filter((charge: Charge) => charge.type === 'financedToken')
      .reduce(
        (acc: number, charge: Charge) =>
          acc + (charge.affiliateRevenue?.val || 0),
        0,
      )) || 0;

  const totalRevenue =
    subscriptionsRevenue +
    staysRevenue +
    eventsRevenue +
    tokenSaleRevenue +
    financedTokenRevenue;

  return {
    totalRevenue,
    subscriptionsRevenue,
    staysRevenue,
    eventsRevenue,
    tokenSaleRevenue,
    financedTokenRevenue,
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
