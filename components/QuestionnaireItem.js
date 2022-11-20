import React from 'react';

import { __ } from '../utils/helpers';

export const QuestionnaireItem = ({ question: { type, name, options } }) => {
  return (
    <div className="mb-16 last:mb-0">
      <label
        htmlFor={name}
        className="border-solid border-b border-neutral-200 pb-1 capitalize font-normal text-base text-black"
      >
        {name}
      </label>
      {type === 'text' && (
        <input
          id={name}
          type="text"
          placeholder={__('generic_input_placeholder')}
          className="border-solid !border border-neutral-400 !px-4 py-2 w-full !mt-3 rounded-xl bg-neutral-100 placeholder:text-xs placeholder:text-neutral-400" // TO DO how to resolve class clash with forms.css?
        />
      )}
      {type === 'select' && (
        <select
          type="text"
          className="rounded-xl border-solid !border border-neutral-400 bg-neutral-100 px-4 block w-full appearance-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option selected value="">
            {__('generic_select_placeholder')}
          </option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      )}
    </div>
  );
};
