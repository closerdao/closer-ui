import { useRouter } from 'next/router';

import { BOOKING_STEPS } from '../constants';
import Progress from './Progress';

const BookingProgress = () => {
  const router = useRouter();
  const currentStep = BOOKING_STEPS.find((step) =>
    router.pathname.includes(step),
  );
  const currentStepIndex = BOOKING_STEPS.indexOf(currentStep);
  return (
    <Progress progress={currentStepIndex + 1} total={BOOKING_STEPS.length} />
  );
};

export default BookingProgress;
