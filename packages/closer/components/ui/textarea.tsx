'use client'
import * as React from 'react';

import { FIELD_CONTROL_CLASS } from '../../constants/formStyles';
import { cn } from '../../utils/cn';

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        FIELD_CONTROL_CLASS,
        'min-h-[80px] resize-y',
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = 'Textarea';

export { Textarea };
