import { useEffect, useMemo, useState } from 'react';

import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import { useTranslations } from 'next-intl';

import { usePlatform } from '../contexts/platform';
import EventPreview from './EventPreview';
import EventStamp from './EventStamp';
import Pagination from './Pagination';

dayjs.extend(advancedFormat);
const now = new Date();

const EventsList = ({
  center = false,
  card = false,
  isListView = false,
  isStampView = false,
  title = /** @type {any} */ (undefined),
  queryParam = 'events',
  where,
  limit,
  showPagination = true,
  cols = 3,
  sort_by='-created',
  emptyLabel = /** @type {any} */ (undefined),
}) => {
  const t = useTranslations();
  const { platform } = usePlatform();
  const [error, setErrors] = useState(false);
  const [page, setPage] = useState(1);

  const eventsFilter = useMemo(
    () => ({ where, limit, page, sort_by }),
    [where, limit, page, sort_by],
  );
  const events = platform.event.find(eventsFilter);
  const totalEvents = platform.event.findCount(eventsFilter);

  if (where && where.end && where.end.$gt && where.end.$gt > now) {
  }

  const loadData = async () => {
    try {
      await platform.event.get(eventsFilter);
    } catch (err) {
      console.log('Load error', err);
      setErrors(err.message);
    }
  };

  // Keyed on the serialized filter rather than its identity: callers build
  // `where` as a literal, and a caller that resolves part of it asynchronously
  // (the profile page, which adds attended event ids) needs a refetch.
  const filterKey = JSON.stringify(eventsFilter);
  useEffect(() => {
    loadData();
  }, [filterKey]);

  const gridClasses = isStampView
    ? 'flex flex-wrap gap-4 py-2'
    : isListView
      ? 'flex flex-col gap-2'
      : `grid gap-6 md:gap-8 ${cols === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'} ${center ? 'md:justify-center' : 'md:justify-start'} ${card ? 'event-body' : ''}`;

  return (
    <div className={card ? 'card max-w-6xl' : isListView ? '' : 'max-w-6xl'}>
      {error && <p className="text-red-500">{error}</p>}
      {title && <h3 className={card ? 'card-title' : ''}>{title}</h3>}
      {events && events.count() > 0 ? (
        <div className={gridClasses}>
          {events.map((event) =>
            isStampView ? (
              <EventStamp key={event.get('_id')} event={event.toJSON()} />
            ) : (
              <EventPreview
                key={event.get('_id')}
                isListView={isListView}
                event={event.toJSON()}
              />
            ),
          )}
        </div>
      ) : (
        <div className={`w-full text-center ${isListView ? 'py-6' : 'p-12'}`}>
          <p className="italic text-sm text-gray-500">
            {emptyLabel || t('events_list_no_events')}
          </p>
        </div>
      )}
      {showPagination && (
        <Pagination
          loadPage={(page) => {
            // The filter effect picks the new page up; calling loadData here
            // would fetch the page we are leaving.
            setPage(page);
          }}
          page={page}
          queryParam={queryParam}
          limit={limit}
          total={totalEvents}
          items={events}
        />
      )}
    </div>
  );
};
export default EventsList;
