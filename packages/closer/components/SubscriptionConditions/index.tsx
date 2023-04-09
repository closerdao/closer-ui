import { Dispatch, SetStateAction, useEffect, useState } from 'react';

import { __ } from 'closer/utils/helpers';

import Modal from '../Modal';
import Checkbox from '../ui/Checkbox';

interface SubscriptionConditionsProps {
  setHasAcceptedConditions: Dispatch<SetStateAction<boolean>>;
}

const SubscriptionConditions = ({
  setHasAcceptedConditions,
}: SubscriptionConditionsProps) => {
  const [isSubscriptionsTermsChecked, setIsSubscriptionsTermsChecked] =
    useState(false);
  const [isSaveCardChecked, setIsSaveCardChecked] = useState(false);
  const [isInfoModalOpened, setIsInfoModalOpened] = useState(false);

  useEffect(() => {
    if (isSubscriptionsTermsChecked && isSaveCardChecked) {
      setHasAcceptedConditions(true);
    } else {
      setHasAcceptedConditions(false);
    }
  }, [isSubscriptionsTermsChecked, isSaveCardChecked]);

  const openModal = () => {
    setIsInfoModalOpened(true);
  };

  const closeModal = () => {
    setIsInfoModalOpened(false);
  };

  return (
    <>
      {isInfoModalOpened && (
        <Modal closeModal={closeModal}>
          <div>
            <p className="step-title mb-8">
              {__('subscriptions_terms_full_text')}
            </p>
          </div>
        </Modal>
      )}
      <Checkbox
        id="isSaveCardChecked"
        onChange={() => setIsSaveCardChecked(!isSaveCardChecked)}
      >
        {__('subscriptions_checkout_save_card_for_later')}
      </Checkbox>
      <Checkbox
        id="isSubscriptionsTermsChecked"
        onChange={() =>
          setIsSubscriptionsTermsChecked(!isSubscriptionsTermsChecked)
        }
      >
        {__('subscriptions_checkout_comply_with')}{' '}
        <button className="text-primary underline" onClick={openModal}>
          {__('subscriptions_checkout_subscription_terms')}
        </button>
      </Checkbox>
    </>
  );
};

export default SubscriptionConditions;
