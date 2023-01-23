import Countdown from 'react-countdown';

import PropTypes from 'prop-types';

import { __ } from '../utils/helpers';

const TimeCountdown = ({ date, onComplete }) => {
  const renderer = ({ days, hours, minutes, seconds }) => {
    return (
      <div className="flex gap-10">
        <div className="flex flex-col items-center w-24">
          <p className="font-black text-6xl text-primary">{days}</p>
          <p className="text-2xl leading-8 font-bold">{__('countdown_days')}</p>
        </div>
        <div className="flex flex-col items-center w-24">
          <p className="font-black text-6xl text-primary">{hours}</p>
          <p className="text-2xl leading-8 font-bold">
            {__('countdown_hours')}
          </p>
        </div>
        <div className="flex flex-col items-center w-24">
          <p className="font-black text-6xl text-primary">{minutes}</p>
          <p className="text-2xl leading-8 font-bold">
            {__('countdown_minutes')}
          </p>
        </div>
        <div className="flex flex-col items-center w-24">
          <p className="font-black text-6xl text-primary">{seconds}</p>
          <p className="text-2xl leading-8 font-bold">
            {__('countdown_seconds')}
          </p>
        </div>
      </div>
    );
  };

  return (
    <Countdown
      daysInHours
      date={date}
      renderer={renderer}
      onComplete={onComplete}
    />
  );
};

TimeCountdown.propTypes = {
  date: PropTypes.instanceOf(Date).isRequired,
  onComplete: PropTypes.func,
};

export default TimeCountdown;
