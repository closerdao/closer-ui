import React from 'react';

const Switch = ({ checked, disabled, name, label, onChange }) => (
  <label
    htmlFor={name}
    className="switch flex relative justify-start items-center mb-4 cursor-pointer"
  >
    <input
      type="checkbox"
      id={name}
      className="sr-only"
      checked={checked}
      disabled={disabled}
      onChange={() => onChange((checked) => !checked)}
    />
    <div className="w-11 h-6 bg-gray-200 rounded-full border border-gray-200 flex items-center toggle-bg dark:bg-gray-700 dark:border-gray-600"></div>
    {label && <span className="label">{label}</span>}
  </label>
);

export default Switch;
