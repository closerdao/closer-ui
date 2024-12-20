import Countdown from 'react-countdown';

import PropTypes from 'prop-types';
import { useTranslations } from 'next-intl';

const TimeCountdown = ({ date, onComplete }) => {
  const t = useTranslations();

  const renderer = ({ days, hours, minutes, seconds }) => {
    return (
      <div className="flex gap-4 md:gap-10">
        <div className="flex flex-col items-center w-24">
          <p className="font-black text-4xl md:text-6xl text-accent">{days}</p>
          <p className="text-2xl leading-8 font-bold">{t('countdown_days')}</p>
        </div>
        <div className="flex flex-col items-center w-24">
          <p className="font-black text-4xl md:text-6xl text-accent">{hours}</p>
          <p className="text-2xl leading-8 font-bold">{t('countdown_hours')}</p>
        </div>
        <div className="flex flex-col items-center w-24">
          <p className="font-black text-4xl md:text-6xl text-accent">
            {minutes}
          </p>
          <p className="text-2xl leading-8 font-bold">
            {t('countdown_minutes')}
          </p>
        </div>
        <div className="flex flex-col items-center w-24">
          <p className="font-black text-4xl md:text-6xl text-accent">
            {seconds}
          </p>
          <p className="text-2xl leading-8 font-bold">
            {t('countdown_seconds')}
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
