import { FC } from 'react';

interface Props {
  progress: number;
  total: number;
  icon?: string;
}

const Progress: FC<Props> = ({ progress, total, icon }) => {
  const steps = Array.from({ length: total }, (_, i) => i + 1);
  return (
    <div className="flex items-end space-between w-full">
      {steps.map((step) => (
        <div key={step} className="flex-1 text-center text-4xl ">
          {step <= progress && icon && <div className="py-1">{icon}</div>}
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
