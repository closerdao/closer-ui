import Link from 'next/link';

import React from 'react';

import dayjs from 'dayjs';

import ProfilePhoto from './ProfilePhoto';
const TicketCounter = ({ count }) => count > 0 && (
  <div className="z-10 w-9 h-9 inline-flex justify-center items-center text-center rounded-full overflow-hidden bg-black text-white text-sm">
    +{Math.min(count, 99)}
  </div>
);

const EventAttendees = ({ user, event, start, attendees, platform, ticketsCount }) => {
  return (
    <section className="attendees card-body mb-6">
      <h3 className="text-2xl font-bold">
        {start && start.isAfter(dayjs()) ? 'Who\'s coming?' : 'Who attended?'}
      </h3>
      {event.ticketOptions ? (
        <div className="-space-x-3 flex flex-row flex-wrap">
          {Array.from(new Set(attendees)).map((_id) => {
            const attendee = platform.user.findOne(_id);

            if (!attendee) {
              return null;
            }

            return (
              <Link
                key={attendee.get('_id')}
                as={`/members/${attendee.get('slug')}`}
                href="/members/[slug]"
                className="from user-preview z-10">

                <ProfilePhoto size="sm" user={attendee.toJS()} />

              </Link>
            );
          })}
          { ticketsCount && <TicketCounter count={ ticketsCount } /> }
        </div>
      ) : platform && attendees.length > 0 ? (
        <div>
          {attendees.map((uid) => {
            const attendee = platform.user.findOne(uid);

            if (!attendee) {
              return null;
            }

            return (
              (<Link
                key={uid}
                as={`/members/${attendee.get('slug')}`}
                href="/members/[slug]"
                className="from user-preview">

                <ProfilePhoto size="sm" user={attendee.toJS()} />
                <span className="name">{attendee.get('screenname')}</span>

              </Link>)
            );
          })}
          { ticketsCount && <TicketCounter count={ ticketsCount } /> }
        </div>
      ) : (
        'No results'
      )}
    </section>
  );
};

export default EventAttendees;
