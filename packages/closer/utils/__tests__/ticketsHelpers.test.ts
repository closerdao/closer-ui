import {
  getStayEventTicketDiscount,
  getTicketPriceBreakdown,
} from '../tickets.helpers';

describe('getTicketPriceBreakdown', () => {
  it('shows what a discount took off, against the option list price', () => {
    const result = getTicketPriceBreakdown({
      quantity: 1,
      price: { val: 50, cur: 'EUR' },
      unitPrice: { val: 50, cur: 'EUR' },
      option: { name: 'Regular', price: 100, currency: 'EUR' },
      discount: { code: 'HALF' },
    } as any);

    expect(result.listTotal).toBe(100);
    expect(result.total).toBe(50);
    expect(result.savings).toBe(50);
    expect(result.hasDiscount).toBe(true);
    expect(result.discountCode).toBe('HALF');
  });

  it('multiplies the list price by the seats bought', () => {
    const result = getTicketPriceBreakdown({
      quantity: 3,
      price: { val: 225, cur: 'EUR' },
      unitPrice: { val: 75, cur: 'EUR' },
      option: { name: 'Regular', price: 100, currency: 'EUR' },
    } as any);

    expect(result.listTotal).toBe(300);
    expect(result.unitPrice).toBe(75);
    expect(result.savings).toBe(75);
  });

  it('claims no discount when the ticket was sold at list price', () => {
    const result = getTicketPriceBreakdown({
      quantity: 2,
      price: { val: 200, cur: 'EUR' },
      unitPrice: { val: 100, cur: 'EUR' },
      option: { name: 'Regular', price: 100, currency: 'EUR' },
    } as any);

    expect(result.hasDiscount).toBe(false);
    expect(result.savings).toBe(0);
  });

  it('falls back to the charged price when there is no ticket option', () => {
    const result = getTicketPriceBreakdown({
      quantity: 2,
      price: { val: 80, cur: 'EUR' },
    } as any);

    expect(result.unitPrice).toBe(40);
    expect(result.listTotal).toBe(80);
    expect(result.hasDiscount).toBe(false);
    expect(result.currency).toBe('EUR');
  });

  it('treats a free ticket as free rather than as a discount', () => {
    const result = getTicketPriceBreakdown({
      quantity: 1,
      price: { val: 0, cur: 'EUR' },
      unitPrice: { val: 0, cur: 'EUR' },
    } as any);

    expect(result.total).toBe(0);
    expect(result.hasDiscount).toBe(false);
  });

  it('survives a ticket with no money on it at all', () => {
    const result = getTicketPriceBreakdown({} as any);

    expect(result.quantity).toBe(1);
    expect(result.total).toBe(0);
    expect(result.hasDiscount).toBe(false);
  });
});

describe('getStayEventTicketDiscount', () => {
  const ticketOptions = [
    { name: 'Regular ticket', price: 40, currency: 'EUR' },
    { name: 'Supporter ticket', price: 80, currency: 'EUR' },
  ];

  it('reconstructs the list price a discount code took money off', () => {
    const result = getStayEventTicketDiscount({
      eventLine: { val: 20, cur: 'EUR' },
      ticketName: 'Regular ticket',
      ticketOptions,
      discountCode: 'CITIZEN',
    });

    expect(result).toMatchObject({
      gross: { val: 40, cur: 'EUR' },
      net: { val: 20, cur: 'EUR' },
      savings: { val: 20, cur: 'EUR' },
      code: 'CITIZEN',
    });
  });

  it('still reports the discount when the code is not known locally', () => {
    const result = getStayEventTicketDiscount({
      eventLine: { val: 20, cur: 'EUR' },
      ticketName: 'Regular ticket',
      ticketOptions,
    });

    expect(result?.savings.val).toBe(20);
    expect(result?.code).toBeNull();
  });

  it('claims no discount when the ticket is charged at list price', () => {
    expect(
      getStayEventTicketDiscount({
        eventLine: { val: 40, cur: 'EUR' },
        ticketName: 'Regular ticket',
        ticketOptions,
        discountCode: 'CITIZEN',
      }),
    ).toBeNull();
  });

  it('ignores a cent of rounding noise', () => {
    expect(
      getStayEventTicketDiscount({
        eventLine: { val: 39.999, cur: 'EUR' },
        ticketName: 'Regular ticket',
        ticketOptions,
      }),
    ).toBeNull();
  });

  it('does not compare prices across currencies', () => {
    expect(
      getStayEventTicketDiscount({
        eventLine: { val: 20, cur: 'USD' },
        ticketName: 'Regular ticket',
        ticketOptions,
      }),
    ).toBeNull();
  });

  it('stays silent when the ticket option is unknown or the line is free', () => {
    expect(
      getStayEventTicketDiscount({
        eventLine: { val: 20, cur: 'EUR' },
        ticketName: 'Retired ticket',
        ticketOptions,
      }),
    ).toBeNull();
    expect(
      getStayEventTicketDiscount({
        eventLine: { val: 0, cur: 'EUR' },
        ticketName: 'Regular ticket',
        ticketOptions,
      }),
    ).toBeNull();
  });
});
