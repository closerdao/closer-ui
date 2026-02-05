import React from 'react';

import { IconChevronLeft } from '../../BookingIcons';

interface BackButtonProps {
  children: React.ReactNode;
  handleClick: () => void;
  className?: string;
}

const BackButton = ({ children, handleClick, className }: BackButtonProps) => {
  const label =
    typeof children === 'string' ? children.replace(/^<\s*/, '') : children;
  return (
    <button
      type="button"
      onClick={handleClick}
      className={`shrink-0 py-2 flex items-center gap-1.5 text-foreground hover:opacity-80 ${className ?? ''}`}
      aria-label={typeof label === 'string' ? label : undefined}
    >
      <IconChevronLeft className="!mr-0" />
      <span className="hidden md:inline">{label}</span>
    </button>
  );
};

export default BackButton;
