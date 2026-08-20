import { useCallback, useState } from 'react';

import { Check, Copy } from 'lucide-react';
import { useTranslations } from 'next-intl';

import type { IdDisplayProps } from '../../types/display';
import { cn } from '../../utils/cn';
import { truncateMiddle } from '../../utils/display.helpers';

/**
 * Shows a truncated record id (a Sale._id, for instance) with a copy button, so
 * an admin can hand the full id to support or accounting without opening the record.
 */
const IdDisplay = ({
  value,
  className,
  head = 6,
  tail = 4,
  showCopy = true,
}: IdDisplayProps) => {
  const t = useTranslations();
  const [copied, setCopied] = useState(false);
  const trimmed = value?.trim() ?? '';

  const handleCopy = useCallback(async () => {
    if (!trimmed || typeof navigator === 'undefined' || !navigator.clipboard) {
      return;
    }
    try {
      await navigator.clipboard.writeText(trimmed);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [trimmed]);

  if (!trimmed) {
    return null;
  }

  return (
    <span className={cn('inline-flex min-w-0 items-center gap-1', className)}>
      <span className="min-w-0 truncate font-mono" title={trimmed}>
        {truncateMiddle(trimmed, head, tail)}
      </span>
      {showCopy && (
        <button
          type="button"
          onClick={handleCopy}
          className="shrink-0 rounded p-0.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
          aria-label={copied ? t('display_copied') : t('display_copy')}
        >
          {copied ? (
            <Check className="h-3 w-3 text-green-600" strokeWidth={2} />
          ) : (
            <Copy className="h-3 w-3" strokeWidth={2} />
          )}
        </button>
      )}
    </span>
  );
};

export default IdDisplay;
