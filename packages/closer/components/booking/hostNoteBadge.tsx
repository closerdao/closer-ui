import { NotebookPen } from 'lucide-react';
import { useTranslations } from 'next-intl';

import type { HostNote } from '../../types/stay';

interface Props {
  note?: HostNote | null;
  className?: string;
}

const HostNoteBadge = ({ note, className = '' }: Props) => {
  const t = useTranslations();
  if (!note?.text) return null;

  return (
    <div
      data-testid="host-note-badge"
      className={`flex max-w-[16rem] items-center gap-1 rounded-full bg-accent-light px-2 py-0.5 text-xs text-foreground ${className}`}
      title={note.text}
    >
      <NotebookPen
        size={12}
        className="shrink-0"
        aria-label={t('host_note_title')}
      />
      <span className="truncate">{note.text}</span>
    </div>
  );
};

export default HostNoteBadge;
