import React from 'react';

import { cn } from '../../../utils/cn';

interface CheckboxProps {
  className?: string;
  isChecked?: boolean;
  onChange: (value: any) => void;
  children?: React.ReactNode;
  id?: string;
  isEnabled?: boolean;
}

/**
 * A checkbox with its label beside it. The row hugs its content (`w-fit`) so
 * the box and the words sit together on the left rather than the label being
 * clickable across the whole width of a form or modal.
 */
const Checkbox = ({
  className,
  isChecked,
  onChange,
  children,
  id,
  isEnabled = true,
}: CheckboxProps) => {
  return (
    <div className={cn('flex items-start gap-1.5 mb-2 w-fit', className)}>
      <input
        disabled={!isEnabled}
        id={id}
        type="checkbox"
        className="accent-accent w-4 h-4 mt-1 flex-shrink-0"
        checked={isChecked}
        onChange={onChange}
      />

      <label
        htmlFor={id}
        className="text-base text-complimentary-light normal-case font-medium"
      >
        {children}
      </label>
    </div>
  );
};

export default Checkbox;
