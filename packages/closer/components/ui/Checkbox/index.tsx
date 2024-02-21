import React from 'react';

interface CheckboxProps {
  className?: string;
  isChecked?: boolean;
  onChange: (value: any) => void;
  children?: React.ReactNode;
  id?: string;
  isEnabled?: boolean;
}
const Checkbox = ({
  className,
  isChecked,
  onChange,
  children,
  id,
  isEnabled = true
}: CheckboxProps) => {
  return (
    <div className={`flex items-top gap-1.5 mb-2 ${className}`}>
      <input
        disabled={!isEnabled}
        id={id}
        type="checkbox"
        className="accent-accent w-4 h-4 mt-1"
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
