import React, { ChangeEvent, useRef, useState } from 'react';

import { CheckIcon } from '../../icons/CheckIcon';
import { SettingsIcon } from '../../icons/SettingsIcon';

type InputProps = {
  label?: string;
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: (event: ChangeEvent<HTMLInputElement>) => void;
  type?: 'text' | 'password';
  isRequired?: boolean;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  dataTestId?: string;
  validation?: 'email' | 'number';
};

const Input = React.memo(
  ({
    label,
    value,
    onChange,
    type = 'text',
    isRequired,
    placeholder = 'Enter text',
    className,
    dataTestId,
    autoFocus,
    onBlur,
    validation,
  }: InputProps) => {
    const [localValue, setLocalValue] = useState(value || '');
    const [isEditing, setIsEditing] = useState(false);
    const [isValid, setIsValid] = useState(true);

    const inputRef = useRef(null);
    const onChangeRef = useRef(onChange);

    if (onChange !== onChangeRef.current) {
      onChangeRef.current = onChange; // prevents re-renders when parent component re-renders with the same props
    }

    const validationPatterns = {
      email: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
    } as Record<string, RegExp>;

    const isValidValue = (value: string) => {
      if (validation) {
        const pattern = validationPatterns[validation];
        if (pattern) {
          return pattern.test(value);
        }
      }
      return true;
    };

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
      const newValue = event.target.value;
      setLocalValue(newValue);
      if (isValidValue(newValue)) {
        setIsValid(true);
      } else {
        setIsValid(false);
      }
    };

    const handleClick = () => {
      setIsEditing(true);
      if (inputRef?.current) {
        (inputRef.current as HTMLInputElement).focus();
      }
    };

    const handleSubmit = () => {
      if (onChangeRef.current && isValidValue(localValue)) {
        onChangeRef.current(localValue);
        setIsEditing(false);
        if (inputRef?.current) {
          (inputRef.current as HTMLInputElement).blur();
        }
      }
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        event.stopPropagation();
        handleSubmit();
        if (inputRef?.current) {
          (inputRef.current as HTMLInputElement).blur();
        }
      }
    };

    const validationError =
      !isValid && validation
        ? `${label} is not a valid ${validation} value.`
        : null;

    console.log(
      'isValid',
      isValid,
      'validation',
      validation,
      ' !isValid && validation',
      !isValid && validation,
    );

    return (
      <div className={`flex flex-col gap-4 relative ${className}`}>
        <label className="font-medium text-complimentary-light">{label}</label>
        <input
          type={type}
          value={localValue}
          onChange={handleChange}
          onBlur={onBlur}
          required={isRequired}
          placeholder={placeholder}
          className={`rounded-lg bg-neutral text-complimentary-core ${
            isValid ? '' : 'border-red-500'
          } `}
          data-testid={dataTestId}
          autoFocus={autoFocus}
          aria-label={label}
          aria-required={isRequired}
          aria-invalid={!isValidValue(localValue)}
          ref={inputRef}
          onKeyDown={handleKeyDown}
          pattern={
            validation
              ? validationPatterns[validation].toString().slice(1, -1)
              : undefined
          }
        />
        {isEditing ? (
          <CheckIcon
            onClick={handleSubmit}
            className="absolute right-4 bottom-2"
          />
        ) : (
          <SettingsIcon
            className="absolute right-4 bottom-2"
            onClick={handleClick}
          />
        )}
        {validationError && (
          <span className="text-red-500 text-sm">{validationError}</span>
        )}
      </div>
    );
  },
);

export default Input;
