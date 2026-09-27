import { useEffect, useState } from 'react';

import { useTranslations } from 'next-intl';

import { parseMessageFromError } from '../../../utils/common';
import { getHostNotes, saveHostNote } from '../../../utils/stays.api';
import { Information } from '../../ui';
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
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getHostNotes([stayId])
      .then((notes) => {
        if (cancelled) return;
        setText(notes[stayId]?.text ?? '');
        setSeenAt(notes[stayId]?.updatedAt ?? null);
        setIsLoaded(true);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(parseMessageFromError(err));
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
      {loadError && (
        <Information className="border-error/30 bg-error/10 text-foreground">
          {loadError}
        </Information>
      )}
    </HostReasonModal>
  );
};

export default NotesAction;
