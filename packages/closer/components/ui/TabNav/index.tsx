import Link from 'next/link';

import { ReactNode } from 'react';

export type TabNavItem<T extends string = string> = {
  id: T;
  label: ReactNode;
  /** Renders this tab as a link. Link and button bars must not be mixed. */
  href?: string;
  /** Count shown in a chip after the label — omitted when zero. */
  badge?: number;
  disabled?: boolean;
};

type Props<T extends string> = {
  items: TabNavItem<T>[];
  active: T;
  /** Names the bar for screen readers; there is no visible heading. */
  label: string;
  /** Button-driven bars pass this. Link-driven ones let the route decide. */
  onSelect?: (id: T) => void;
  className?: string;
};

const base =
  'px-4 py-2 rounded-full text-sm flex items-center gap-2 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50 disabled:pointer-events-none';

/**
 * `bg-muted` is a shadcn token no app in this repo defines, so the citizen hub's
 * inactive tabs were rendering with no background at all, in every app. These
 * are the tokens every app's theme actually carries.
 */
const tone = (active: boolean) =>
  active
    ? 'bg-accent text-accent-foreground'
    : 'bg-neutral text-foreground hover:bg-neutral-dark';

const Badge = ({ value, active }: { value: number; active: boolean }) => (
  <span
    className={`rounded-full px-2 py-0.5 text-xs font-bold ${
      active
        ? 'bg-accent-foreground/25 text-accent-foreground'
        : 'bg-amber-100 text-amber-800'
    }`}
  >
    {value}
  </span>
);

/**
 * The pill tab bar used across the admin surfaces — the citizen funnel hub, the
 * village editor.
 *
 * It comes in two flavours because the semantics differ: a bar whose tabs are
 * URLs is navigation (`<nav>` + `aria-current`), and a bar that swaps panels in
 * place is a tab list (`role="tablist"` + `aria-selected`). Announcing a link
 * as a tab, or a panel switch as a page, misreads either way — so `href`
 * decides, and both render identically.
 */
const TabNav = <T extends string>({
  items,
  active,
  label,
  onSelect,
  className = '',
}: Props<T>) => {
  const isLinkBar = items.some((item) => item.href);
  const wrapperClass = `flex flex-wrap gap-2 ${className}`;

  if (isLinkBar) {
    return (
      <nav className={wrapperClass} aria-label={label}>
        {items.map((item) => {
          const isActive = item.id === active;
          return (
            <Link
              key={item.id}
              href={item.href as string}
              aria-current={isActive ? 'page' : undefined}
              className={`${base} ${tone(isActive)}`}
            >
              {item.label}
              {item.badge ? (
                <Badge value={item.badge} active={isActive} />
              ) : null}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <div role="tablist" aria-label={label} className={wrapperClass}>
      {items.map((item) => {
        const isActive = item.id === active;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={`tab-${item.id}`}
            aria-selected={isActive}
            aria-controls={`tabpanel-${item.id}`}
            disabled={item.disabled}
            onClick={() => onSelect?.(item.id)}
            className={`${base} ${tone(isActive)}`}
          >
            {item.label}
            {item.badge ? <Badge value={item.badge} active={isActive} /> : null}
          </button>
        );
      })}
    </div>
  );
};

export default TabNav;
