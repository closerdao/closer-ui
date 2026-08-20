import { getBookingPaymentCheckoutPath } from '../stayPaymentRouting.helpers';

describe('getBookingPaymentCheckoutPath', () => {
  const bookingId = 'booking_1';

  it('routes open bookings back to the stay checkout', () => {
    expect(
      getBookingPaymentCheckoutPath({
        bookingId,
        status: 'open',
      }),
    ).toBe(`/stay/create/${bookingId}`);
  });

  it('routes tokens-staked bookings with fiat due to stay payment', () => {
    expect(
      getBookingPaymentCheckoutPath({
        bookingId,
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

  it('routes credits-paid bookings with fiat due to stay payment', () => {
    expect(
      getBookingPaymentCheckoutPath({
        bookingId,
        status: 'credits-paid',
        fiatOwed: 15,
      }),
    ).toBe(`/stay/${bookingId}/payment`);
  });

  it('routes tokens-staked with nothing left in fiat back to the stay checkout', () => {
    expect(
      getBookingPaymentCheckoutPath({
        bookingId,
        status: 'tokens-staked',
        useTokens: true,
        fiatOwed: 0,
      }),
    ).toBe(`/stay/create/${bookingId}`);
  });

  it('routes confirmed with only fiat owed to stay payment', () => {
    expect(
      getBookingPaymentCheckoutPath({
        bookingId,
        status: 'confirmed',
        fiatOwed: 50,
        tokensOwed: 0,
        creditsOwed: 0,
      }),
    ).toBe(`/stay/${bookingId}/payment`);
  });

  it('routes confirmed with a token delta due back to the stay checkout', () => {
    expect(
      getBookingPaymentCheckoutPath({
        bookingId,
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
