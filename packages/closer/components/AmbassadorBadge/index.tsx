import { FC } from 'react';

type AmbassadorBadgeProps = {
  className?: string;
  size?: 'sm' | 'md';
};

const AmbassadorBadge: FC<AmbassadorBadgeProps> = ({
  className = '',
  size = 'sm',
}) => {
  const sizeClass =
    size === 'md'
      ? 'text-sm px-3 py-1'
      : 'text-xs px-2 py-0.5';

  return (
    <span
      className={`inline-flex items-center rounded-md bg-accent text-accent-foreground font-medium ${sizeClass} ${className}`}
    >
      Ambassador
    </span>
  );
};

export default AmbassadorBadge;
