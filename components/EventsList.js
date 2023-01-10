import React, { useEffect, useMemo, useState } from 'react';

import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';

import { useAuth } from '../contexts/auth';
import { usePlatform } from '../contexts/platform';
import { __ } from '../utils/helpers';
import EventPreview from './EventPreview';
import Pagination from './Pagination';

dayjs.extend(advancedFormat);

const EventsList = ({
  center,
  card,
  list,
  title,
  queryParam,
  where,
  limit,
  showPagination,
}) => {
  const { user } = useAuth();
  const { platform } = usePlatform();
  const [error, setErrors] = useState(false);
  const [page, setPage] = useState(1);

  const eventsFilter = useMemo(
    () => ({ where, limit, page }),
    [where, limit, page],
  );
  const events = platform.event.find(eventsFilter);
  const totalEvents = platform.event.findCount(eventsFilter);

  const loadData = async () => {
    try {
      await Promise.all([
        platform.event.get(eventsFilter),
        platform.event.getCount(eventsFilter),
      ]);
    } catch (err) {
      console.log('Load error', err);
      setErrors(err.message);
    }
  };

  useEffect(() => {
    loadData();
  }, [eventsFilter, user]);

  return (
    <div className={card ? 'card' : ''}>
      {error && <p className="text-red-500">{error}</p>}
      {title && <h3 className={card ? 'card-title' : ''}>{title}</h3>}
      <div
        className={`event-list ${card ? 'event-body' : ''} flex ${
          list ? 'flex-col' : 'flex-row'
        } flex-wrap justify-${center ? 'center' : 'start'}`}
      >
        {events && events.count() > 0 ? (
          events.map((event) => (
            <EventPreview key={event.get('_id')} list={list} event={event} />
          ))
        ) : (
          <div className="w-full py-4">
            <p className="italic">{__('events_list_no_events')}</p>
          </div>
        )}
      </div>
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
  where: undefined,
  showPagination: true,
  list: false,
  card: false,
  queryParam: 'events',
};

export default EventsList;
