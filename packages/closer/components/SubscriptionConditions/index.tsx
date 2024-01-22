import Link from 'next/link';

import { Dispatch, SetStateAction, useEffect, useState } from 'react';

import { __ } from '../../utils/helpers';
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
  const [isInfoModalOpened, setIsInfoModalOpened] = useState(false);

  useEffect(() => {
    if (isSubscriptionsTermsChecked) {
      setHasAcceptedConditions(true);
    } else {
      setHasAcceptedConditions(false);
    }
  }, [isSubscriptionsTermsChecked]);

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
        id="isSubscriptionsTermsChecked"
        onChange={() =>
          setIsSubscriptionsTermsChecked(!isSubscriptionsTermsChecked)
        }
      >
        {__('subscriptions_checkout_comply_with')}{' '}
        <Link
          href="/legal/terms"
          className="text-primary underline"
          target="_blank"
        >
          {__('subscriptions_checkout_subscription_terms')}
        </Link>
      </Checkbox>
    </>
  );
};

export default SubscriptionConditions;
