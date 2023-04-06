import React, { FC } from 'react';

interface Props {
  progress: number;
  total: number;
}

const Progress: FC<Props> = ({ progress, total }) => {
  const steps = Array.from({ length: total }, (_, i) => i + 1);
  return (
    <div className="flex items-center space-between">
      {steps.map((step) => (
        <div
          key={step}
          className={`flex-1 h-1 border border-solid rounded-xl mr-1 ${
            step <= progress
              ? 'bg-accent-core border-accent-core'
              : 'bg-neutral-300 border-neutral-300'
          }`}
        />
      ))}
    </div>
  );
};

export default Progress;
