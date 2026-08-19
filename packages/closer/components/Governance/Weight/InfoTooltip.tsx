import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface InfoTooltipProps {
  children: React.ReactNode;
}

const GAP = 8;

const InfoTooltip: React.FC<InfoTooltipProps> = ({ children }) => {
  const triggerRef = useRef<HTMLSpanElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(
    null,
  );

  const updatePosition = () => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    setPosition({ top: rect.top - GAP, left: rect.left + rect.width / 2 });
  };

  const open = () => {
    updatePosition();
    setIsOpen(true);
  };
  const close = () => setIsOpen(false);

  useEffect(() => {
    if (!isOpen) return;
    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen]);

  return (
    <span
      ref={triggerRef}
      tabIndex={0}
      onMouseEnter={open}
      onMouseLeave={close}
      onFocus={open}
      onBlur={close}
      className="relative inline-flex h-[13px] w-[13px] flex-none cursor-help items-center justify-center rounded-full border border-gray-400 text-[9px] leading-none text-gray-500 focus:outline-none"
    >
      ?
      {isOpen &&
        position &&
        typeof document !== 'undefined' &&
        createPortal(
          <span
            role="tooltip"
            style={{ top: position.top, left: position.left }}
            className="pointer-events-none fixed z-[100] w-56 -translate-x-1/2 -translate-y-full rounded-md bg-gray-900 p-2.5 text-xs font-normal normal-case leading-relaxed tracking-normal text-white shadow-xl"
          >
            {children}
            <span className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
          </span>,
          document.body,
        )}
    </span>
  );
};

export default InfoTooltip;
