import Link from 'next/link';

import { FC } from 'react';

import dayjs from 'dayjs';

import { Event } from '../../types';
import { cdn } from '../../utils/api';

interface EventStampProps {
  event: Event;
}

/**
 * A passport-style stamp for an event someone attended. Each stamp is rotated
 * by a small amount derived from its id, so a row of them looks hand stamped
 * rather than gridded — and stays put across renders instead of jittering.
 */
const rotationFor = (seed: string) => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 1000;
  }
  // -8deg .. +8deg
  return (hash % 17) - 8;
};

const EventStamp: FC<EventStampProps> = ({ event }) => {
  const { _id, name, slug, photo, start } = event || {};
  const startDate = dayjs(start);

  return (
    <Link
      href={`/events/${slug}`}
      title={`${name} — ${startDate.format('D MMMM YYYY')}`}
      className="group block shrink-0"
      style={{ transform: `rotate(${rotationFor(_id || slug || name)}deg)` }}
    >
      <div className="w-24 h-24 rounded-full border-2 border-accent/70 border-dashed p-1 transition-transform group-hover:scale-105">
        <div className="w-full h-full rounded-full border border-accent/40 overflow-hidden flex flex-col items-center justify-center text-center bg-accent-light relative">
          {photo ? (
            <img
              src={`${cdn}${photo}-place-lg.jpg`}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover opacity-25"
            />
          ) : null}
          <span className="relative px-1 text-[10px] font-semibold uppercase leading-tight line-clamp-3 text-accent">
            {name}
          </span>
          <span className="relative text-[10px] font-bold text-accent/80">
            {startDate.format('MMM YYYY')}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default EventStamp;
