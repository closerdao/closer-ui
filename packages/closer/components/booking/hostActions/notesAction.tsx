import { useEffect, useState } from 'react';

import { useTranslations } from 'next-intl';

import { getHostNotes, saveHostNote } from '../../../utils/stays.api';
import { Textarea } from '../../ui/textarea';
import HostReasonModal from './hostReasonModal';

interface Props {
  stayId: string;
  onDone: () => void | Promise<void>;
  onClose: () => void;
}

const NotesAction = ({ stayId, onDone, onClose }: Props) => {
  const t = useTranslations();
  const [text, setText] = useState('');
  const [seenAt, setSeenAt] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getHostNotes([stayId])
      .then((notes) => {
        if (cancelled) return;
        setText(notes[stayId]?.text ?? '');
        setSeenAt(notes[stayId]?.updatedAt ?? null);
      })
      .finally(() => {
        if (!cancelled) setIsLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [stayId]);

  return (
    <HostReasonModal
      title={t('host_note_title')}
      withReason={false}
      canSubmit={isLoaded}
      onClose={onClose}
      onSubmit={async () => {
        await saveHostNote(stayId, text, seenAt);
        await onDone();
      }}
    >
      <div className="flex flex-col gap-1 text-sm">
        <label className="font-medium" htmlFor="host-note">
          {t('host_note_title')}
        </label>
        <Textarea
          id="host-note"
          aria-describedby="host-note-hint"
          value={text}
          onChange={(event) => setText(event.target.value)}
          disabled={!isLoaded}
        />
        <p id="host-note-hint" className="text-xs text-disabled">
          {t('host_note_hint')}
        </p>
      </div>
    </HostReasonModal>
  );
};

export default NotesAction;
