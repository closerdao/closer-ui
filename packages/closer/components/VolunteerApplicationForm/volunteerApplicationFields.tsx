import { ReactNode, useId } from 'react';

import {
  FIELD_CONTROL_CLASS,
  FIELD_LABEL_CLASS,
} from '../../constants/formStyles';

const labelClass = FIELD_LABEL_CLASS;
const controlClass = FIELD_CONTROL_CLASS;
const errorClass = 'text-error text-sm';

const FieldShell = ({
  id,
  label,
  isRequired,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  isRequired?: boolean;
  error?: string;
  hint?: ReactNode;
  children: ReactNode;
}) => (
  <div className="flex flex-col gap-2">
    <label className={labelClass} htmlFor={id}>
      {label}
      {isRequired && <span className="text-red-500">*</span>}
    </label>
    {children}
    {hint && <p className="text-sm text-complimentary-light">{hint}</p>}
    {error && (
      <p className={errorClass} id={`${id}-error`} role="alert">
        {error}
      </p>
    )}
  </div>
);

export const TextField = ({
  label,
  value,
  onChange,
  error,
  type = 'text',
  placeholder,
  isRequired,
  autoComplete,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: 'text' | 'tel' | 'email';
  placeholder?: string;
  isRequired?: boolean;
  autoComplete?: string;
  hint?: ReactNode;
}) => {
  const id = useId();
  return (
    <FieldShell
      id={id}
      label={label}
      isRequired={isRequired}
      error={error}
      hint={hint}
    >
      <input
        id={id}
        type={type}
        className={controlClass}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-required={isRequired}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(event) => onChange(event.target.value)}
      />
    </FieldShell>
  );
};

export const TextAreaField = ({
  label,
  value,
  onChange,
  error,
  placeholder,
  isRequired,
  rows = 3,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  isRequired?: boolean;
  rows?: number;
  hint?: ReactNode;
}) => {
  const id = useId();
  return (
    <FieldShell
      id={id}
      label={label}
      isRequired={isRequired}
      error={error}
      hint={hint}
    >
      <textarea
        id={id}
        rows={rows}
        className={controlClass}
        value={value}
        placeholder={placeholder}
        aria-required={isRequired}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(event) => onChange(event.target.value)}
      />
    </FieldShell>
  );
};

export const SelectField = ({
  label,
  value,
  onChange,
  options,
  error,
  placeholder,
  isRequired,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  error?: string;
  placeholder?: string;
  isRequired?: boolean;
}) => {
  const id = useId();
  return (
    <FieldShell id={id} label={label} isRequired={isRequired} error={error}>
      <select
        id={id}
        className={controlClass}
        value={value}
        aria-required={isRequired}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">{placeholder || '—'}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
};

export const YesNoField = ({
  label,
  value,
  onChange,
  error,
  yesLabel,
  noLabel,
}: {
  label: string;
  value: 'yes' | 'no' | '';
  onChange: (value: 'yes' | 'no') => void;
  error?: string;
  yesLabel: string;
  noLabel: string;
}) => {
  const id = useId();
  const options: { value: 'yes' | 'no'; label: string }[] = [
    { value: 'yes', label: yesLabel },
    { value: 'no', label: noLabel },
  ];

  return (
    <div className="flex flex-col gap-2">
      <fieldset
        className="flex flex-wrap gap-x-4 gap-y-2 items-center justify-between"
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
      >
        <legend className={`${labelClass} float-left mb-2 sm:mb-0`}>
          {label}
          <span className="text-red-500">*</span>
        </legend>
        <div className="flex gap-2 shrink-0">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={value === option.value}
              onClick={() => onChange(option.value)}
              className={`min-h-[44px] px-5 rounded-lg border-2 text-sm font-medium transition-colors ${
                value === option.value
                  ? 'border-accent bg-accent-light text-accent'
                  : 'border-line bg-neutral text-complimentary-light hover:border-accent'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </fieldset>
      {error && (
        <p className={errorClass} id={`${id}-error`} role="alert">
          {error}
        </p>
      )}
    </div>
  );
};
