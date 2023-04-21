import { ChangeEvent } from 'react';

import Information from '@/../../packages/closer/components/ui/Information';

type InputProps = {
  label?: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  type: 'text' | 'password';
  isRequired?: boolean;
  placeholder?: string;
  className?: string;
  information?: string;
  id?: string;
};

const Input = ({
  label,
  value,
  onChange,
  type,
  isRequired,
  placeholder,
  className,
  information,
  id
}: InputProps) => {
  return (
    <div className={`w-full mb-10 ${className || ''}`}>
      {label && <label className="mb-2">{label}</label>}
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        required={isRequired}
        placeholder={placeholder}
        className='bg-neutral-dark rounded-md '
      />
      {information && <Information>{information}</Information>}
    </div>
  );
};

export default Input;
