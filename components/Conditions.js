import { useState } from 'react';

import { useAuth } from '../contexts/auth';
import { useBookingState } from '../contexts/booking';
import { __ } from '../utils/helpers';
import { Checkbox } from './Checkbox';
import { Modal } from './Modal';

export const Conditions = ({ onComply }) => {
  const { user } = useAuth();
  const isMember = user?.roles.includes('member');
  const { settings } = useBookingState();

  const [isVisitorsGuideChecked, setIsVisitorsGuideChecked] = useState(false);
  const [isCancellationPolicyChecked, setIsCancellationPolicyChecked] =
    useState(false);
  const [isInfoModalOpened, setIsInfoModalOpened] = useState(false);

  const checkCompliance = (event) => {
    event.stopPropagation();
    if (isVisitorsGuideChecked && isCancellationPolicyChecked) {
      onComply();
    }
  };

  return (
    <div className="mt-8" onClick={checkCompliance}>
      <Checkbox
        checked={isVisitorsGuideChecked}
        onChange={() => setIsVisitorsGuideChecked(!isVisitorsGuideChecked)}
        className="mb-4"
      >
        <p>
          <span>{__('bookings_checkout_step_comply_with')}</span>
          <a
            className="border-b pb-1 border-neutral-400 border-dashed"
            href={settings?.visitorsGuide}
            target="_blank"
            rel="noreferrer noopener"
          >
            {__('bookings_checkout_step_visitors_guide')}
          </a>
        </p>
      </Checkbox>
      <Checkbox
        checked={isCancellationPolicyChecked}
        onChange={() =>
          setIsCancellationPolicyChecked(!isCancellationPolicyChecked)
        }
      >
        <p>
          <span>{__('bookings_checkout_step_comply_with')}</span>
          <button
            className="border-b pb-1 border-neutral-400 border-dashed"
            onClick={() => setIsInfoModalOpened(true)}
          >
            {__('bookings_checkout_step_cancellation_policy')}
          </button>
        </p>
      </Checkbox>
      {isInfoModalOpened && (
        <Modal closeModal={() => setIsInfoModalOpened(false)}>
          <div>
            <h1 className="step-title mb-8">
              {__('bookings_checkout_step_cancellation_policy')}
            </h1>
            {isMember
              ? __('booking_cancelation_policy_member')
              : __('booking_cancelation_policy')}
          </div>
        </Modal>
      )}
    </div>
  );
};
