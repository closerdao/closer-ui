import React, {
  ChangeEvent,
  Dispatch,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from 'react';

import { VariantProps, cva } from 'class-variance-authority';
import { useTranslations } from 'next-intl';
import { twMerge } from 'tailwind-merge';

const inputStyles = cva('new-input px-4 py-3 rounded-lg', {
  variants: {
    isDisabled: {
      true: 'text-gray-300 border-gray-300 cursor-not-allowed',
      false: 'text-complimentary-core',
    },
    isValid: {
      true: 'border-neutral bg-neutral',
      false: 'border-accent border bg-accent-light',
    },
  },

  defaultVariants: {
    isDisabled: false,
    isValid: true,
  },
});

interface InputProps extends VariantProps<typeof inputStyles> {
  id?: string;
  label?: string;
  value?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  type?: 'text' | 'password' | 'time' | 'number';
  isRequired?: boolean;
  placeholder?: string;
  successMessage?: string;
  className?: string;
  autoFocus?: boolean;
  dataTestId?: string;
  validation?: 'email' | 'number' | 'phone' | 'url';
  isDisabled?: boolean;
  isInstantSave?: boolean;
  hasSaved?: boolean;
  setHasSaved?: Dispatch<SetStateAction<boolean>>;
}

const Input = React.memo(
  ({
    id,
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
    successMessage,
    isDisabled = false,
    isInstantSave = false,
    hasSaved,
    setHasSaved,
  }: InputProps) => {
    const t = useTranslations();

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
      phone:
        /^\s*(?:\+?(\d{1,3}))?[-. (]*(\d{3})[-. )]*(\d{3})[-. ]*(\d{4})(?: *x(\d+))?\s*$/i,
    } as Record<string, RegExp>;

    const isValidValue = (value: string) => {
      if (validation) {
        const pattern = validationPatterns[validation];
        if (pattern) {
          return !!pattern.test(value);
        }
      }
      return true;
    };

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
      const newValue = event.target.value;
      setLocalValue(newValue);
      setIsValid(isValidValue(newValue));
      if (onChange) {
        onChange(newValue as any);
      }
    };

    useEffect(() => {
      if (value) {
        setIsValid(isValidValue(value));
      }
    }, [value]);

    useEffect(() => {
      if (isInstantSave && hasSaved) {
        setTimeout(() => {
          if (setHasSaved) {
            setHasSaved(false);
          }
        }, 2000);
      }
    }, [hasSaved]);

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

    const handleFocus = () => {
      setIsEditing(true);
    };

    const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
      onBlur && onBlur(event);
      setIsEditing(false);
    };

    const handleSubmit = () => {
      if (onChangeRef.current && isValidValue(localValue)) {
        onChangeRef.current(localValue as any);
        if (inputRef?.current) {
          (inputRef.current as HTMLInputElement).blur();
        }
      }
    };

    const validationError =
      !isValid && validation
        ? `${label} is not a valid ${validation} value.`
        : null;

    return (
      <div className={'flex flex-col gap-4 relative '}>
        {label && (
          <label className="font-medium text-complimentary-light" id={label}>
            {isRequired && '* '}
            {label}
          </label>
        )}
        <div>
          <input
            id={id}
            type={type}
            value={isInstantSave ? localValue : value}
            onChange={isInstantSave ? handleChange : onChange}
            onBlur={isInstantSave ? handleBlur : undefined}
            onFocus={isInstantSave ? handleFocus : undefined}
            required={isRequired}
            placeholder={placeholder}
            className={`
            ${twMerge(inputStyles({ isValid, isDisabled }), className)}
            `}
            data-testid={dataTestId}
            autoFocus={autoFocus}
            aria-label={label}
            aria-required={isRequired}
            aria-invalid={!isValidValue(localValue)}
            ref={inputRef}
            onKeyDown={isInstantSave ? handleKeyDown : undefined}
            pattern={
              validation
                ? validationPatterns[validation].toString().slice(1, -1)
                : undefined
            }
            disabled={isDisabled}
            aria-labelledby={label}
          />

          {isEditing && isInstantSave && isValidValue(localValue) && (
            <div className="text-disabled absolute right-2 top-[52px]">
              {hasSaved && t('settings_saved')}
            </div>
          )}
        </div>

        {validationError ? (
          <span className="text-red-500 text-sm">{validationError}</span>
        ) : successMessage ? (
          <span className="text-green-500 text-sm">{successMessage}</span>
        ) : null}
      </div>
    );
  },
);

export default Input;
