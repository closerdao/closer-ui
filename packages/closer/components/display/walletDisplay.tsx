import { Check, Copy } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useState } from 'react';

import type { WalletDisplayProps } from '../../types/display';
import { cn } from '../../utils/cn';
import { truncateHexAddress } from '../../utils/display.helpers';

const WalletDisplay = ({
  address,
  className,
  showCopy = true,
  variant = 'default',
}: WalletDisplayProps) => {
  const t = useTranslations();
  const [copied, setCopied] = useState(false);
  const trimmed = address?.trim() ?? '';

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

  const label = truncateHexAddress(trimmed);

  return (
    <span
      className={cn(
        'flex min-w-0 max-w-full items-center gap-1',
        variant === 'inline'
          ? 'inline-flex align-middle text-inherit'
          : 'flex text-gray-800',
        className,
      )}
    >
      <span
        className={cn(
          'min-w-0 truncate font-mono text-inherit',
          variant === 'inline' ? 'text-[13px]' : 'text-xs sm:text-sm',
        )}
        title={trimmed}
      >
        {label}
      </span>
      {showCopy && (
        <button
          type="button"
          onClick={handleCopy}
          className={cn(
            'shrink-0 rounded p-0.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800',
            variant === 'inline' ? 'h-5 w-5' : 'h-6 w-6',
          )}
          aria-label={copied ? t('display_copied') : t('display_copy')}
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-green-600" strokeWidth={2} />
          ) : (
            <Copy className="h-3.5 w-3.5" strokeWidth={2} />
          )}
        </button>
      )}
    </span>
  );
};

export default WalletDisplay;
