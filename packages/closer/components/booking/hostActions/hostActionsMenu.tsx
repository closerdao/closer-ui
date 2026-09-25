import { useEffect, useRef, useState } from 'react';

import { useTranslations } from 'next-intl';

export type HostActionItem = {
  id: string;
  label: string;
  onSelect: () => void;
};

interface Props {
  items: HostActionItem[];
}

const HostActionsMenu = ({ items }: Props) => {
  const t = useTranslations();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    const close = (event: MouseEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent && event.key !== 'Escape') return;
      if (
        event instanceof MouseEvent &&
        containerRef.current?.contains(event.target as Node)
      ) {
        return;
      }
      setIsOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', close);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        className="rounded-full border border-line px-3 py-1 text-xs font-semibold uppercase tracking-wide hover:bg-neutral-light"
      >
        {t('host_actions_menu')}
      </button>
      {isOpen && (
        <ul
          role="menu"
          className="absolute right-0 z-20 mt-1 min-w-[12rem] rounded-md border border-line bg-white py-1 shadow-lg"
        >
          {items.map((item) => (
            <li key={item.id} role="none">
              <button
                type="button"
                role="menuitem"
                className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-light"
                onClick={() => {
                  setIsOpen(false);
                  item.onSelect();
                }}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default HostActionsMenu;
