import { ChangeEvent } from 'react';
import Information from '@/../../packages/closer/components/ui/Information';

type InputProps = {
  label?: string;
  value: string;
  changeHandler: (event: ChangeEvent<HTMLInputElement>) => void;
  type: 'text' | 'password';
  required?: boolean;
  placeholder?: string;
  className?: string;
  information?: string;
};

const Input = ({
  label,
  value,
  changeHandler,
  type,
  required,
  placeholder,
  className,
  information
}: InputProps) => {
  return (
    <div className='w-full mb-10'>
      <label className='mb-2'>{label}</label>
      <input
        type={type}
        value={value}
        onChange={changeHandler}
        required={required}
        placeholder={placeholder}
        className={className}
      />
      {information && <Information>{information}</Information>}
      
    </div>
  );
};

export default Input;
