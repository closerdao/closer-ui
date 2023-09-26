import React from 'react';

interface InformationProps {
  children: React.ReactNode;
  className?: string;
}

const Information = ({ children, className }: InformationProps) => {
  return (
    <div className={`flex  ${className}`}>
      <svg
        className='min-w-[17px]'
        width="17px"
        height="17px"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g id="Warning / Info">
          <path
            id="Vector"
            d="M12 11V16M12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21ZM12.0498 8V8.1L11.9502 8.1002V8H12.0498Z"
            stroke="#bbbbbb"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </svg>

      <p className="px-2 text-light text-sm">{children}</p>
    </div>
  );
};

export default Information;
