import React from 'react';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const TimeSince = ({ time }) => {
  return <span className="time-from-now">{dayjs(time).fromNow()}</span>;
};

export default TimeSince;
