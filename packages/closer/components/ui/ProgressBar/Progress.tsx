import { FC } from 'react';

interface Props {
  progress: number;
  total: number;
  icon?: string;
}

const Progress: FC<Props> = ({ progress, total, icon }) => {
  const steps = Array.from({ length: total }, (_, i) => i + 1);
  return (
    <div className="flex items-center space-between w-full">
      {steps.map((step) => (
        <div key={step} className="flex-1 text-center">
          {step <= progress && icon && icon}
          <div
            className={`h-1 rounded-xl mr-1 ${
              step <= progress ? 'bg-accent' : 'bg-neutral-dark '
            }`}
          />
        </div>
      ))}
    </div>
  );
};

export default Progress;
