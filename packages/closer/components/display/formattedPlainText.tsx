import type { FormattedPlainTextProps } from '../../types/display';
import { cn } from '../../utils/cn';

import InlineFormattedSegments from './inlineFormattedSegments';

const FormattedPlainText = ({ text, className }: FormattedPlainTextProps) => {
  return (
    <div className={cn('whitespace-pre-wrap break-words', className)}>
      <InlineFormattedSegments text={text} />
    </div>
  );
};

export default FormattedPlainText;
