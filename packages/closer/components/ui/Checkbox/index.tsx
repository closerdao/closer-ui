import React from 'react';

interface CheckboxProps {
  className?: string;
  label?: string;
  checked: boolean;
  changeHandler: () => void;
}
const Checkbox = ({
  className,
  label,
  checked,
  changeHandler,
}: CheckboxProps) => {
  return (
    <div className={`flex items-center gap-3 w-full  ${className}`}>

      <input
        type="checkbox"
        className="w-4 h-4 bg-neutral rounded-full border-neutral-400 checked:text-slate-600"
        checked={checked}
        onChange={changeHandler}
      />

      <label className="text-base font-normal text-complimentary normal-case pt-[6px]">
        {label}
      </label>
    </div>
  );
};

export default Checkbox;
