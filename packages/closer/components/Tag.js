import React from 'react';

const colors = {
  blue: 'bg-blue-200 text-blue-700',
  green: 'bg-green-200 text-green-700',
  orange: 'bg-orange-200 text-orange-700',
  red: 'bg-red-200 text-red-700',
  white: 'bg-white-200 text-gray-700',
  primary: 'bg-accent-light text-accent',
};

const Tag = ({ color, children, remove, className }) => {
  return (
    <span
      className={`${colors[color]} ${className} pr-1 normal-case	font-normal inline-flex items-center text-sm rounded-full overflow-hidden`}
    >
      <span
        className="ml-2 mr-1 leading-relaxed truncate max-w-xs px-1"
        x-text="tag"
      >
        {children}
      </span>
      {remove && (
        <button
          className="w-6 h-6 inline-block align-middle text-gray-500 bg-grey-900 bg-opacity-50 focus:outline-none"
          onClick={remove}
        >
          <svg
            className="w-6 h-6 fill-current mx-auto"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
          >
            <path
              fillRule="evenodd"
              d="M15.78 14.36a1 1 0 0 1-1.42 1.42l-2.82-2.83-2.83 2.83a1 1 0 1 1-1.42-1.42l2.83-2.82L7.3 8.7a1 1 0 0 1 1.42-1.42l2.83 2.83 2.82-2.83a1 1 0 0 1 1.42 1.42l-2.83 2.83 2.83 2.82z"
            />
          </svg>
        </button>
      )}
    </span>
  );
};
Tag.defaultProps = {
  color: 'blue',
  className: ''
};

export default Tag;
