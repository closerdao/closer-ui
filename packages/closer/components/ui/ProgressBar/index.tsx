import { useRouter } from 'next/router';

import { SUBSCRIPTION_STEPS } from '../../../constants';
import Progress from './../../Progress';

const ProgressBar = () => {
  const router = useRouter();
  console.log('router.pathname', router.pathname);

  const currentStep = SUBSCRIPTION_STEPS.find((step) =>
    router.pathname
      .split('/')
      [router.pathname.split('/').length - 1].includes(step),
  );

  console.log('currentStep', currentStep);
  let currentStepIndex;
  if (currentStep) {
    currentStepIndex = SUBSCRIPTION_STEPS.indexOf(currentStep);
  } else {
    currentStepIndex = 0;
  }
  console.log('currentStepIndex', currentStepIndex);
  return (
    <Progress
      progress={currentStepIndex + 1}
      total={SUBSCRIPTION_STEPS.length}
    />
  );
};

export default ProgressBar;
