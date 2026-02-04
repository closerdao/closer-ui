import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';

import { useEffect, useState } from 'react';

import EventAttendees from '../../../components/EventAttendees';
import EventDescription from '../../../components/EventDescription';
import EventPhotoUploadSection from '../../../components/EventPhotoUpload';
import Photo from '../../../components/Photo';
import SignupModal from '../../../components/SignupModal';
import { Button, Card, ErrorMessage, LinkButton } from '../../../components/ui';
import Heading from '../../../components/ui/Heading';

import { User as UserIcon } from 'lucide-react';
import dayjs from 'dayjs';
import { NextApiRequest, NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import { MAX_LISTINGS_TO_FETCH } from '../../../constants';
import { useAuth } from '../../../contexts/auth';
import { User } from '../../../contexts/auth/types';
import { usePlatform } from '../../../contexts/platform';
import { useConfig } from '../../../hooks/useConfig';
import { Event, Listing } from '../../../types';
import api, { cdn } from '../../../utils/api';
import { parseMessageFromError } from '../../../utils/common';
import { getAccommodationPriceRange } from '../../../utils/events.helpers';
import {
  getBookingRate,
  getDiscountRate,
  prependHttp,
  priceFormat,
} from '../../../utils/helpers';
import { loadLocaleData } from '../../../utils/locale.helpers';
import FeatureNotEnabled from '../../../components/FeatureNotEnabled';
import PageNotFound from '../../not-found';

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

const EventPage = ({
  event,
  eventCreator,
  error,
  descriptionText,
  listings,
  settings,
  eventsConfig,
}: Props) => {
  const t = useTranslations();
  const { platform }: any = usePlatform();
  const { user, isAuthenticated, refetchUser } = useAuth();
  const { APP_NAME } = useConfig() || {};

  const isEventsEnabled = eventsConfig?.enabled !== false;

  const [photo, setPhoto] = useState(event && event.photo);
  const [password, setPassword] = useState('');
  const [attendees, setAttendees] = useState(event && (event.attendees || []));
  const [isShowingEvent, setIsShowingEvent] = useState(true);
  const [passwordError] = useState<null | string>(null);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [apiError, setApiError] = useState(null);

  const canEditEvent = user
    ? user?._id === event?.createdBy || user?.roles.includes('admin')
    : false;

  const myTicketFilter = event && {
    where: {
      event: event?._id,
      status: 'approved',
      email: user && user.email,
    },
  };
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

  const durationInDays = dayjs(end).diff(dayjs(start), 'day');

  const durationName = getBookingRate(durationInDays);

  const discountRate = settings
    ? 1 - getDiscountRate(durationName, settings)
    : 0;

  const { min: minAccommodationPrice, max: maxAccommodationPrice } =
    getAccommodationPriceRange(settings, listings, durationInDays, start);

  const myTickets = platform.ticket.find(myTicketFilter);

  const ticketsCount = event?.ticketOptions
    ? (platform.ticket.findCount(allTicketFilter) || event?.attendees?.length) -
      event?.attendees?.length
    : event?.attendees && event.attendees.length;

  const ticketsFilter = { where: { event: event && event._id } };
  const filteredTickets = platform.ticket.find(ticketsFilter);

  const soldTickets =
    filteredTickets &&
    filteredTickets.map((ticket: any) => ticket.toJS()).toArray();

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
        platform.ticket.get(myTicketFilter),
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
        <meta name="description" content={descriptionText || `${event.name} - Join us for this event.`} />
        <meta name="keywords" content={`${event.name}, event, regenerative communities`} />
        <meta property="og:title" content={event.name} />
        <meta property="og:type" content="event" />
        <meta property="og:description" content={descriptionText || `${event.name} - Join us for this event.`} />
        <meta property="og:url" content={`${process.env.NEXT_PUBLIC_PLATFORM_URL || 'https://closer.earth'}/events/${event.slug}`} />
        {photo && (
          <meta
            key="og:image"
            property="og:image"
            content={`${cdn}${photo}-place-lg.jpg`}
          />
        )}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={event.name} />
        <meta name="twitter:description" content={descriptionText || `${event.name} - Join us for this event.`} />
        {photo && (
          <meta
            key="twitter:image"
            name="twitter:image"
            content={`${cdn}${photo}-place-lg.jpg`}
          />
        )}
        {event.start && (
          <meta property="event:start_time" content={new Date(event.start).toISOString()} />
        )}
        {event.end && (
          <meta property="event:end_time" content={new Date(event.end).toISOString()} />
        )}
        <link
          rel="canonical"
          href={`${process.env.NEXT_PUBLIC_PLATFORM_URL || 'https://closer.earth'}/events/${event.slug}`}
          key="canonical"
        />
      </Head>

      {(isShowingEvent === false ||
      (event.password && event.password !== password)) ? (
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
                        href={`/members/${eventCreator?.slug || eventCreator?._id}`}
                        className="flex gap-2 items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
                      >
                        <p className="font-medium">
                          {t('event_organiser')}
                        </p>
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
                          <UserIcon className="text-gray-300 w-[20px] h-[20px] rounded-full" />
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
                              // Check if all tickets are sold out
                              const allTicketsSoldOut = event.paid && event.ticketOptions.every((ticketOption: any) => {
                                const availableTickets = soldTickets && ticketOption.limit - soldTickets.filter((ticket: any) => ticket.option.name === ticketOption.name).length;
                                return availableTickets === 0 && ticketOption.limit !== 0;
                              });
                              
                              return allTicketsSoldOut ? (
                                <div className="text-center py-6 px-3">
                                  <p className="font-bold text-lg">{t('events_no_tickets_available')}</p>
                                  <p className="text-sm mt-1">{t('events_completely_sold_out')}</p>
                                </div>
                              ) : (
                                event.paid &&
                                (() => {
                                  const availableOptions = event.ticketOptions.filter((opt: any) => {
                                    const sold = soldTickets?.filter((t: any) => t.option?.name === opt.name).length || 0;
                                    return opt.limit === 0 || opt.limit - sold > 0;
                                  });
                                  if (availableOptions.length === 0) return null;
                                  const prices = availableOptions.map((o: any) => o.price ?? 0);
                                  const minPrice = Math.min(...prices);
                                  const maxPrice = Math.max(...prices);
                                  const currency = availableOptions[0]?.currency;
                                  const priceSummary = minPrice === maxPrice
                                    ? priceFormat(minPrice, currency)
                                    : `${priceFormat(minPrice, currency)} – ${priceFormat(maxPrice, currency)}`;
                                  return (
                                    <div className="text-sm">
                                      {t('events_ticket')}{' '}
                                      <strong>{priceSummary}</strong>
                                    </div>
                                  );
                                })()
                              );
                            })()}
                            {durationInDays > 0 &&
                              APP_NAME &&
                              APP_NAME !== 'lios' &&
                              !(event.paid && event.ticketOptions.every((ticketOption: any) => {
                                const availableTickets = soldTickets && ticketOption.limit - soldTickets.filter((ticket: any) => ticket.option.name === ticketOption.name).length;
                                return availableTickets === 0 && ticketOption.limit !== 0;
                              })) && (
                                <>
                                  <div className="text-sm">
                                    {t('events_accommodation')}{' '}
                                    <strong>
                                      {priceFormat(
                                        minAccommodationPrice * discountRate,
                                      )}{' '}
                                      -{' '}
                                      {priceFormat(
                                        maxAccommodationPrice * discountRate,
                                      )}
                                    </strong>
                                  </div>
                                </>
                              )}
                            <div>
                              {/* Event uses an external ticketing system */}
                              {event.ticket && start && start.isAfter(dayjs()) ? (
                                <Link
                                  href={prependHttp(event.ticket)}
                                  className="btn-primary mr-2"
                                  target="_blank"
                                  rel="noreferrer nofollow"
                                >
                                  {t('events_buy_ticket_button')}
                                </Link>
                              ) : event.paid || durationInDays > 0 ? (
                                <>
                                  {myTickets && (
                                    <div>
                                      <Heading level={4}>Tickets</Heading>
                                      <ul className="space-y-2 divide-y mb-3">
                                        {myTickets.map((ticket: any) => (
                                          <li key={ticket.get('_id')}>
                                            <Link
                                              href={`/tickets/${ticket.get('_id')}`}
                                              className="text-accent"
                                            >
                                              {ticket.get('name')} x{' '}
                                              {ticket.get('quantity') || 1}
                                            </Link>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                  {end &&
                                    end.isAfter(dayjs()) &&
                                    (event.stripePub ||
                                      process.env
                                        .NEXT_PUBLIC_PLATFORM_STRIPE_PUB_KEY) &&
                                    !(event.paid && event.ticketOptions.every((ticketOption: any) => {
                                      const availableTickets = soldTickets && ticketOption.limit - soldTickets.filter((ticket: any) => ticket.option.name === ticketOption.name).length;
                                      return availableTickets === 0 && ticketOption.limit !== 0;
                                    })) && (
                                      <>
                                        {event.requireApproval && (
                                          <p className="text-sm text-gray-600 mb-2">
                                            {t('bookings_event_requires_approval')}
                                          </p>
                                        )}
                                        <LinkButton
                                          href={`/bookings/create/dates/?eventId=${event._id
                                            }&start=${start ? start.format('YYYY-MM-DD') : ''
                                            }&end=${end ? end.format('YYYY-MM-DD') : ''
                                            }`}
                                          className=""
                                        >
                                          {t('events_buy_ticket_button')}
                                        </LinkButton>
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
                                      {user?._id && attendees?.includes(user._id) ? (
                                        <>
                                          <p className="text-sm text-gray-600 mb-2">
                                            {event.virtual ? t('events_virtual_looking_forward') : 'We look forward to seeing you.'}
                                          </p>
                                          <a
                                            href="#"
                                            className="text-sm text-accent underline"
                                            onClick={(e) => {
                                              e.preventDefault();
                                              if (user?._id) {
                                                attendEvent(
                                                  event._id,
                                                  !attendees?.includes(user._id),
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
                                                  !attendees?.includes(user._id),
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
                                    start.isBefore(dayjs().subtract(15, 'minutes')) &&
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
                                              {event.virtual ? t('events_virtual_looking_forward') : 'We look forward to seeing you.'}
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
                                                  !attendees?.includes(user._id),
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
    </>
  );
};

EventPage.getInitialProps = async (context: NextPageContext) => {
  const { query, req } = context;
  const { convert } = require('html-to-text');
  try {
    const [event, listings, settings, eventsRes, messages] = await Promise.all([
      api
        .get(`/event/${query.slug}`, {
          headers: (req as NextApiRequest)?.cookies?.access_token && {
            Authorization: `Bearer ${
              (req as NextApiRequest)?.cookies?.access_token
            }`,
          },
        })
        .catch((err) => {
          console.error('Error fetching event:', err);
          return null;
        }),
      api
        .get('/listing', {
          params: {
            limit: MAX_LISTINGS_TO_FETCH,
          },
        })
        .catch(() => {
          return null;
        }),
      api.get('/config/booking').catch(() => {
        return null;
      }),
      api.get('/config/events').catch(() => {
        return null;
      }),
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);

    const eventsConfig = eventsRes?.data?.results?.value;

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
        headers: (req as NextApiRequest)?.cookies?.access_token && {
          Authorization: `Bearer ${
            (req as NextApiRequest)?.cookies?.access_token
          }`,
        },
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
      settings: settings?.data?.results?.value,
      eventsConfig,
      messages,
    };
  } catch (err: unknown) {
    console.log('Error', err);
    return {
      error: parseMessageFromError(err),
      eventsConfig: null,
      messages: null,
    };
  }
};

export default EventPage;
