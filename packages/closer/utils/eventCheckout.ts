/**
 * The event page's checkout deep link — the URL that opens the ticket modal.
 *
 *   /events/:slug?checkout                          the modal, on ticket selection
 *   /events/:slug?checkout&ticket=Day%20Ticket      that option already picked
 *   /events/:slug?checkout&discountCode=EARLYBIRD   code prefilled and applied
 *   /events/:slug?checkout&ticketId=<id>            straight to paying that ticket
 *   /events/:slug#tickets                           short form of `?checkout`
 *
 * The hash form exists because it survives being pasted into places that eat
 * query strings, and it reads as an anchor to anyone who sees it.
 */
import type { ParsedUrlQuery } from 'querystring';

export const CHECKOUT_HASH = 'tickets';

/** Every key this contract owns — the ones stripped when the modal closes. */
export const CHECKOUT_QUERY_KEYS = [
  'checkout',
  'ticketId',
  'ticket',
  'discountCode',
] as const;

export interface EventCheckoutParams {
  /** Whether the link asks for the modal at all. */
  isOpen: boolean;
  /** An existing unpaid ticket to settle, rather than a new purchase. */
  ticketId?: string;
  /** Name of the ticket option to preselect. */
  ticketOption?: string;
  /** Discount code to prefill and apply without the guest pressing Apply. */
  discountCode?: string;
}

/** Next parses a bare `?checkout` to an empty string, which still means yes. */
const isTruthyFlag = (value: string | string[] | undefined): boolean => {
  if (value === undefined) return false;
  const first = Array.isArray(value) ? value[0] : value;
  if (first === undefined) return false;
  return !['false', '0', 'no'].includes(first.trim().toLowerCase());
};

const firstString = (value: string | string[] | undefined): string => {
  const first = Array.isArray(value) ? value[0] : value;
  return typeof first === 'string' ? first.trim() : '';
};

/**
 * What a URL is asking the event page to open.
 *
 * `asPath` is passed rather than `window.location` so this works during the
 * first render on the client, where the router already knows the hash.
 */
export const parseEventCheckoutLink = (
  query: ParsedUrlQuery = {},
  asPath = '',
): EventCheckoutParams => {
  const hash = asPath.split('#')[1]?.split('?')[0] || '';
  const ticketId = firstString(query.ticketId);
  const ticketOption = firstString(query.ticket);
  const discountCode = firstString(query.discountCode);

  // A checkout parameter on its own is enough of an ask — nobody links to a
  // ticket id and means "do nothing with it".
  const isOpen =
    isTruthyFlag(query.checkout) ||
    hash === CHECKOUT_HASH ||
    Boolean(ticketId) ||
    Boolean(ticketOption);

  return {
    isOpen,
    ...(ticketId ? { ticketId } : {}),
    ...(ticketOption ? { ticketOption } : {}),
    ...(discountCode ? { discountCode } : {}),
  };
};

/** The shareable link for a given checkout state. */
export const buildEventCheckoutHref = (
  slug: string,
  params: Omit<EventCheckoutParams, 'isOpen'> = {},
): string => {
  const search = new URLSearchParams();
  search.set('checkout', '1');
  if (params.ticketId) search.set('ticketId', params.ticketId);
  if (params.ticketOption) search.set('ticket', params.ticketOption);
  if (params.discountCode) search.set('discountCode', params.discountCode);
  return `/events/${slug}?${search.toString()}`;
};

/** The same query with the checkout keys removed, for closing the modal. */
export const withoutCheckoutQuery = (query: ParsedUrlQuery): ParsedUrlQuery => {
  const rest: ParsedUrlQuery = { ...query };
  CHECKOUT_QUERY_KEYS.forEach((key) => delete rest[key]);
  return rest;
};

/** True when a URL carries nothing of this contract — nothing to clean up. */
export const hasCheckoutQuery = (query: ParsedUrlQuery = {}): boolean =>
  CHECKOUT_QUERY_KEYS.some((key) => query[key] !== undefined);
