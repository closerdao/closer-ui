import { useRouter } from 'next/router';

import { useBookingState } from '../contexts/booking';
import Progress from './Progress';

const BookingProgress = () => {
  const { steps } = useBookingState();
  const router = useRouter();
  const currentStep = steps.find((step) => router.pathname.includes(step));
  const currentStepIndex = steps.indexOf(currentStep);
  return <Progress progress={currentStepIndex + 1} total={steps.length} />;
};

export default BookingProgress;
