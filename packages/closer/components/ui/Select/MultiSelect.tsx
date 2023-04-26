import React, { FC, useRef, useState } from 'react';
import { Multiselect } from 'react-widgets';

import { MultiSelectProps } from './types';

const MultiSelect: FC<MultiSelectProps> = React.memo(
  ({
    label,
    value,
    options,
    onChange,
    placeholder = 'Select an option',
    className,
    dataTestId,
  }) => {
    const onChangeRef = useRef(onChange);
    const [data, setData] = useState(options);
    if (onChange !== onChangeRef.current) {
      onChangeRef.current = onChange; // prevents re-renders when parent component re-renders with the same props
    }

    const handleChange = (value: string[]) => {
      console.log('handleChange', value);
      onChange && onChange(value);
    };

    const handleCreate = (createdValue: string) => {
      const update = [...(value?.length ? value : []), createdValue];
      setData(update);
      onChange && onChange(update);
    };

    return (
      <div className={`flex flex-col gap-4 relative ${className}`}>
        {label && (
          <label className="font-medium text-complimentary-light">
            {label}
          </label>
        )}
        <Multiselect
          defaultValue={value}
          data={data}
          onChange={handleChange}
          onCreate={handleCreate}
          allowCreate={true}
          showPlaceholderWithValues={true}
          placeholder={placeholder}
          data-testid={dataTestId}
        />
      </div>
    );
  },
);

export default MultiSelect;
