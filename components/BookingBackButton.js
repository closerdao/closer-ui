// import all the required components
import { useRouter } from 'next/router';

import { useBookingState } from '../contexts/booking';
// import the required components from the library
import { __ } from '../utils/helpers';

export const BookingBackButton = () => {
  const router = useRouter();
  const { steps } = useBookingState();
  const { pathname } = useRouter();
  const currentStep = steps.find((step) => step.path === pathname);
  const currentStepIndex = steps.indexOf(currentStep);
  const previousStepPath = steps[currentStepIndex - 1]?.path;

  if (!previousStepPath) {
    return null;
  }

  const handleBack = () => {
    router.push(previousStepPath);
  };

  return <button onClick={handleBack}>{__('buttons_back')}</button>;
};
