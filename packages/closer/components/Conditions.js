import { useEffect, useState } from 'react';

import PropTypes from 'prop-types';

import { useAuth } from '../contexts/auth';
import { __ } from '../utils/helpers';
import Checkbox from './Checkbox';
import Modal from './Modal';


// TODO: fix visitors guide link
const Conditions = ({ setComply, visitorsGuide }) => {
  const { user } = useAuth();
  const isMember = user?.roles.includes('member');

  const [isVisitorsGuideChecked, setIsVisitorsGuideChecked] = useState(false);
  const [isCancellationPolicyChecked, setIsCancellationPolicyChecked] =
    useState(false);
  const [isInfoModalOpened, setIsInfoModalOpened] = useState(false);

  useEffect(() => {
    if (isVisitorsGuideChecked && isCancellationPolicyChecked) {
      setComply(true);
    } else {
      setComply(false);
    }
  }, [isVisitorsGuideChecked, isCancellationPolicyChecked]);

  const stopPropagation = (event) => {
    event.stopPropagation();
  };

  const openModal = (event) => {
    event.preventDefault();
    setIsInfoModalOpened(true);
  };

  const closeModal = (event) => {
    event.preventDefault();
    setIsInfoModalOpened(false);
  };

  return (
    <div className="mt-8" onClick={stopPropagation}>
      <Checkbox
        checked={isVisitorsGuideChecked}
        onChange={() => setIsVisitorsGuideChecked(!isVisitorsGuideChecked)}
        className="mb-4"
      >
        <p>
          <span>{__('bookings_checkout_step_comply_with')}</span>
          <a
            className="border-b pb-1 border-neutral-400 border-dashed"
            href={visitorsGuide}
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
            onClick={openModal}
          >
            {__('bookings_checkout_step_cancellation_policy')}
          </button>
        </p>
      </Checkbox>
      {isInfoModalOpened && (
        <Modal closeModal={closeModal}>
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

Conditions.propTypes = {
  setComply: PropTypes.func,
  visitorsGuide: PropTypes.string,
};

export default Conditions;
