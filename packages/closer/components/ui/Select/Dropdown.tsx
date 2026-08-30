import React, { FC, useRef } from 'react';
import { DropdownList } from 'react-widgets';

import { twMerge } from 'tailwind-merge';

import {
  FIELD_LABEL_CLASS,
  FIELD_PICKER_CLASS,
} from '../../../constants/formStyles';
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
    isDisabled,
    size,
  }) => {
    const onChangeRef = useRef(onChange);
    if (onChange !== onChangeRef.current) {
      onChangeRef.current = onChange; // prevents re-renders when parent component re-renders with the same props
    }

    const handleChange = (option: Item) => {
      if (onChange) onChange(option.value);
    };

    return (
      <div className={' relative w-full flex flex-col gap-1.5'}>
        {label && <label className={FIELD_LABEL_CLASS}>{label}</label>}
        <DropdownList
          disabled={isDisabled}
          value={value}
          dataKey="value"
          textField="label"
          data={options}
          onChange={handleChange}
          placeholder={placeholder}
          data-testid={dataTestId}
          aria-required={isRequired}
          listProps={{
            style: {
              maxHeight: 400,
            },
          }}
          optionComponent={(props) => (
            <div
              role="option"
              aria-selected={props?.selected}
              className={`rw-list-option ${
                props?.selected ? 'bg-accent-light' : 'bg-transparent'
              } `}
              onClick={(event) => props?.onSelect(props?.dataItem, event)}
            >
              {props.dataItem.label}
            </div>
          )}
          className=" "
          containerClassName={twMerge(
            FIELD_PICKER_CLASS,
            size === 'large' ? 'py-3.5' : '',
            className,
          )}
        />
      </div>
    );
  },
);

export default Dropdown;
