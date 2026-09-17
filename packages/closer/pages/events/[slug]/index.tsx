import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { useEffect, useMemo, useRef, useState } from 'react';

import { withPageErrorBoundary } from '../../../components/ErrorBoundary';
import EventAttendees from '../../../components/EventAttendees';
import EventDescription from '../../../components/EventDescription';
import EventEmailAttendeesModal from '../../../components/EventEmailAttendeesModal';
import EventPhotoUploadSection from '../../../components/EventPhotoUpload';
import EventTicketModal from '../../../components/EventTicketModal';
import FeatureNotEnabled from '../../../components/FeatureNotEnabled';
import MyEventTickets from '../../../components/MyEventTickets';
import Photo from '../../../components/Photo';
import SignupModal from '../../../components/SignupModal';
import UserAvatarPlaceholder from '../../../components/UserAvatarPlaceholder';
import { Button, Card, ErrorMessage, LinkButton } from '../../../components/ui';
import Heading from '../../../components/ui/Heading';

import dayjs from 'dayjs';
import { convert } from 'html-to-text';
import { NextApiRequest, NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import config from '../../../configCached';
import { MAX_LISTINGS_TO_FETCH } from '../../../constants';
import { useAuth } from '../../../contexts/auth';
import { User } from '../../../contexts/auth/types';
import { usePlatform } from '../../../contexts/platform';
import { useConfig } from '../../../hooks/useConfig';
import { Event, Listing } from '../../../types';
import { CloserCurrencies } from '../../../types/currency';
import api, { cdn } from '../../../utils/api';
import { getBearerAuthHeaders } from '../../../utils/authHeaders.helpers';
import { parseMessageFromError } from '../../../utils/common';
import {
  parseEventCheckoutLink,
  withoutCheckoutQuery,
} from '../../../utils/eventCheckout';
import {
  eventNeedsAccommodation,
  getAccommodationPriceRange,
  getEventNights,
  isFreeEvent,
} from '../../../utils/events.helpers';
import { prependHttp, priceFormat } from '../../../utils/helpers';
import { linkedMetricFields, logMetric } from '../../../utils/metrics';
import { getSiteUrl } from '../../../utils/siteUrl';
import PageNotFound from '../../not-found';

const SITE_URL = getSiteUrl();

interface EventsConfig {
  enabled: boolean;
}

interface Props {
  event: Event;
  eventCreator: User;
  error?: string;
  descriptionText?: string;
  settings: any;
  listings: Listing[];
  eventsConfig: EventsConfig | null;
}

const EventPageContent = ({
  event,
  eventCreator,
  error,
  descriptionText,
  listings,
  settings,
  eventsConfig,
}: Props) => {
  const t = useTranslations();
  const router = useRouter();
  const { platform }: any = usePlatform();
  const { user, isAuthenticated, refetchUser } = useAuth();
  const { APP_NAME } = useConfig() || {};

  const isEventsEnabled = eventsConfig?.enabled === true;

  const [photo, setPhoto] = useState<string | null>(event?.photo ?? null);
  const [password, setPassword] = useState('');
  const [attendees, setAttendees] = useState(event && (event.attendees || []));
  const [isShowingEvent, setIsShowingEvent] = useState(true);
  const [passwordError] = useState<null | string>(null);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [isEmailAttendeesModalOpen, setIsEmailAttendeesModalOpen] =
    useState(false);
  /** Bumped after a purchase so the tickets card picks the new one up. */
  const [ticketsRefreshKey, setTicketsRefreshKey] = useState(0);
  const [apiError, setApiError] = useState<string | null>(null);

  const eventDetailMetricLoggedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!event?._id) return;
    const idKey = String(event.slug || event._id);
    if (eventDetailMetricLoggedRef.current === idKey) return;
    eventDetailMetricLoggedRef.current = idKey;
    void logMetric({
      event: 'event-detail-viewed',
      category: 'events',
      value: 'view',
      ...linkedMetricFields('Event', event._id),
    });
  }, [event?._id, event?.slug]);

  /**
   * The ticket modal is a URL, not a piece of local state — `?checkout` opens
   * it, `?ticketId=` opens it on payment, `#tickets` is the short form. That
   * makes every step of a purchase linkable, and back closes the modal rather
   * than leaving the page.
   *
   * The hash is read after mount because the server never sees it: deciding
   * from it during render would make the first client render disagree with the
   * markup that was sent.
   */
  const [locationHash, setLocationHash] = useState('');
  useEffect(() => {
    const readHash = () => setLocationHash(window.location.hash);
    readHash();
    window.addEventListener('hashchange', readHash);
    return () => window.removeEventListener('hashchange', readHash);
  }, []);

  const checkout = useMemo(
    () => parseEventCheckoutLink(router.query, locationHash),
    [router.query, locationHash],
  );
  const isTicketModalOpen = checkout.isOpen;

  const setCheckoutQuery = (
    query: Record<string, string | string[] | undefined>,
    method: 'push' | 'replace',
  ) =>
    router[method]({ pathname: router.pathname, query }, undefined, {
      shallow: true,
      scroll: false,
    });

  const openTicketModal = () =>
    setCheckoutQuery({ ...router.query, checkout: '1' }, 'push');

  const closeTicketModal = () => {
    // Dropping the hash along with the query is the point — a reopened page
    // should not reopen the modal behind the guest's back.
    setLocationHash('');
    setCheckoutQuery(withoutCheckoutQuery(router.query), 'replace');
  };

  // Any way out of the modal counts, the back button included — a ticket may
  // have been bought before the guest left it.
  const wasTicketModalOpenRef = useRef(false);
  useEffect(() => {
    if (wasTicketModalOpenRef.current && !isTicketModalOpen) {
      setTicketsRefreshKey((key) => key + 1);
    }
    wasTicketModalOpenRef.current = isTicketModalOpen;
  }, [isTicketModalOpen]);

  const canEditEvent = user
    ? user?._id === event?.createdBy || user?.roles.includes('admin')
    : false;

  const allTicketFilter = event && {
    where: {
      event: event._id,
      status: 'approved',
    },
  };

  const start = event && event.start && dayjs(event.start);
  const end = event && event.end && dayjs(event.end);
  const duration = end && end.diff(start, 'hour', true);
  const isThisYear = dayjs().isSame(start, 'year');
  const dateFormat = isThisYear ? 'MMM D' : 'YYYY MMMM';

  const durationInDays = getEventNights(event?.start, event?.end);

  const {
    min: minAccommodationPrice,
    max: maxAccommodationPrice,
    currency: accommodationCurrency,
  } = getAccommodationPriceRange(settings, listings, durationInDays, start);

  /** Nothing worth showing when no event listing carries a price. */
  const hasAccommodationPrice = maxAccommodationPrice > 0;

  const hasTicketOptions = Boolean(event?.paid && event?.ticketOptions?.length);

  /**
   * A one-day event and a virtual one leave the guest nowhere to sleep, so
   * attending them is a ticket and nothing else — the booking flow is never
   * involved, whether or not the event charges for it.
   */
  const needsAccommodation = eventNeedsAccommodation(event);
  const isFree = isFreeEvent(event);

  /**
   * Attendance is a ticket unless the guest has to sleep somewhere and the
   * event sells no ticket that says which — the one case the accommodation
   * search answers first and writes the ticket at the end of it.
   */
  const opensTicketModal = hasTicketOptions || !needsAccommodation;

  /**
   * A free event issues a ticket like any other, marked free rather than paid,
   * so a signed-in guest claims one instead of only being added to the
   * attendee list. Signing up is still what a signed-out guest does first —
   * that flow registers them and brings them back here holding an account.
   */
  const claimsFreeTicket = isFree && isAuthenticated;

  // A free ticket costs nothing to issue, so it does not wait on a payment
  // processor being configured.
  const canSellTickets = Boolean(
    isFree || process.env.NEXT_PUBLIC_PLATFORM_STRIPE_PUB_KEY,
  );

  const stayCreateHref = `/stay/create?eventId=${event?._id}&start=${
    start ? start.format('YYYY-MM-DD') : ''
  }&end=${end ? end.format('YYYY-MM-DD') : ''}`;

  const ticketsCount = event?.ticketOptions
    ? (platform.ticket.findCount(allTicketFilter) || event?.attendees?.length) -
      event?.attendees?.length
    : event?.attendees && event.attendees.length;

  const ticketsFilter = { where: { event: event && event._id } };
  const filteredTickets = platform.ticket.find(ticketsFilter);

  const soldTickets =
    filteredTickets &&
    filteredTickets.map((ticket: any) => ticket.toJS()).toArray();

  // `paid` can be set on an event that has no ticket options yet, and sold
  // tickets (RSVPs, legacy rows) do not always carry an `option` — neither may
  // take the page down.
  const ticketOptions: any[] = Array.isArray(event?.ticketOptions)
    ? event.ticketOptions
    : [];
  const countSold = (optionName: string) =>
    soldTickets
      ? soldTickets.filter((ticket: any) => ticket?.option?.name === optionName)
          .length
      : 0;
  const allTicketsSoldOut =
    Boolean(event?.paid) &&
    ticketOptions.length > 0 &&
    ticketOptions.every(
      (ticketOption: any) =>
        ticketOption.limit !== 0 &&
        ticketOption.limit - countSold(ticketOption.name) <= 0,
    );

  useEffect(() => {
    const eventPassword = localStorage.getItem('eventPassword') as string;
    if (eventPassword) {
      setPassword(eventPassword);
    }

    if (event?.password) {
      setIsShowingEvent(false);
    }
  }, []);

  useEffect(() => {
    if (event) {
      loadData();
    }
  }, [event, user]);

  const loadData = async () => {
    await platform.ticket.get(ticketsFilter);

    if (event?.attendees && event.attendees.length > 0) {
      const params = { where: { _id: { $in: event.attendees } } };
      await Promise.all([
        // Load attendees list
        platform.user.get(params),
        platform.ticket.getCount(allTicketFilter),
      ]);
    }
  };

  const refreshAttendeeStatus = async () => {
    try {
      // Wait a bit for the user context to be updated after signup
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Refresh the user context to ensure we have the latest user data
      await refetchUser();

      // Fetch the latest event data to get updated attendees
      const {
        data: { results: updatedEvent },
      } = await api.get(`/event/${event.slug || event._id}`);

      if (updatedEvent && updatedEvent.attendees) {
        setAttendees(updatedEvent.attendees);
      }
    } catch (error) {
      console.error('Error refreshing attendee status:', error);
    }
  };

  const attendEvent = async (_id: any, attend: any) => {
    try {
      const {
        data: { results: event },
      } = await api.post(`/attend/event/${_id}`, { attend });

      await api.post(`/events/${_id}/notifications`, {
        userId: user?._id,
      });

      // Ensure current user data is available in platform cache for immediate display
      if (attend && user) {
        platform.user.set(user);
      }

      setAttendees(
        attend
          ? event.attendees.concat(user?._id)
          : event.attendees.filter((a: string) => a !== user?._id),
      );
    } catch (err) {
      setApiError(parseMessageFromError(err));
      console.log('err===', err);
    }
  };

  const getDaysTo = (date: any) => {
    if (date && date.isAfter(dayjs())) {
      return date.diff(dayjs(), 'day');
    } else {
      return 0;
    }
  };

  const showEvent = () => {
    setIsShowingEvent(true);
  };

  const handleRegisterClick = () => {
    if (!isAuthenticated) {
      setIsSignupModalOpen(true);
    } else {
      attendEvent(event?._id, !attendees?.includes(user?._id || 'notsignedin'));
    }
  };

  const handleSignupSuccess = async () => {
    setIsSignupModalOpen(false);
    // The SignupModal already handles event registration and notification sending
    // so we don't need to call attendEvent here
    // Refresh the attendee status to show the updated UI
    await refreshAttendeeStatus();
  };

  if (!isEventsEnabled) {
    return <FeatureNotEnabled feature="events" />;
  }

  if (!event) {
    return <PageNotFound error={error} />;
  }

  return (
    <>
      <Head>
        <title>{event.name}</title>
        <meta
          name="description"
          content={descriptionText || `${event.name} - Join us for this event.`}
        />
        <meta
          name="keywords"
          content={`${event.name}, event, regenerative communities`}
        />
        <meta property="og:title" content={event.name} />
        <meta property="og:type" content="event" />
        <meta
          property="og:description"
          content={descriptionText || `${event.name} - Join us for this event.`}
        />
        {SITE_URL && (
          <meta
            property="og:url"
            content={`${SITE_URL}/events/${event.slug}`}
          />
        )}
        {photo && (
          <meta
            key="og:image"
            property="og:image"
            content={`${cdn}${photo}-place-lg.jpg`}
          />
        )}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={event.name} />
        <meta
          name="twitter:description"
          content={descriptionText || `${event.name} - Join us for this event.`}
        />
        {photo && (
          <meta
            key="twitter:image"
            name="twitter:image"
            content={`${cdn}${photo}-place-lg.jpg`}
          />
        )}
        {event.start && (
          <meta
            property="event:start_time"
            content={new Date(event.start).toISOString()}
          />
        )}
        {event.end && (
          <meta
            property="event:end_time"
            content={new Date(event.end).toISOString()}
          />
        )}
        {SITE_URL && (
          <link
            rel="canonical"
            href={`${SITE_URL}/events/${event.slug}`}
            key="canonical"
          />
        )}
      </Head>

      {isShowingEvent === false ||
      (event.password && event.password !== password) ? (
        <div className="flex flex-col justify-center items-center my-20 ">
          <div className="w-34 flex flex-col gap-4">
            <Heading>This event is password protected</Heading>
            <input
              onChange={(e) => setPassword(e.target.value)}
              placeholder="password"
              type="password"
              value={password}
            />

            <Button onClick={showEvent}>Show event</Button>

            {passwordError && <ErrorMessage error={passwordError} />}

            {isAuthenticated &&
              (user?._id === event.createdBy ||
                user?.roles.includes('admin')) && (
                <div className="admin-actions mt-3 border-t pt-3">
                  <Link
                    as={`/events/${event.slug}/edit`}
                    href="/events/[slug]/edit"
                    className="btn-secondary text-xs mr-2"
                  >
                    {t('events_slug_edit_link')}
                  </Link>
                </div>
              )}
          </div>
        </div>
      ) : (
        <div className="w-full flex items-center flex-col gap-4">
          <section className="w-full flex flex-col items-center max-w-4xl mx-auto gap-4">
            <div className="w-full">
              <EventPhotoUploadSection
                event={event}
                photo={photo}
                setPhoto={setPhoto}
                cdn={cdn}
                canEditEvent={canEditEvent ?? false}
                isAuthenticated={isAuthenticated ?? false}
                user={user}
              />
            </div>
            {canEditEvent && (
              <div className="flex flex-wrap gap-3 justify-center w-full px-4">
                <LinkButton
                  size="small"
                  variant="secondary"
                  href={event.slug && `/events/${event.slug}/tickets`}
                  className="!w-auto rounded-lg border-gray-200 px-4 py-2 text-sm normal-case"
                >
                  {t('event_view_tickets_button')}
                </LinkButton>
                <LinkButton
                  size="small"
                  variant="secondary"
                  href={event.slug && `/events/${event.slug}/report`}
                  className="!w-auto rounded-lg border-gray-200 px-4 py-2 text-sm normal-case"
                >
                  {t('event_view_report_button') || 'View Report'}
                </LinkButton>
                <Button
                  size="small"
                  variant="secondary"
                  onClick={() => setIsEmailAttendeesModalOpen(true)}
                  className="!w-auto rounded-lg border-gray-200 px-4 py-2 text-sm normal-case"
                >
                  {t('event_email_attendees_button')}
                </Button>
                <LinkButton
                  size="small"
                  href={event.slug && `/events/${event.slug}/edit`}
                  className="!w-auto rounded-lg px-4 py-2 text-sm normal-case"
                >
                  {t('event_edit_event_button')}
                </LinkButton>
              </div>
            )}
          </section>

          {isAuthenticated && (
            <section className="w-full flex justify-center px-4 sm:px-0">
              <div className="max-w-4xl w-full">
                <MyEventTickets
                  eventId={event._id}
                  eventSlug={event.slug}
                  refreshKey={ticketsRefreshKey}
                />
              </div>
            </section>
          )}

          <section className=" w-full flex justify-center">
            <div className="max-w-4xl w-full">
              <div className="flex flex-col sm:flex-row">
                <div className="flex items-start justify-between gap-6 w-full">
                  <div className="flex flex-col gap-3 w-full sm:w-2/3 min-h-[400px]">
                    <Heading className="md:text-4xl mt-4 font-bold">
                      {event.name}
                    </Heading>

                    <div className="flex flex-wrap gap-x-6 gap-y-2 items-baseline my-4">
                      {start && (
                        <div className="flex gap-3 items-baseline text-gray-900">
                          <Image
                            alt="calendar icon"
                            src="/images/icons/calendar-icon.svg"
                            width={20}
                            height={20}
                            className="opacity-60"
                          />
                          <span className="text-lg md:text-xl font-semibold tracking-tight">
                            {dayjs(start).format(dateFormat)}
                            {end &&
                              Number(duration) <= 24 &&
                              ` ${dayjs(start).format('HH:mm')}`}
                            {end &&
                              Number(duration) > 24 &&
                              ` – ${dayjs(end).format(dateFormat)}`}
                            {end &&
                              Number(duration) <= 24 &&
                              ` – ${dayjs(end).format('HH:mm')}`}
                          </span>
                          {end && end.isBefore(dayjs()) && (
                            <span className="text-red-500 text-sm font-medium ml-1">
                              {t('event_event_ended')}
                            </span>
                          )}
                        </div>
                      )}
                      <Link
                        href={`/members/${
                          eventCreator?.slug || eventCreator?._id
                        }`}
                        className="flex gap-2 items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
                      >
                        <p className="font-medium">{t('event_organiser')}</p>
                        {eventCreator?.photo ? (
                          <Image
                            src={`${cdn}${eventCreator?.photo}-profile-lg.jpg`}
                            loading="lazy"
                            alt={eventCreator?.screenname}
                            className="rounded-full"
                            width={20}
                            height={20}
                          />
                        ) : (
                          <UserAvatarPlaceholder size="xs" />
                        )}
                        <p className="font-medium">
                          {eventCreator?.screenname}
                        </p>
                      </Link>
                    </div>

                    <div>
                      {event.description && <EventDescription event={event} />}
                    </div>

                    {((event.partners && event.partners.length > 0) ||
                      (isAuthenticated && user?._id === event.createdBy)) && (
                      <section className="mb-6">
                        <div className="flex flex-row flex-wrap justify-center items-center">
                          {event.partners &&
                            event.partners.map(
                              (partner: any) =>
                                partner.photoUrl && (
                                  <a
                                    href={partner.url || '#'}
                                    target="_blank"
                                    rel="noreferrer"
                                    key={partner.name}
                                    className="mr-3"
                                  >
                                    <Photo
                                      id={partner.photo}
                                      photoUrl={partner.photoUrl}
                                      className="w-32 h-16"
                                      title={partner.name}
                                      rounded={true}
                                    />
                                  </a>
                                ),
                            )}
                        </div>
                      </section>
                    )}
                  </div>
                  {(event.address ||
                    (event.location && !event.address) ||
                    (attendees && attendees.length > 0) ||
                    (end && !end.isBefore(dayjs()))) && (
                    <div className="h-auto fixed z-10 bottom-0 left-0 sm:sticky sm:top-[100px] w-full sm:w-[250px] space-y-4">
                      <Card className="bg-white border border-gray-100 p-4">
                        <div className="space-y-4">
                          {event.address && (
                            <div className="flex gap-2 items-center">
                              <Image
                                alt="location icon"
                                src="/images/icons/pin-icon.svg"
                                width={16}
                                height={16}
                              />
                              {event.address.startsWith('http') ? (
                                <a
                                  href={event.address}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm font-medium text-blue-600 hover:text-blue-800 underline truncate"
                                >
                                  {event.address}
                                </a>
                              ) : (
                                <p className="text-sm font-medium truncate">
                                  {event.address}
                                </p>
                              )}
                            </div>
                          )}

                          {event.location && !event.address && (
                            <div className="flex gap-2 items-center">
                              <Image
                                alt="location icon"
                                src="/images/icons/pin-icon.svg"
                                width={16}
                                height={16}
                              />
                              {event.location.startsWith('http') ? (
                                <a
                                  href={event.location}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm font-medium text-blue-600 hover:text-blue-800 underline truncate"
                                >
                                  {event.location}
                                </a>
                              ) : (
                                <p className="text-sm font-medium truncate">
                                  {event.location}
                                </p>
                              )}
                            </div>
                          )}

                          {attendees && attendees.length > 0 && (
                            <EventAttendees
                              event={event}
                              start={start}
                              attendees={attendees}
                              ticketsCount={ticketsCount}
                              platform={platform}
                            />
                          )}
                        </div>

                        {end && !end.isBefore(dayjs()) && (
                          <div className="space-y-3">
                            {(() => {
                              return allTicketsSoldOut ? (
                                <div className="text-center py-6 px-3">
                                  <p className="font-bold text-lg">
                                    {t('events_no_tickets_available')}
                                  </p>
                                  <p className="text-sm mt-1">
                                    {t('events_completely_sold_out')}
                                  </p>
                                </div>
                              ) : (
                                event.paid &&
                                  (() => {
                                    const availableOptions =
                                      ticketOptions.filter((opt: any) => {
                                        return (
                                          opt.limit === 0 ||
                                          opt.limit - countSold(opt.name) > 0
                                        );
                                      });
                                    if (availableOptions.length === 0)
                                      return null;
                                    const prices = availableOptions.map(
                                      (o: any) => o.price ?? 0,
                                    );
                                    const minPrice = Math.min(...prices);
                                    const maxPrice = Math.max(...prices);
                                    const currency =
                                      availableOptions[0]?.currency;
                                    const priceSummary =
                                      minPrice === maxPrice
                                        ? priceFormat(minPrice, currency)
                                        : `${priceFormat(
                                            minPrice,
                                            currency,
                                          )} – ${priceFormat(
                                            maxPrice,
                                            currency,
                                          )}`;
                                    return (
                                      <div className="text-sm">
                                        {t('events_ticket')}{' '}
                                        <strong>{priceSummary}</strong>
                                      </div>
                                    );
                                  })()
                              );
                            })()}
                            {needsAccommodation &&
                              hasAccommodationPrice &&
                              APP_NAME &&
                              APP_NAME !== 'lios' &&
                              !allTicketsSoldOut && (
                                <div className="text-sm">
                                  {t('events_accommodation')}{' '}
                                  <strong>
                                    {priceFormat(
                                      minAccommodationPrice,
                                      accommodationCurrency as CloserCurrencies,
                                    )}{' '}
                                    -{' '}
                                    {priceFormat(
                                      maxAccommodationPrice,
                                      accommodationCurrency as CloserCurrencies,
                                    )}
                                  </strong>
                                </div>
                              )}
                            <div>
                              {/* Event uses an external ticketing system */}
                              {event.ticket &&
                              start &&
                              start.isAfter(dayjs()) ? (
                                <Link
                                  href={prependHttp(event.ticket)}
                                  className="btn-primary mr-2"
                                  target="_blank"
                                  rel="noreferrer nofollow"
                                >
                                  {t('events_buy_ticket_button')}
                                </Link>
                              ) : event.paid ||
                                needsAccommodation ||
                                claimsFreeTicket ? (
                                <>
                                  {end &&
                                    end.isAfter(dayjs()) &&
                                    canSellTickets &&
                                    !allTicketsSoldOut && (
                                      <>
                                        {/* Which ticket the guest wants decides
                                            whether they need a bed at all, so a
                                            paid event asks for the ticket first
                                            instead of opening on the
                                            accommodation search. An event that
                                            needs no bed never leaves the modal,
                                            free or not. */}
                                        {opensTicketModal ? (
                                          <Button onClick={openTicketModal}>
                                            {isFree
                                              ? t(
                                                  'events_get_free_ticket_button',
                                                )
                                              : t('events_buy_ticket_button')}
                                          </Button>
                                        ) : (
                                          <LinkButton
                                            href={
                                              isAuthenticated
                                                ? stayCreateHref
                                                : `/login?back=${encodeURIComponent(
                                                    stayCreateHref,
                                                  )}`
                                            }
                                            className=""
                                          >
                                            {isAuthenticated
                                              ? t('events_buy_ticket_button')
                                              : t('events_login_to_book')}
                                          </LinkButton>
                                        )}
                                      </>
                                    )}
                                </>
                              ) : (
                                <>
                                  {!event.paid &&
                                  start &&
                                  end &&
                                  start.isSame(end, 'day') &&
                                  start.isAfter(dayjs()) ? (
                                    <div className="text-center">
                                      {user?._id &&
                                      attendees?.includes(user._id) ? (
                                        <>
                                          <p className="text-sm text-gray-600 mb-2">
                                            {event.virtual
                                              ? t(
                                                  'events_virtual_looking_forward',
                                                )
                                              : 'We look forward to seeing you.'}
                                          </p>
                                          <a
                                            href="#"
                                            className="text-sm text-accent underline"
                                            onClick={(e) => {
                                              e.preventDefault();
                                              if (user?._id) {
                                                attendEvent(
                                                  event._id,
                                                  !attendees?.includes(
                                                    user._id,
                                                  ),
                                                );
                                              }
                                            }}
                                          >
                                            {t('events_cancel_rsvp')}
                                          </a>
                                        </>
                                      ) : (
                                        <>
                                          <p className="text-sm text-gray-800 mb-2">
                                            {t('events_virtual_welcome')}
                                          </p>
                                          {apiError && (
                                            <ErrorMessage error={apiError} />
                                          )}
                                          <button
                                            onClick={(e) => {
                                              e.preventDefault();
                                              if (user?._id) {
                                                attendEvent(
                                                  event._id,
                                                  !attendees?.includes(
                                                    user._id,
                                                  ),
                                                );
                                              }
                                            }}
                                            className="btn-primary mr-2"
                                          >
                                            {t('events_register')}
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  ) : start &&
                                    start.isBefore(
                                      dayjs().subtract(15, 'minutes'),
                                    ) &&
                                    end &&
                                    end.isAfter(dayjs()) &&
                                    event.virtual &&
                                    event.location ? (
                                    <a
                                      className="btn-primary mr-2"
                                      href={event.location}
                                    >
                                      {t('events_join_call')}
                                    </a>
                                  ) : start &&
                                    start.isBefore(dayjs()) &&
                                    end &&
                                    end.isAfter(dayjs()) ? (
                                    // <span className="p3 mr-2" href={event.location}>
                                    <span className="p3 mr-2">
                                      {t('events_ongoing')}
                                    </span>
                                  ) : !isAuthenticated && event.recording ? (
                                    <Link
                                      as={`/signup?back=${encodeURIComponent(
                                        `/events/${event.slug}`,
                                      )}`}
                                      href="/signup"
                                      className="btn-primary mr-2"
                                    >
                                      {t('events_signup_watch_recording')}
                                    </Link>
                                  ) : !isAuthenticated &&
                                    start &&
                                    start.isAfter(dayjs()) ? (
                                    <div>
                                      <p className="text-sm text-gray-600 mb-2">
                                        {t('events_virtual_welcome')}
                                      </p>
                                      <button
                                        onClick={handleRegisterClick}
                                        className="btn-primary mr-2"
                                      >
                                        {t('events_register')}
                                      </button>
                                    </div>
                                  ) : end &&
                                    end.isBefore(dayjs()) &&
                                    user &&
                                    attendees?.includes(user._id) ? (
                                    <div className="text-center">
                                      <p className="text-sm text-gray-600 mb-2">
                                        {t('events_virtual_enjoyed')}
                                      </p>
                                      <a
                                        href="#"
                                        className="text-sm text-accent underline"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          attendEvent(
                                            event._id,
                                            !attendees?.includes(user._id),
                                          );
                                        }}
                                      >
                                        {t('events_cancel_rsvp')}
                                      </a>
                                    </div>
                                  ) : (
                                    end &&
                                    user &&
                                    event.virtual &&
                                    end.isAfter(dayjs()) && (
                                      <div className="text-center">
                                        {attendees?.includes(user._id) ? (
                                          <>
                                            <p className="text-sm text-gray-600 mb-2">
                                              {event.virtual
                                                ? t(
                                                    'events_virtual_looking_forward',
                                                  )
                                                : 'We look forward to seeing you.'}
                                            </p>
                                            <a
                                              href="#"
                                              className="text-sm text-accent underline"
                                              onClick={(e) => {
                                                e.preventDefault();
                                                attendEvent(
                                                  event._id,
                                                  !attendees?.includes(
                                                    user._id,
                                                  ),
                                                );
                                              }}
                                            >
                                              {t('events_cancel_rsvp')}
                                            </a>
                                          </>
                                        ) : (
                                          <>
                                            <p className="text-sm text-gray-800 mb-2">
                                              {t('events_virtual_welcome')}
                                            </p>
                                            {apiError && (
                                              <ErrorMessage error={apiError} />
                                            )}
                                            <button
                                              onClick={(e) => {
                                                e.preventDefault();
                                                attendEvent(
                                                  event._id,
                                                  !attendees?.includes(
                                                    user._id,
                                                  ),
                                                );
                                              }}
                                              className="btn-primary mr-2"
                                            >
                                              {t('events_register')}
                                            </button>
                                          </>
                                        )}
                                      </div>
                                    )
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </Card>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      )}
      <SignupModal
        isOpen={isSignupModalOpen}
        onClose={() => setIsSignupModalOpen(false)}
        onSuccess={handleSignupSuccess}
        eventId={event._id || ''}
      />
      {isEmailAttendeesModalOpen && canEditEvent && (
        <EventEmailAttendeesModal
          eventId={event._id}
          closeModal={() => setIsEmailAttendeesModalOpen(false)}
        />
      )}
      {isTicketModalOpen && (
        <EventTicketModal
          event={event}
          closeModal={closeTicketModal}
          initialTicketId={checkout.ticketId}
          initialTicketOption={checkout.ticketOption}
          initialDiscountCode={checkout.discountCode}
        />
      )}
    </>
  );
};

const EventPage = withPageErrorBoundary(EventPageContent, 'EventPage');

EventPage.getInitialProps = async (context: NextPageContext) => {
  const { query, req } = context;
  try {
    const [event, listings] = await Promise.all([
      api
        .get(`/event/${query.slug}`, {
          headers: getBearerAuthHeaders(req as NextApiRequest),
        })
        .catch((err) => {
          console.error('Error fetching event:', err);
          return null;
        }),
      api
        .get('/listing', {
          params: { limit: MAX_LISTINGS_TO_FETCH },
        })
        .catch(() => null),
    ]);

    const eventsConfig = config.events;

    const options = {
      baseElements: { selectors: ['p', 'h2', 'span'] },
    };

    let eventCreator;
    let descriptionText;
    if (event) {
      descriptionText = convert(event?.data.results.description, options)
        .trim()
        .slice(0, 100);

      const eventCreatorId = event?.data.results.createdBy;

      const {
        data: { results: eventCreatorData },
      } = await api.get(`/user/${eventCreatorId}`, {
        headers: getBearerAuthHeaders(req as NextApiRequest),
      });
      eventCreator = eventCreatorData;
      descriptionText = convert(event?.data.results.description, options)
        .trim()
        .slice(0, 100);
    }

    return {
      event: event?.data.results,
      eventCreator,
      descriptionText,
      listings: listings?.data?.results,
      settings: config.booking,
      eventsConfig,
    };
  } catch (err: unknown) {
    console.log('Error', err);
    return {
      error: parseMessageFromError(err),
      eventsConfig: null,
    };
  }
};

export default EventPage;
