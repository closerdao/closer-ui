import { useRouter } from 'next/router';
import { useTranslations } from 'next-intl';

import Progress from './Progress';

interface ProgressBarProps {
  steps: string[];
  stepHrefs?: (string | null)[];
  stepTitleKeys?: string[];
}

const ProgressBar = ({ steps, stepHrefs, stepTitleKeys }: ProgressBarProps) => {
  const router = useRouter();
  const t = useTranslations();
  const pathSegments = router.pathname.split('/');
  const lastSegment = pathSegments[pathSegments.length - 1] ?? '';

  const currentStep = steps.find((step) => lastSegment.includes(step));
  const currentStepIndex = currentStep ? steps.indexOf(currentStep) : 0;

  const stepTitles = stepTitleKeys?.map((key) => t(key));

  return (
    <Progress
      progress={currentStepIndex + 1}
      total={steps.length}
      stepIds={steps}
      stepHrefs={stepHrefs}
      stepTitles={stepTitles}
    />
  );
};

export default ProgressBar;
