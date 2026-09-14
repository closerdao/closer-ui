import React, {
  ChangeEvent,
  Dispatch,
  ReactNode,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from 'react';

import { VariantProps, cva } from 'class-variance-authority';
import { useTranslations } from 'next-intl';
import { twMerge } from 'tailwind-merge';

import {
  FIELD_CONTROL_CLASS,
  FIELD_INVALID_CLASS,
  FIELD_LABEL_CLASS,
} from '../../../constants/formStyles';
import {
  EMAIL_PATTERN,
  PHONE_PATTERN,
} from '../../../utils/validationPatterns';

const inputStyles = cva(FIELD_CONTROL_CLASS, {
  variants: {
    isDisabled: {
      true: 'text-gray-400 !bg-gray-100 cursor-not-allowed',
      false: '',
    },
    isValid: {
      true: '',
      false: FIELD_INVALID_CLASS,
    },
  },

  defaultVariants: {
    isDisabled: false,
    isValid: true,
  },
});

interface InputProps extends VariantProps<typeof inputStyles> {
  id?: string;
  name?: string;
  autoComplete?: string;
  label?: string;
  /** Rendered beside the label — a verification badge, a hint chip, and such. */
  labelBadge?: ReactNode;
  ariaLabel?: string;
  value?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  type?: 'text' | 'password' | 'time' | 'number' | 'date' | 'url';
  isRequired?: boolean;
  placeholder?: string;
  successMessage?: string;
  className?: string;
  autoFocus?: boolean;
  dataTestId?: string;
  validation?: 'email' | 'number' | 'phone' | 'url' | 'invalid';
  isDisabled?: boolean;
  isInstantSave?: boolean;
  hasSaved?: boolean;
  setHasSaved?: Dispatch<SetStateAction<boolean>>;
  additionalInfo?: string;
  maxLength?: number;
  customValidationError?: string;
  min?: number | string;
  max?: number | string;
  step?: number | string;
}

const Input = React.memo(
  ({
    id,
    name,
    autoComplete,
    label,
    labelBadge,
    ariaLabel,
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
    additionalInfo,
    maxLength,
    customValidationError,
    min,
    max,
    step,
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
      email: EMAIL_PATTERN,
      phone: PHONE_PATTERN,
    } as Record<string, RegExp>;

    const isValidValue = (value: string) => {
      if (validation === 'invalid') {
        return false;
      }
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
        onChange(event);
      }
    };

    useEffect(() => {
      if (value) {
        setIsValid(isValidValue(value));
      }
    }, [value]);

    useEffect(() => {
      if (value !== undefined && value !== localValue) {
        setLocalValue(value);
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
      if (onBlur) onBlur(event);
      setIsEditing(false);
    };

    const handleSubmit = () => {
      if (onChangeRef.current && isValidValue(localValue)) {
        const syntheticEvent = {
          target: { value: localValue },
        } as ChangeEvent<HTMLInputElement>;
        onChangeRef.current(syntheticEvent);
        if (inputRef?.current) {
          (inputRef.current as HTMLInputElement).blur();
        }
      }
    };

    const validationError =
      customValidationError ||
      (!isValid && (validation === 'email' || validation === 'phone')
        ? t(`input_invalid_${validation}`)
        : null);

    return (
      <div className={'flex flex-col gap-1.5 relative '}>
        {label && (
          <div className="flex items-center gap-2">
            <label className={FIELD_LABEL_CLASS} id={label}>
              {label}
              {isRequired && (
                <span className="text-red-500">
                  {additionalInfo ? ` [${additionalInfo}]*` : '*'}
                </span>
              )}
            </label>
            {labelBadge}
          </div>
        )}
        <div className="relative">
          <input
            maxLength={maxLength}
            min={min}
            max={max}
            step={step}
            id={id}
            name={name}
            autoComplete={autoComplete}
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
            aria-label={ariaLabel ?? label}
            aria-required={isRequired}
            aria-invalid={!isValidValue(localValue)}
            ref={inputRef}
            onKeyDown={isInstantSave ? handleKeyDown : undefined}
            disabled={isDisabled}
            aria-labelledby={label}
          />

          {isEditing && isInstantSave && isValidValue(localValue) && (
            <div className="text-disabled text-sm absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
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
