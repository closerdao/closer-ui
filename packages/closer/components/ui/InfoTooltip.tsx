import { cloneElement, useEffect, useId, useRef, useState } from 'react';
import type { ReactElement, ReactNode } from 'react';

import { Info } from 'lucide-react';

/** Non-interactive help for a single focusable trigger. Touch can pin info open. */
export function Tooltip({
  content,
  children,
  openOnClick = true,
}: {
  content: ReactNode;
  children: ReactElement<{ 'aria-describedby'?: string }>;
  openOnClick?: boolean;
}) {
  const id = useId();
  const root = useRef<HTMLSpanElement>(null);
  const panel = useRef<HTMLSpanElement>(null);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [left, setLeft] = useState(0);
  const open = !dismissed && (hovered || focused || pinned);

  useEffect(() => {
    if (!open) return;
    const position = () => {
      if (!root.current || !panel.current) return;
      const triggerLeft = root.current.getBoundingClientRect().left;
      const width = panel.current.getBoundingClientRect().width;
      setLeft(
        Math.max(
          8 - triggerLeft,
          Math.min(
            0,
            document.documentElement.clientWidth - width - 8 - triggerLeft,
          ),
        ),
      );
    };
    const dismiss = () => {
      setPinned(false);
      setDismissed(true);
    };
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) dismiss();
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      dismiss();
    };
    position();
    window.addEventListener('resize', position);
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => {
      window.removeEventListener('resize', position);
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape);
    };
  }, [open]);

  return (
    <span
      ref={root}
      className="relative inline-flex shrink-0 items-center align-middle"
      onPointerEnter={(event) => {
        if (event.pointerType === 'touch') return;
        setHovered(true);
        setDismissed(false);
      }}
      onPointerLeave={() => setHovered(false)}
      onFocus={() => {
        setFocused(true);
        setDismissed(false);
      }}
      onBlur={(event) => {
        if (event.currentTarget.contains(event.relatedTarget)) return;
        setFocused(false);
        setPinned(false);
        setDismissed(true);
      }}
      onClick={(event) => {
        if (panel.current?.contains(event.target as Node)) return;
        if (!openOnClick) {
          setDismissed(true);
          return;
        }
        setPinned(!pinned);
        setDismissed(pinned);
      }}
    >
      {cloneElement(children, {
        'aria-describedby':
          [children.props['aria-describedby'], open ? id : undefined]
            .filter(Boolean)
            .join(' ') || undefined,
      })}
      {open && (
        <span
          ref={panel}
          className="absolute top-full z-50 w-64 max-w-[calc(100vw-1rem)] pt-2"
          style={{ left }}
        >
          <span
            id={id}
            role="tooltip"
            className="block rounded-lg border border-gray-200 bg-white p-3 text-left text-sm font-normal leading-snug text-gray-900 shadow-lg"
          >
            {content}
          </span>
        </span>
      )}
    </span>
  );
}

export default function InfoTooltip({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <Tooltip content={children}>
      <button
        type="button"
        aria-label={label}
        className="inline-flex items-center justify-center rounded p-1 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <Info size={16} aria-hidden="true" />
      </button>
    </Tooltip>
  );
}
