import { useEffect, useMemo, useState } from 'react';

import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import { useTranslations } from 'next-intl';

import { usePlatform } from '../contexts/platform';
import EventPreview from './EventPreview';
import Pagination from './Pagination';

dayjs.extend(advancedFormat);
const now = new Date();

const EventsList = ({
  center,
  card,
  isListView,
  title,
  queryParam,
  where,
  limit,
  showPagination,
  cols,
  sort_by='-created',
}) => {
  const t = useTranslations();
  const { platform } = usePlatform();
  const [error, setErrors] = useState(false);
  const [page, setPage] = useState(1);

  const eventsFilter = useMemo(
    () => ({ where, limit, page, sort_by }),
    [where, limit, page],
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

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className={card ? 'card max-w-6xl' : 'max-w-6xl'}>
      {error && <p className="text-red-500">{error}</p>}
      {title && <h3 className={card ? 'card-title' : ''}>{title}</h3>}
      {events && events.count() > 0 ? (
        <div
          className={`grid gap-6 md:gap-8 ${cols === 2 ? 'md:grid-cols-2' : cols === 3 ? 'md:grid-cols-3' : 'md:grid-cols-3'} ${center ? 'md:justify-center' : 'md:justify-start'} ${card ? 'event-body' : ''} ${isListView ? 'grid-cols-1' : ''}`}
        >
          {events.map((event) => (
            <EventPreview
              key={event.get('_id')}
              isListView={isListView}
              event={event.toJSON()}
            />
          ))}
        </div>
      ) : (
        <div className="w-full h-full text-center p-12">
          <p className="italic">{t('events_list_no_events')}</p>
        </div>
      )}
      {showPagination && (
        <Pagination
          loadPage={(page) => {
            setPage(page);
            loadData();
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
EventsList.defaultProps = {
  showPagination: true,
  isListView: false,
  cols: 3,
  card: false,
  queryParam: 'events',
  center: false,
  title: undefined,
};

export default EventsList;
