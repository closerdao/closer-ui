import React, {
  ChangeEvent,
  Dispatch,
  SetStateAction,
  useRef,
  useState,
} from 'react';

type InputProps = {
  id?: string;
  label?: string;
  value?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  type?: 'text' | 'password';
  isRequired?: boolean;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  dataTestId?: string;
  validation?: 'email' | 'number';
  isDisabled?: boolean;
  isEditSave?: boolean;
  hasSaved?: boolean;
  setHasSaved?: Dispatch<SetStateAction<boolean>>;
};

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
    isDisabled = false,
    isEditSave = false,
    hasSaved,
    setHasSaved,
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

    const handleSubmit = () => {
      if (onChangeRef.current && isValidValue(localValue)) {
        onChangeRef.current(localValue as any);
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

    const handleFocus = () => {
      setIsEditing(true);
    };

    const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
      setTimeout(() => {
        setIsEditing(false);
        onBlur && onBlur(event);
        if (setHasSaved) {
          setHasSaved(false);
        }
      }, 2000);
    };

    const validationError =
      !isValid && validation
        ? `${label} is not a valid ${validation} value.`
        : null;

    return (
      <div className={`flex flex-col gap-4 relative ${className}`}>
        {label && (
          <label className="font-medium text-complimentary-light" id={label}>
            {label}
          </label>
        )}
        <input
          id={id}
          type={type}
          value={isEditSave ? localValue : value}
          onChange={isEditSave ? handleChange : onChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          required={isRequired}
          placeholder={placeholder}
          className={`new-input px-4 py-3 rounded-lg ${
            isValid
              ? 'border-neutral bg-neutral'
              : 'border-accent-core border bg-accent-light'
          } ${
            isDisabled
              ? 'text-gray-300 border-gray-300 cursor-not-allowed'
              : 'text-complimentary-core'
          }`}
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
          disabled={isDisabled}
          aria-labelledby={label}
        />
        {isEditing && isEditSave && isValidValue(localValue) && (
          <button
            className="absolute right-3 top-11 rounded-full text-white mt-1 bg-primary px-3 py-1"
            onClick={handleSubmit}
          >
            {hasSaved ? 'Saved!' : 'Save'}
          </button>
        )}

        {validationError && (
          <span className="text-red-500 text-sm">{validationError}</span>
        )}
      </div>
    );
  },
);

export default Input;
