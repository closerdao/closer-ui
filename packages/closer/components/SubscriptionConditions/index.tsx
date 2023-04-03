import {
  Dispatch,
  MouseEvent,
  SetStateAction,
  useEffect,
  useState,
} from 'react';

import { __ } from '../../utils/helpers';
import Modal from '../Modal';
import Checkbox from '../ui/Checkbox';

interface SubscriptionConditionsProps {
  setComply: Dispatch<SetStateAction<boolean>>;
}

const SubscriptionConditions = ({ setComply }: SubscriptionConditionsProps) => {
  const [isSubscriptionsTermsChecked, setIsSubscriptionsTermsChecked] =
    useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [isInfoModalOpened, setIsInfoModalOpened] = useState(false);

  useEffect(() => {
    if (isSubscriptionsTermsChecked && isChecked) {
      setComply(true);
    } else {
      setComply(false);
    }
  }, [isSubscriptionsTermsChecked, isChecked]);

  const openModal = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setIsInfoModalOpened(true);
  };

  const closeModal = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
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
      <Checkbox id="isChecked" changeHandler={() => setIsChecked(!isChecked)}>
        {__('subscriptions_checkout_comply_with')}{' '}
        <button className="text-primary underline" onClick={openModal}>
          {' '}
          {__('subscriptions_checkout_subscription_terms')}
        </button>
      </Checkbox>
      <Checkbox
        id="isSubscriptionsTermsChecked"
        changeHandler={() =>
          setIsSubscriptionsTermsChecked(!isSubscriptionsTermsChecked)
        }
      >
        {__('subscriptions_checkout_comply_with')} something else
      </Checkbox>
    </>
  );
};

export default SubscriptionConditions;
