import { useRouter } from 'next/router';
import Progress from './../../Progress';

interface ProgressBarProps {
  steps: string[];
}

const ProgressBar = ({ steps }: ProgressBarProps) => {
  const router = useRouter();

  const currentStep = steps.find((step) =>
    router.pathname
      .split('/')
      [router.pathname.split('/').length - 1].includes(step),
  );
  let currentStepIndex;
  if (currentStep) {
    currentStepIndex = steps.indexOf(currentStep);
  } else {
    currentStepIndex = 0;
  }
  return (
    <Progress
      progress={currentStepIndex + 1}
      total={steps.length}
    />
  );
};

export default ProgressBar;
