import { getBookingPaymentCheckoutPath } from '../stayPaymentRouting.helpers';

describe('getBookingPaymentCheckoutPath', () => {
  const bookingId = 'booking_1';

  it('routes non-stay-shaped open bookings to classic summary', () => {
    expect(
      getBookingPaymentCheckoutPath({
        bookingId,
        stayShaped: false,
        status: 'open',
      }),
    ).toBe(`/bookings/${bookingId}/summary`);
  });

  it('routes non-stay-shaped confirmed bookings to classic checkout', () => {
    expect(
      getBookingPaymentCheckoutPath({
        bookingId,
        stayShaped: false,
        status: 'confirmed',
      }),
    ).toBe(`/bookings/${bookingId}/checkout`);
  });

  it('routes tokens-staked stay-shaped bookings with fiat due to stay payment', () => {
    expect(
      getBookingPaymentCheckoutPath({
        bookingId,
        stayShaped: true,
        status: 'tokens-staked',
        useTokens: true,
        fiatOwed: 24,
      }),
    ).toBe(`/stay/${bookingId}/payment`);
  });

  it('routes tokens-staked to stay payment even when stale paymentDelta.token remains', () => {
    expect(
      getBookingPaymentCheckoutPath({
        bookingId,
        stayShaped: true,
        status: 'tokens-staked',
        useTokens: true,
        fiatOwed: 24,
        paymentDelta: {
          fiat: { val: 24, cur: 'EUR' },
          token: { val: 6, cur: 'TDF' },
        },
      }),
    ).toBe(`/stay/${bookingId}/payment`);
  });

  it('routes credits-paid stay-shaped bookings with fiat due to stay payment', () => {
    expect(
      getBookingPaymentCheckoutPath({
        bookingId,
        stayShaped: true,
        status: 'credits-paid',
        fiatOwed: 15,
      }),
    ).toBe(`/stay/${bookingId}/payment`);
  });

  it('routes tokens-staked event booking to classic checkout when not stay-shaped', () => {
    expect(
      getBookingPaymentCheckoutPath({
        bookingId,
        stayShaped: false,
        status: 'tokens-staked',
        useTokens: true,
        fiatOwed: 24,
      }),
    ).toBe(`/bookings/${bookingId}/checkout`);
  });

  it('routes stay-shaped confirmed with only fiat owed to stay payment', () => {
    expect(
      getBookingPaymentCheckoutPath({
        bookingId,
        stayShaped: true,
        status: 'confirmed',
        fiatOwed: 50,
        tokensOwed: 0,
        creditsOwed: 0,
      }),
    ).toBe(`/stay/${bookingId}/payment`);
  });

  it('routes stay-shaped confirmed with token delta due back to create flow', () => {
    expect(
      getBookingPaymentCheckoutPath({
        bookingId,
        stayShaped: true,
        status: 'confirmed',
        useTokens: true,
        paymentDelta: {
          fiat: { val: 0, cur: 'EUR' },
          token: { val: 3, cur: 'TDF' },
        },
      }),
    ).toBe(`/stay/create/${bookingId}`);
  });
});
