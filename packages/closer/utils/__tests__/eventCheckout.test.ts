import {
  buildEventCheckoutHref,
  hasCheckoutQuery,
  parseEventCheckoutLink,
  withoutCheckoutQuery,
} from '../eventCheckout';

describe('parseEventCheckoutLink', () => {
  it('opens on a bare ?checkout, which Next hands over as an empty string', () => {
    expect(parseEventCheckoutLink({ checkout: '' }, '/events/x?checkout')).toEqual(
      { isOpen: true },
    );
  });

  it('stays closed on a plain event URL', () => {
    expect(parseEventCheckoutLink({ slug: 'x' }, '/events/x')).toEqual({
      isOpen: false,
    });
  });

  it('treats #tickets as the short form of ?checkout', () => {
    expect(parseEventCheckoutLink({ slug: 'x' }, '/events/x#tickets')).toEqual({
      isOpen: true,
    });
  });

  it('reads a bare hash string, which is what window.location gives', () => {
    expect(parseEventCheckoutLink({}, '#tickets').isOpen).toBe(true);
  });

  it('ignores an unrelated hash', () => {
    expect(parseEventCheckoutLink({}, '/events/x#about').isOpen).toBe(false);
  });

  it('carries a pending ticket through, and opens on it without ?checkout', () => {
    expect(
      parseEventCheckoutLink(
        { checkout: '1', ticketId: 'ticket-9' },
        '/events/x?checkout&ticketId=ticket-9',
      ),
    ).toEqual({ isOpen: true, ticketId: 'ticket-9' });

    expect(parseEventCheckoutLink({ ticketId: 'ticket-9' }, '/events/x').isOpen).toBe(
      true,
    );
  });

  it('carries a preselected option and a discount code', () => {
    expect(
      parseEventCheckoutLink(
        { checkout: '', discountCode: 'earlybird', ticket: 'Day Ticket' },
        '/events/x?checkout&discountCode=earlybird&ticket=Day%20Ticket',
      ),
    ).toEqual({
      isOpen: true,
      ticketOption: 'Day Ticket',
      discountCode: 'earlybird',
    });
  });

  it('a discount code alone is not an instruction to open anything', () => {
    expect(parseEventCheckoutLink({ discountCode: 'earlybird' }, '/events/x')).toEqual(
      { isOpen: false, discountCode: 'earlybird' },
    );
  });

  it('lets checkout=false close what the query would otherwise open', () => {
    expect(parseEventCheckoutLink({ checkout: 'false' }, '/events/x').isOpen).toBe(
      false,
    );
  });

  it('takes the first value when a param is repeated', () => {
    expect(
      parseEventCheckoutLink({ checkout: '1', ticketId: ['a', 'b'] }, '/events/x')
        .ticketId,
    ).toBe('a');
  });
});

describe('buildEventCheckoutHref', () => {
  it('links to the modal for an event', () => {
    expect(buildEventCheckoutHref('citizens-gathering-2026')).toBe(
      '/events/citizens-gathering-2026?checkout=1',
    );
  });

  it('links straight to paying a pending ticket', () => {
    expect(
      buildEventCheckoutHref('citizens-gathering-2026', { ticketId: 't-1' }),
    ).toBe('/events/citizens-gathering-2026?checkout=1&ticketId=t-1');
  });

  it('round-trips an option name that needs escaping', () => {
    const href = buildEventCheckoutHref('x', {
      ticketOption: 'Day Ticket - Saturday',
      discountCode: 'EARLYBIRD',
    });
    const query = Object.fromEntries(new URLSearchParams(href.split('?')[1]));

    expect(parseEventCheckoutLink(query, href)).toEqual({
      isOpen: true,
      ticketOption: 'Day Ticket - Saturday',
      discountCode: 'EARLYBIRD',
    });
  });
});

describe('withoutCheckoutQuery', () => {
  it('keeps the route params and drops only the checkout ones', () => {
    expect(
      withoutCheckoutQuery({
        slug: 'x',
        checkout: '1',
        ticketId: 't-1',
        ticket: 'Day',
        discountCode: 'CODE',
        utm_source: 'newsletter',
      }),
    ).toEqual({ slug: 'x', utm_source: 'newsletter' });
  });

  it('reports whether there is anything to clean up', () => {
    expect(hasCheckoutQuery({ slug: 'x' })).toBe(false);
    expect(hasCheckoutQuery({ slug: 'x', checkout: '' })).toBe(true);
  });
});
