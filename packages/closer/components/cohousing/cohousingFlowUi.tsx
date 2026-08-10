import { ReactNode, useEffect, useState } from 'react';

export const FlowProgressBar = ({
  value,
  max,
  className = '',
}: {
  value: number;
  max: number;
  className?: string;
}) => {
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = setTimeout(
      () => setW(Math.min((value / max) * 100, 100)),
      120,
    );
    return () => clearTimeout(t);
  }, [value, max]);
  return (
    <div
      className={`h-1.5 rounded-full bg-gray-200 overflow-hidden ${className}`}
    >
      <div
        className="h-full rounded-full bg-accent transition-[width] duration-[1100ms] ease-out"
        style={{ width: `${w}%` }}
      />
    </div>
  );
};

export const FlowBadge = ({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) => (
  <span
    className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-gray-200 bg-gray-50 text-gray-700 ${className}`}
  >
    {children}
  </span>
);

export const FlowDisclaimer = ({
  children,
  tone = 'amber',
}: {
  children: ReactNode;
  tone?: 'amber' | 'blue' | 'red' | 'green';
}) => {
  const map = {
    amber: 'bg-amber-50 border-l-amber-600 text-amber-900',
    blue: 'bg-blue-50 border-l-blue-700 text-blue-900',
    red: 'bg-red-50 border-l-red-600 text-red-900',
    green: 'bg-green-50 border-l-green-600 text-green-900',
  }[tone];
  return (
    <div
      className={`text-sm leading-relaxed px-3.5 py-3 rounded-lg border-l-4 ${map}`}
    >
      {children}
    </div>
  );
};
