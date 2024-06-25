import Link from 'next/link';

import { Dispatch, SetStateAction, useEffect, useState } from 'react';

import { useTranslations } from 'next-intl';

import Modal from '../Modal';
import Checkbox from '../ui/Checkbox';

interface SubscriptionConditionsProps {
  setHasAcceptedConditions: Dispatch<SetStateAction<boolean>>;
}

const SubscriptionConditions = ({
  setHasAcceptedConditions,
}: SubscriptionConditionsProps) => {
  const t = useTranslations();
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
              {t('subscriptions_terms_full_text')}
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
        {t('subscriptions_checkout_comply_with')}{' '}
        <Link
          href="/legal/terms"
          className="text-accent underline"
          target="_blank"
        >
          {t('subscriptions_checkout_subscription_terms')}
        </Link>
      </Checkbox>
    </>
  );
};

export default SubscriptionConditions;
