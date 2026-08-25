import { Mail } from 'lucide-react';

import type { EmailDisplayProps } from '../../types/display';
import { cn } from '../../utils/cn';

const EmailDisplay = ({
  email,
  className,
  showIcon = false,
}: EmailDisplayProps) => {
  const trimmed = email?.trim() ?? '';
  if (!trimmed) {
    return null;
  }

  return (
    <a
      href={`mailto:${trimmed}`}
      className={cn(
        'inline-flex max-w-full min-w-0 items-center gap-1 text-accent underline',
        className,
      )}
      title={trimmed}
      data-ph-mask
    >
      {showIcon && (
        <Mail className="h-3.5 w-3.5 shrink-0 opacity-80" strokeWidth={2} />
      )}
      <span className="truncate" data-ph-mask>{trimmed}</span>
    </a>
  );
};

export default EmailDisplay;
