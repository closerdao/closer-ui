import React, { FC, useRef } from 'react';
import { DropdownList } from 'react-widgets';

import { DropdownProps, Item } from './types';

const Dropdown: FC<DropdownProps> = React.memo(
  ({
    label,
    value,
    options,
    onChange,
    isRequired,
    placeholder = 'Select an option',
    className,
    dataTestId,
  }) => {
    const onChangeRef = useRef(onChange);
    if (onChange !== onChangeRef.current) {
      onChangeRef.current = onChange; // prevents re-renders when parent component re-renders with the same props
    }

    const handleChange = (option: Item) => {
      onChange && onChange(option.value);
    };

    return (
      <div className={`flex flex-col gap-4 relative ${className}`}>
        {label && (
          <label className="font-medium text-complimentary-light">
            {label}
          </label>
        )}
        <DropdownList
          value={value}
          dataKey="value"
          textField="label"
          data={options}
          onChange={handleChange}
          placeholder={placeholder}
          data-testid={dataTestId}
          aria-required={isRequired}
          optionComponent={(props) => (
            <div
              role="option"
              aria-selected={props?.selected}
              className={`rw-list-option ${
                props?.selected ? 'bg-accent-light' : 'bg-transparent'
              }`}
              onClick={(event) => props?.onSelect(props?.dataItem, event)}
            >
              {props.dataItem.label}
            </div>
          )}
          className="focus:!shadow-xl focus:!border-accent-core focus:ring-2 focus:ring-offset-0 focus:!ring-accent-core"
          containerClassName="focus:!shadow-xl focus:!border-accent-core focus:ring-0 focus:ring-offset-0 focus:!ring-accent-core"
        />
      </div>
    );
  },
);

export default Dropdown;
