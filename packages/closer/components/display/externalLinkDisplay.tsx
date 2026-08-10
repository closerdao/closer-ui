import Link from 'next/link';
import { ExternalLink } from 'lucide-react';

import type { ExternalLinkDisplayProps } from '../../types/display';
import { cn } from '../../utils/cn';
import {
  getUrlDisplayString,
  normalizeExternalHref,
} from '../../utils/display.helpers';

const ExternalLinkDisplay = ({
  href,
  children,
  className,
  maxDisplayLength = 40,
}: ExternalLinkDisplayProps) => {
  const raw = href?.trim() ?? '';
  if (!raw) {
    return null;
  }

  const childIsPrimitive =
    children === null ||
    children === undefined ||
    typeof children === 'string' ||
    typeof children === 'number';

  if (raw.startsWith('/') && !raw.startsWith('//')) {
    const text =
      typeof children === 'string' || typeof children === 'number'
        ? String(children)
        : raw;
    return (
      <Link
        href={raw}
        className={cn(
          'inline-flex max-w-full min-w-0 items-center gap-0.5 text-accent underline',
          className,
        )}
        title={raw}
      >
        <span className="min-w-0 truncate">
          {childIsPrimitive ? text : children}
        </span>
      </Link>
    );
  }

  const normalized = normalizeExternalHref(raw);
  const displayFromHref = getUrlDisplayString(raw, maxDisplayLength);
  const childStr =
    typeof children === 'string' || typeof children === 'number'
      ? String(children).trim()
      : '';

  const display =
    childStr &&
    childStr !== normalized &&
    !/^https?:\/\//i.test(childStr) &&
    childStr.length <= maxDisplayLength + 10
      ? childStr
      : displayFromHref;

  if (!childIsPrimitive) {
    return (
      <a
        href={normalized}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className={cn(
          'inline-flex max-w-full min-w-0 items-center gap-0.5 text-accent underline',
          className,
        )}
        title={normalized}
      >
        <span className="inline-flex min-w-0 max-w-full flex-wrap items-center gap-0.5 break-words">
          <span className="min-w-0">{children}</span>
          <ExternalLink
            className="h-3 w-3 shrink-0 opacity-70"
            aria-hidden
            strokeWidth={2}
          />
        </span>
      </a>
    );
  }

  return (
    <a
      href={normalized}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className={cn(
        'inline-flex max-w-full min-w-0 items-center gap-0.5 text-accent underline',
        className,
      )}
      title={normalized}
    >
      <span className="min-w-0 truncate">{display}</span>
      <ExternalLink
        className="h-3 w-3 shrink-0 opacity-70"
        aria-hidden
        strokeWidth={2}
      />
    </a>
  );
};

export default ExternalLinkDisplay;
