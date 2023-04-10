import React from 'react';

interface CheckboxProps {
  className?: string;
  isChecked?: boolean;
  onChange: () => void;
  children?: React.ReactNode;
  id?: string;
}
const Checkbox = ({
  className,
  isChecked,
  onChange,
  children,
  id,
}: CheckboxProps) => {
  return (
    <div className={`flex items-top gap-3 w-full ${className}`}>
      <input
        id={id}
        type="checkbox"
        className="accent-primary w-4 h-4 mt-4"
        checked={isChecked}
        onChange={onChange}
      />

      <label
        htmlFor={id}
        className="text-base text-complimentary normal-case font-medium"
      >
        {children}
      </label>
    </div>
  );
};

export default Checkbox;
