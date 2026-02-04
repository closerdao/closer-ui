import { useRouter } from 'next/router';

import Progress from './Progress';

interface ProgressBarProps {
  steps: string[];
  stepHrefs?: (string | null)[];
}

const ProgressBar = ({ steps, stepHrefs }: ProgressBarProps) => {
  const router = useRouter();
  const pathSegments = router.pathname.split('/');
  const lastSegment = pathSegments[pathSegments.length - 1] ?? '';

  const currentStep = steps.find((step) => lastSegment.includes(step));
  const currentStepIndex = currentStep ? steps.indexOf(currentStep) : 0;

  return (
    <Progress
      progress={currentStepIndex + 1}
      total={steps.length}
      stepIds={steps}
      stepHrefs={stepHrefs}
    />
  );
};

export default ProgressBar;
