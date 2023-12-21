import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';

import { useEffect, useState } from 'react';

import EventAttendees from '../../../components/EventAttendees';
import EventDescription from '../../../components/EventDescription';
import EventPhoto from '../../../components/EventPhoto';
import Photo from '../../../components/Photo';
import UploadPhoto from '../../../components/UploadPhoto/UploadPhoto';
import { Card, Information, LinkButton } from '../../../components/ui';
import Heading from '../../../components/ui/Heading';

import { FaUser } from '@react-icons/all-files/fa/FaUser';
import dayjs from 'dayjs';
import { NextApiRequest } from 'next';
import { ParsedUrlQuery } from 'querystring';

import PageNotFound from '../../404';
import { useAuth } from '../../../contexts/auth';
import { User } from '../../../contexts/auth/types';
import { usePlatform } from '../../../contexts/platform';
import { BookingSettings, Event, Listing } from '../../../types';
import api, { cdn } from '../../../utils/api';
import { parseMessageFromError } from '../../../utils/common';
import { getAccommodationPriceRange } from '../../../utils/events.helpers';
import { prependHttp, priceFormat } from '../../../utils/helpers';
import { __ } from '../../../utils/helpers';

interface Props {
  event: Event;
  eventCreator: User;
  error?: string;
  descriptionText?: string;
  settings: BookingSettings;
  listings: Listing[];
}

const EventPage = ({
  event,
  eventCreator,
  error,
  descriptionText,
  listings,
  settings,
}: Props) => {
  const { platform }: any = usePlatform();
  const { user, isAuthenticated } = useAuth();

  const dailyUtilityFee = settings.utilityFiat.val;

  const [photo, setPhoto] = useState(event && event.photo);
  const [password, setPassword] = useState('');
  const [attendees, setAttendees] = useState(event && (event.attendees || []));

  const canEditEvent = user
    ? user?._id === event?.createdBy || user?.roles.includes('admin')
    : false;

  const myTicketFilter = event && {
    where: {
      event: event._id,
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
  const durationRateDays = durationInDays >= 28 ? 30 : durationInDays > 7 ? 7 : 1;
  const durationName = durationInDays >= 28 ?
    'monthly' :
    durationInDays > 7 ?
      'weekly' :
      'daily';
  const discountRate = settings ? (1 - settings.discounts[durationName]) : 0;
  const { min: minAccommodationPrice, max: maxAccommodationPrice } =
    getAccommodationPriceRange(settings, listings, durationInDays, start);

  const myTickets = platform.ticket.find(myTicketFilter);
  const ticketsCount = event?.ticketOptions
    ? (platform.ticket.findCount(allTicketFilter) || event?.attendees?.length) -
      event?.attendees?.length
    : event?.attendees && event.attendees.length;

  useEffect(() => {
    if (event) {
      loadData();
    }
  }, [event, user]);

  const loadData = async () => {
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

  const attendEvent = async (_id: any, attend: any) => {
    try {
      const {
        data: { results: event },
      } = await api.post(`/attend/event/${_id}`, { attend });
      setAttendees(
        attend
          ? event.attendees.concat(user?._id)
          : event.attendees.filter((a: string) => a !== user?._id),
      );
    } catch (err) {
      alert(`Could not RSVP: ${err}`);
    }
  };

  if (!event) {
    return <PageNotFound error={error} />;
  }

  return (
    <>
      <Head>
        <title>{event.name}</title>
        <meta name="description" content={descriptionText} />
        <meta property="og:type" content="event" />
        {photo && (
          <meta
            key="og:image"
            property="og:image"
            content={`${cdn}${photo}-place-lg.jpg`}
          />
        )}
        {photo && (
          <meta
            key="twitter:image"
            name="twitter:image"
            content={`${cdn}${photo}-place-lg.jpg`}
          />
        )}
        <link
          rel="canonical"
          href={`https://www.traditionaldreamfactory.com/events/${event.slug}`}
          key="canonical"
        />
      </Head>

      {event.password && event.password !== password ? (
        <div className="flex flex-col justify-center items-center">
          <div className="w-34">
            <Heading>This event is password protected</Heading>
            <input
              onChange={(e) => setPassword(e.target.value)}
              placeholder="password"
              type="password"
            />
            {isAuthenticated &&
              (user?._id === event.createdBy ||
                user?.roles.includes('admin')) && (
                <div className="admin-actions mt-3 border-t pt-3">
                  <Link
                    as={`/events/${event.slug}/edit`}
                    href="/events/[slug]/edit"
                    className="btn-secondary text-xs mr-2"
                  >
                    {__('events_slug_edit_link')}
                  </Link>
                </div>
              )}
          </div>
        </div>
      ) : (
        <div className="w-full flex items-center flex-col gap-4">
          <section className=" w-full flex justify-center max-w-4xl">
            <div
              className={`"w-full relative bg-accent-light rounded-md w-full " ${
                canEditEvent ? ' min-h-[400px] ' : ''
              }`}
            >
              <EventPhoto
                event={event}
                user={user}
                photo={photo}
                cdn={cdn}
                isAuthenticated={isAuthenticated}
                setPhoto={setPhoto}
              />
              {canEditEvent && (
                <div className="absolute right-0 bottom-0 p-8 flex flex-col gap-4 ">
                  <LinkButton
                    size="small"
                    href={event.slug && `/events/${event.slug}/tickets`}
                  >
                    {__('event_view_tickets_button')}
                  </LinkButton>
                  <LinkButton
                    size="small"
                    href={event.slug && `/events/${event.slug}/edit`}
                    className="bg-accent text-white rounded-full px-4 py-2 text-center uppercase text-sm"
                  >
                    {__('event_edit_event_button')}
                  </LinkButton>

                  {isAuthenticated && canEditEvent && (
                    <UploadPhoto
                      model="event"
                      isMinimal
                      id={event._id}
                      onSave={(id) => setPhoto(id)}
                      label={photo ? 'Change photo' : 'Add photo'}
                    />
                  )}
                </div>
              )}
            </div>
          </section>

          <section className=" w-full flex justify-center">
            <div className="max-w-4xl w-full ">
              <div className="w-full py-2">
                <div className="w-full flex flex-col sm:flex-row gap-4 sm:gap-8">
                  <div className="flex gap-1 items-center min-w-[120px]">
                    <Image
                      alt="calendar icon"
                      src="/images/icons/calendar-icon.svg"
                      width={20}
                      height={20}
                    />
                    <label className="text-sm uppercase font-bold flex gap-1">
                      {start && dayjs(start).format(dateFormat)}
                      {end &&
                        Number(duration) > 24 &&
                        ` - ${dayjs(end).format(dateFormat)}`}
                      {end &&
                        Number(duration) <= 24 &&
                        ` - ${dayjs(end).format('HH:mm')}`}{' '}
                      {end && end.isBefore(dayjs()) && (
                        <p className="text-disabled">
                          {__('event_event_ended')}
                        </p>
                      )}
                    </label>
                  </div>
                  {event.address && (
                    <div className="flex gap-1 items-center">
                      <Image
                        alt="location icon"
                        src="/images/icons/pin-icon.svg"
                        width={20}
                        height={20}
                      />
                      <p className="text-sm uppercase font-bold">
                        {event.address}
                      </p>
                    </div>
                  )}
                  <div className="flex items-center text-sm uppercase font-bold gap-1">
                    <p className="">{__('event_organiser')}</p>

                    {eventCreator.photo ? (
                      <Image
                        src={`${cdn}${eventCreator?.photo}-profile-lg.jpg`}
                        loading="lazy"
                        alt={eventCreator?.screenname}
                        className=" rounded-full"
                        width={25}
                        height={25}
                      />
                    ) : (
                      <FaUser className="text-gray-300 w-[30px] h-[30px] rounded-full" />
                    )}

                    <p>{eventCreator?.screenname}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className=" w-full flex justify-center min-h-[400px]">
            <div className="max-w-4xl w-full">
              <div className="flex flex-col sm:flex-row">
                <div className="flex items-start justify-between gap-6 w-full">
                  <div className="flex flex-col gap-10 w-full sm:w-2/3">
                    <Heading className="md:text-4xl mt-4 font-bold">
                      {event.name}
                    </Heading>

                    <div>
                      {event.description && <EventDescription event={event} />}
                    </div>
                  </div>
                  <div className="h-auto fixed bottom-0 left-0 sm:sticky sm:top-[100px] w-full sm:w-[250px]">
                    {end && !end.isBefore(dayjs()) && (
                      <Card className="bg-white border border-gray-100">
                        {event.paid &&
                          event.ticketOptions.map((ticket: any) => (
                            <div
                              key={ticket.name}
                              className="hidden sm:flex flex-col gap-1"
                            >
                              <div className="flex flex-col bg-accent-light rounded-md p-2 items-center ">
                                <p className="text-lg text-center">
                                  {ticket.name}
                                </p>
                                <p className="text-md font-bold">
                                  {priceFormat(ticket.price)}
                                </p>
                                <p>
                                  {!ticket.limit ? (
                                    <span className="text-xs text-error">
                                      {__('event_tickets_sold')}
                                    </span>
                                  ) : ticket.limit > 10 ? (
                                    <span className="text-xs text-success">
                                      {__('event_tickets_available')}
                                    </span>
                                  ) : (
                                    <span className="text-xs text-pending">
                                      {__('event_tickets_last')}
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>
                          ))
                        }
                        {durationInDays > 0 && (
                          <>
                            <Information>{__('events_disclaimer')}</Information>
                            <div className="text-sm">
                              {__('events_accommodation')}{' '}
                              <strong>
                                {priceFormat(minAccommodationPrice * discountRate)} -{' '}
                                {priceFormat(maxAccommodationPrice * discountRate)}
                              </strong>
                            </div>
                            <div className="text-sm">
                              {__('events_utility')}{' '}
                              <strong>
                                {priceFormat(durationInDays * dailyUtilityFee)}
                              </strong>
                            </div>
                          </>
                        )}
                        <div className="mt-4">
                          {/* Event uses an external ticketing system */}
                          {event.ticket && start && start.isAfter(dayjs()) ? (
                            <Link
                              href={prependHttp(event.ticket)}
                              className="btn-primary mr-2"
                              target="_blank"
                              rel="noreferrer nofollow"
                            >
                              {__('events_buy_ticket_button')}
                            </Link>
                          ) : (event.paid || durationInDays > 0) ? (
                            <>
                              {myTickets &&
                                <div>
                                  <Heading level={4}>
                                    Tickets
                                  </Heading>
                                  <ul className="space-y-2 divide-y mb-3">
                                    { myTickets.map((ticket: any) => (
                                      <li
                                        key={ticket.get('_id')}
                                      >
                                        <Link
                                          href={`/tickets/${ticket.get('_id')}`}
                                          className="text-primary"
                                        >
                                          { ticket.get('name') } x { ticket.get('quantity') || 1 }
                                        </Link>
                                      </li>
                                    )) }
                                  </ul>
                                </div>
                              }
                              {
                                end && end.isAfter(dayjs()) &&
                                (event.stripePub ||
                                  process.env.NEXT_PUBLIC_STRIPE_PUB_KEY) && (
                                  <LinkButton
                                    href={`/bookings/create/dates/?eventId=${
                                      event._id
                                    }&start=${
                                      start ? start.format('YYYY-MM-DD') : ''
                                    }&end=${
                                      end ? end.format('YYYY-MM-DD') : ''
                                    }`}
                                    className=""
                                  >
                                    {__('events_buy_ticket_button') }
                                  </LinkButton>
                                )
                              }
                            </>
                          ) : (
                            <>
                              {start &&
                              start.isBefore(dayjs().subtract(15, 'minutes')) &&
                              end &&
                              end.isAfter(dayjs()) &&
                                event.virtual && event.location ? (
                                <a
                                  className="btn-primary mr-2"
                                  href={event.location}
                                >
                                  Join call
                                </a>
                              ) : start &&
                                start.isBefore(dayjs()) &&
                                end &&
                                end.isAfter(dayjs()) ? (
                                // <span className="p3 mr-2" href={event.location}>
                                <span className="p3 mr-2">ONGOING</span>
                              ) : !isAuthenticated && event.recording ? (
                                <Link
                                  as={`/signup?back=${encodeURIComponent(
                                    `/events/${event.slug}`,
                                  )}`}
                                  href="/signup"
                                  className="btn-primary mr-2"
                                >
                                  Signup to watch recording
                                </Link>
                              ) : !isAuthenticated &&
                                start &&
                                start.isAfter(dayjs()) ? (
                                <Link
                                  as={`/signup?back=${encodeURIComponent(
                                    `/events/${event.slug}`,
                                  )}`}
                                  href="/signup"
                                  className="btn-primary mr-2"
                                >
                                  Signup to RSVP
                                </Link>
                              ) : end &&
                                end.isBefore(dayjs()) &&
                                user &&
                                attendees?.includes(user._id) ? (
                                <a
                                  href="#"
                                  className="btn-primary mr-2"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    attendEvent(
                                      event._id,
                                      !attendees?.includes(user._id),
                                    );
                                  }}
                                >
                                  Cancel RSVP
                                </a>
                              ) : end &&
                                user &&
                                event.virtual &&
                                end.isAfter(dayjs()) && (
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
                                  Attend
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </Card>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <main className="max-w-prose py-10 w-full">
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

            {attendees && attendees.length > 0 && (
              <div>
                <EventAttendees
                  event={event}
                  start={start}
                  attendees={attendees}
                  ticketsCount={ticketsCount}
                  platform={platform}
                />
              </div>
            )}
          </main>
        </div>
      )}
    </>
  );
};

EventPage.getInitialProps = async ({
  req,
  query,
}: {
  req: NextApiRequest;
  query: ParsedUrlQuery;
}) => {
  const { convert } = require('html-to-text');
  try {
    const [event, listings, settings] = await Promise.all([
      api.get(`/event/${query.slug}`, {
        headers: req?.cookies?.access_token && {
          Authorization: `Bearer ${req?.cookies?.access_token}`,
        },
      }),
      api.get('/listing'),
      api.get('/config/booking'),
    ]);

    const options = {
      baseElements: { selectors: ['p', 'h2', 'span'] },
    };
    const descriptionText = convert(event.data.results.description, options)
      .trim()
      .slice(0, 100);

    const eventCreatorId = event.data.results.createdBy;
    const {
      data: { results: eventCreator },
    } = await api.get(`/user/${eventCreatorId}`, {
      headers: req?.cookies?.access_token && {
        Authorization: `Bearer ${req?.cookies?.access_token}`,
      },
    });

    return {
      event: event.data.results,
      eventCreator,
      descriptionText,
      listings: listings.data.results,
      settings: settings.data.results.value,
    };
  } catch (err: unknown) {
    console.log('Error', err);
    return {
      error: parseMessageFromError(err),
    };
  }
};

export default EventPage;
