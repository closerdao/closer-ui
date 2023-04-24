import React, { useRef, useState } from 'react';
import Select from 'react-select';

type SelectProps = {
  label?: string;
  value?: string;
  options: any[];
  onChange?: (value: string) => void;
  isRequired?: boolean;
  placeholder?: string;
  className?: string;
  dataTestId?: string;
  isMulti?: boolean;
};

const SelectComponent = React.memo(
  ({
    label,
    value,
    options,
    onChange,
    isRequired,
    placeholder = 'Select an option',
    className,
    dataTestId,
    isMulti,
  }: SelectProps) => {
    const [localValue, setLocalValue] = useState(value || '');

    const onChangeRef = useRef(onChange);
    if (onChange !== onChangeRef.current) {
      onChangeRef.current = onChange; // prevents re-renders when parent component re-renders with the same props
    }

    const handleChange = (option: any) => {
      console.log('option.value', option.value);
      setLocalValue(option.value as string);
      onChange && onChange(option.value as string);
    };

    return (
      <div className={`flex flex-col gap-4 relative ${className}`}>
        {label && (
          <label className="font-medium text-complimentary-light">
            {label}
          </label>
        )}
        <Select
          value={localValue}
          required={isRequired}
          placeholder={placeholder}
          data-testid={dataTestId}
          className="text-complimentary-core"
          options={options}
          onChange={handleChange}
          isMulti={isMulti}
          isSearchable={false}
        />
      </div>
    );
  },
);

export default SelectComponent;
