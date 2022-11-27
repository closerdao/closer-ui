import { useRouter } from 'next/router';

import { useBookingState } from '../contexts/booking';
import { __ } from '../utils/helpers';

export const BookingBackButton = ({ url }) => {
  const router = useRouter();
  const { steps } = useBookingState();
  const { pathname } = useRouter();
  const currentStep = steps.find((step) => step.path === pathname);
  const currentStepIndex = steps.indexOf(currentStep);
  const previousStepPath = steps[currentStepIndex - 1]?.path;

  const handleBack = () => {
    router.push(url ? url : previousStepPath);
  };

  if (url) {
    return (
      <button onClick={handleBack}>
        <span>{__('buttons_back_to')}</span>
        <span className="capitalize">{url.slice(1)}</span>
      </button>
    );
  }

  if (!previousStepPath) {
    return null;
  }

  return <button onClick={handleBack}>{__('buttons_back')}</button>;
};
