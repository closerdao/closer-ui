import { useEffect, useState } from 'react';

import { truncateMiddle } from '../../utils/proposalAttestation';

/**
 * A hex string - a transaction hash, a signature, an address - shown at a
 * length the eye can actually compare, with the full value one click away.
 *
 * Nobody reads a 132-character signature and nobody clicks one either, so the
 * raw string is never the affordance: both ends stay visible, which is what
 * someone checking a value against another window actually needs, and the copy
 * button carries the whole thing.
 */
const CopyableHash = ({
  value,
  copyLabel,
  lead = 10,
  tail = 8,
  className = '',
}: {
  value: string;
  copyLabel: string;
  lead?: number;
  tail?: number;
  className?: string;
}) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timer = setTimeout(() => setCopied(false), 1600);

    return () => clearTimeout(timer);
  }, [copied]);

  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <span className="font-mono" title={value}>
        {truncateMiddle(value, lead, tail)}
      </span>
      <button
        type="button"
        aria-label={copyLabel}
        className="rounded px-1.5 py-0.5 text-xs text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
        onClick={() => {
          navigator?.clipboard?.writeText?.(value);
          setCopied(true);
        }}
      >
        {copied ? '✓' : '⧉'}
      </button>
    </span>
  );
};

export default CopyableHash;
