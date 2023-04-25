import { useRouter } from 'next/router';

import React from 'react';

import Progress from './Progress';

interface ProgressBarProps {
  steps: string[];
}

const ProgressBar = ({ steps }: ProgressBarProps) => {
  const router = useRouter();
  const currentStep = steps.find((step) => router.pathname.includes(step));
  const currentStepIndex = steps.indexOf(currentStep || '');
  return <Progress progress={currentStepIndex + 1} total={steps.length} />;
};

export default ProgressBar;
