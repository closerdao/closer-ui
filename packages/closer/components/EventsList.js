import React, { useEffect, useMemo, useState } from 'react';

import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';

import { usePlatform } from '../contexts/platform';
import { __ } from '../utils/helpers';
import EventPreview from './EventPreview';
import Pagination from './Pagination';

dayjs.extend(advancedFormat);
let renders = 0;

const EventsList = ({
  center,
  card,
  isListView,
  title,
  queryParam,
  where,
  limit,
  showPagination,
}) => {
  renders++;
  const { platform } = usePlatform();
  const [error, setErrors] = useState(false);
  const [page, setPage] = useState(1);

  const eventsFilter = { where, limit, page };
  const events = platform.event.find(eventsFilter);
  const totalEvents = platform.event.findCount(eventsFilter);

  useEffect(() => {
    const loadData = async () => {
      try {
        const load = await platform.event.get(eventsFilter);
      } catch (err) {
        console.log('Load error', err);
        setErrors(err.message);
      }
    };

    loadData();
  }, [where, limit, page]);

  return (
    <div className={card ? 'card' : ''}>
      {error && <p className="text-red-500">{error}</p>}
      {title && <h3 className={card ? 'card-title' : ''}>{title}</h3>}
      <div
        className={`grid gap-8 md:grid-cols-3 md:justify-${
          center ? 'center' : 'start'
        } ${card ? 'event-body' : ''} ${isListView ? 'grid-cols-1' : ''} `}
      >
        {events && events.count() > 0 ? (
          events.map((event) => (
            <EventPreview
              key={event.get('_id')}
              isListView={isListView}
              event={event.toJSON()}
            />
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
  showPagination: true,
  isListView: false,
  card: false,
  queryParam: 'events',
  center: false,
  title: undefined,
};

export default EventsList;
