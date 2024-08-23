import React, { FC, useRef, useState } from 'react';
import { Multiselect } from 'react-widgets';

import Tag from '../../Tag';
import { MultiSelectProps } from './types';

const MultiSelect: FC<MultiSelectProps> = React.memo(
  ({
    label,
    values,
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
      onChange && onChange(value);
    };

    const handleCreate = (createdValue: string) => {
      const update = [...(values?.length ? values : []), createdValue];
      setData(update);
      onChange && onChange(update);
    };

    const handleRemove = (label: unknown) => {
      if (!values) return null;
      const update = values.filter((item) => item !== label);
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
          defaultValue={values}
          data={data}
          onChange={handleChange}
          onCreate={handleCreate}
          allowCreate={true}
          showPlaceholderWithValues={true}
          placeholder={placeholder}
          data-testid={dataTestId}
          tagOptionComponent={(props) => (
            <Tag
              className="bg-accent-light border-accent ml-2 mt-2"
              remove={() => handleRemove(props.dataItem)}
            >
              {props.children}
            </Tag>
          )}
          key={values?.join('')}
        />
      </div>
    );
  },
);

export default MultiSelect;
