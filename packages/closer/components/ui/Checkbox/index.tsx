import React from 'react';

interface CheckboxProps {
  className?: string;
  checked?: boolean;
  changeHandler: () => void;
  children?: React.ReactNode;
  id?: string;
}
const Checkbox = ({
  className,
  checked,
  changeHandler,
  children,
  id,
}: CheckboxProps) => {
  return (
    <div className={`flex items-top gap-3 w-full ${className}`}>
      <input
        id={id}
        type="checkbox"
        className="accent-primary w-[16px] h-[16px] mt-[6px]"
        checked={checked}
        onChange={changeHandler}
      />

      <label
        htmlFor={id}
        className="text-[1rem] text-complimentary"
      >
        {children}
      </label>
    </div>
  );
};

export default Checkbox;
