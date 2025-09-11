import Link from 'next/link';

import React from 'react';

import dayjs from 'dayjs';
import { useTranslations } from 'next-intl';

import ProfilePhoto from './ProfilePhoto';

const TicketCounter = ({ count }) => (
  <div className="z-10 w-7 h-7 inline-flex justify-center items-center text-center rounded-full overflow-hidden bg-black text-white text-xs">
    +{Math.min(count, 99)}
  </div>
);

const EventAttendees = ({
  event,
  start,
  attendees,
  platform,
  ticketsCount,
}) => {
  const t = useTranslations();
  
  const MAX_PREVIEW_ATTENDEES = 1;
  const uniqueAttendees = Array.from(new Set(attendees));
  const showPreview = uniqueAttendees.length > MAX_PREVIEW_ATTENDEES;
  const previewAttendees = showPreview ? uniqueAttendees.slice(0, MAX_PREVIEW_ATTENDEES) : uniqueAttendees;
  const remainingCount = uniqueAttendees.length - MAX_PREVIEW_ATTENDEES;
  
  return (
    <section className="attendees">
      <h4 className="text-md font-bold mb-3">
        {start && start.isAfter(dayjs()) ? t('events_attendees_coming') : t('events_attendees_attended')}
      </h4>
      <div className="-space-x-2 flex flex-row flex-wrap">
        {event.ticketOptions ? (
          <>
            {previewAttendees.map((_id) => {
              const attendee = platform.user.findOne(_id);

              if (!attendee) {
                return null;
              }

              return (
                <Link
                  key={attendee.get('_id')}
                  as={`/members/${attendee.get('slug')}`}
                  href="/members/[slug]"
                  className="from user-preview z-10"
                >
                  <ProfilePhoto size="8" user={attendee.toJS()} />
                </Link>
              );
            })}
            {ticketsCount > 0 && <TicketCounter count={ticketsCount} />}
          </>
        ) : platform && attendees.length > 0 ? (
          <>
            {previewAttendees.map((uid) => {
              const attendee = platform.user.findOne(uid);

              if (!attendee) {
                return null;
              }

              return (
                <Link
                  key={uid}
                  as={`/members/${attendee.get('slug')}`}
                  href="/members/[slug]"
                  className="from user-preview"
                >
                  <ProfilePhoto size="sm" user={attendee.toJS()} />
                  <span className="name text-sm">{attendee.get('screenname')}</span>
                </Link>
              );
            })}
            {ticketsCount > 0 && <TicketCounter count={ticketsCount} />}
          </>
        ) : (
          t('events_attendees_no_results')
        )}

        {showPreview && (
          <div className="pl-4">
              <span className="text-xs text-gray-600 font-medium">
                {t('events_attendees_and_others', { count: remainingCount })}
              </span>
          </div>
        )}
      </div>
    </section>
  );
};

export default EventAttendees;
