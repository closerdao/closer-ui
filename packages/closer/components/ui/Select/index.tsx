import React, { useRef, useState } from 'react';
import Select, { GroupBase, OnChangeValue } from 'react-select';

type SelectProps<Option, IsMulti, Group> = {
  label?: string;
  value?: string;
  options: (Option | Group)[];
  onChange?: (value: string) => void;
  isRequired?: boolean;
  placeholder?: string;
  className?: string;
  dataTestId?: string;
  isMulti?: IsMulti;
};

const SelectComponent = React.memo(
  <
    Option,
    isMulti extends boolean = false,
    Group extends GroupBase<Option> = GroupBase<Option>,
  >({
    label,
    value,
    options,
    onChange,
    isRequired,
    placeholder = 'Select an option',
    className,
    dataTestId,
    isMulti,
  }: SelectProps<Option, isMulti, Group>) => {
    const [localValue, setLocalValue] = useState(value || '');

    const onChangeRef = useRef(onChange);
    if (onChange !== onChangeRef.current) {
      onChangeRef.current = onChange; // prevents re-renders when parent component re-renders with the same props
    }

    const handleChange = (newValue: OnChangeValue<string, isMulti>) => {
      if (isMulti) {
        const option = (newValue as any)?.map((item: any) => item.value);
        setLocalValue(option);
        onChange && onChange(option);
        return;
      }
      const option = (newValue as any)?.value;
      setLocalValue(option.value);
      onChange && onChange(option.value);
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
          options={options as any}
          onChange={handleChange}
          isMulti={isMulti}
          isSearchable={false}
        />
      </div>
    );
  },
);

export default SelectComponent;
