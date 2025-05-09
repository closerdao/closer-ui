import { MouseEvent, useEffect, useState } from 'react';

import { useTranslations } from 'next-intl';
import PropTypes from 'prop-types';

import Checkbox from './Checkbox';
import Modal from './Modal';
import Heading from './ui/Heading';

interface Props {
  setComply: (comply: boolean) => void;
  visitorsGuide: string;
  cancellationPolicy: {
    lastday: number;
    lastweek: number;
    lastmonth: number;
    default: number;
  } | null;
}

const Conditions = ({
  setComply,
  visitorsGuide,
  cancellationPolicy,
}: Props) => {
  const t = useTranslations();

  const [doesUserAcceptTerms, setDoesUserAcceptTerms] = useState(false);
  const [isInfoModalOpened, setIsInfoModalOpened] = useState(false);

  useEffect(() => {
    if (doesUserAcceptTerms) {
      setComply(true);
    } else {
      setComply(false);
    }
  }, [doesUserAcceptTerms]);

  const stopPropagation = (event: MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
  };

  const openModal = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setIsInfoModalOpened(true);
  };

  const closeModal = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setIsInfoModalOpened(false);
  };

  return (
    <div className="mt-8" onClick={stopPropagation}>
      <Checkbox
        checked={doesUserAcceptTerms}
        onChange={() => setDoesUserAcceptTerms(!doesUserAcceptTerms)}
        className="mb-4"
      >
        <p>
          <span>{t('bookings_checkout_step_comply_with')}</span>
          <a
            className="border-b pb-1 border-neutral-400 border-dashed no-underline"
            href={visitorsGuide}
            target="_blank"
            rel="noreferrer noopener"
          >
            {t('bookings_checkout_step_visitors_guide')}
          </a>
          <span className="mx-2">{t('generic_and')}</span>
          <button
            className="border-b pb-1 border-neutral-400 border-dashed"
            onClick={openModal}
          >
            {t('bookings_checkout_step_cancellation_policy')}
          </button>
        </p>
      </Checkbox>

      {isInfoModalOpened && (
        <Modal closeModal={closeModal}>
          <div>
            <Heading className="step-title mb-8">
              {t('bookings_checkout_step_cancellation_policy')}
            </Heading>

            <p>
              {/* TODO: discuss member cancellation policy */}

              {t('booking_cancelation_policy', {
                lastweek: `${(cancellationPolicy?.lastweek || 1) * 100}%`,
                lastmonth: `${(cancellationPolicy?.lastmonth || 1) * 100}%`,
                lastday: `${(cancellationPolicy?.lastday || 1) * 100}%`,
              })}
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
};

Conditions.propTypes = {
  setComply: PropTypes.func,
  visitorsGuide: PropTypes.string,
};

export default Conditions;
