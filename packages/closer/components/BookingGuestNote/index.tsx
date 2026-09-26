import { useState } from 'react';

import { useTranslations } from 'next-intl';

import type { Stay } from '../../types/stay';
import { parseMessageFromError } from '../../utils/common';
import { updateStayOptions } from '../../utils/stays.api';
import BookingSurface, {
  BookingSectionEyebrow,
} from '../booking/bookingSurface';
import { Button, ErrorMessage } from '../ui';
import { Textarea } from '../ui/textarea';

const secondaryButtonClass =
  '!normal-case tracking-normal rounded-lg enabled:!border-line enabled:!bg-neutral-light !text-foreground !min-h-8 hover:!scale-100 !border-2 !py-2 !text-xs';

interface Props {
  /** `booking.message`, written at checkout under "Notes for your host". */
  message?: string | null;
  /** The guest reads it as their own note; a host reads it as the guest's. */
  isOwnNote?: boolean;
  /** Set to make the note editable. Omit it for a read-only view. */
  stayId?: string;
  onSaved?: (stay: Stay) => void;
  /** Renders as a bare block, for use inside an existing surface such as a card. */
  compact?: boolean;
}

const BookingGuestNote = ({
  message,
  isOwnNote = false,
  stayId,
  onSaved,
  compact = false,
}: Props) => {
  const t = useTranslations();
  const note = (message || '').trim();
  const canEdit = Boolean(stayId);

  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(note);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!note && !canEdit) return null;

  const title = isOwnNote
    ? t('stay_create_preferences_host_notes_label')
    : t('booking_guest_note_title');

  if (compact) {
    return (
      <div data-testid="booking-guest-note">
        <BookingSectionEyebrow className="mb-1">{title}</BookingSectionEyebrow>
        <p className="text-sm whitespace-pre-line break-words line-clamp-3">
          {note}
        </p>
      </div>
    );
  }

  const startEditing = () => {
    setDraft(note);
    setError(null);
    setIsEditing(true);
  };

  const save = async () => {
    if (!stayId) return;
    setIsSaving(true);
    setError(null);
    try {
      const updated = await updateStayOptions(stayId, {
        message: draft.trim(),
      });
      setIsEditing(false);
      onSaved?.(updated);
    } catch (err) {
      setError(parseMessageFromError(err));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <BookingSurface
      tone="elevated"
      padding="md"
      className="flex flex-col gap-3"
      data-testid="booking-guest-note"
    >
      <BookingSectionEyebrow>{title}</BookingSectionEyebrow>

      {isEditing ? (
        <>
          <Textarea
            aria-label={title}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={t('stay_create_preferences_host_notes_placeholder')}
            disabled={isSaving}
            className="border-2 border-neutral text-complimentary-core text-sm rounded-lg min-h-[88px]"
          />
          {error && <ErrorMessage error={error} />}
          <div className="flex gap-2">
            <Button
              size="small"
              isFullWidth={false}
              onClick={save}
              isLoading={isSaving}
              className="!normal-case tracking-normal rounded-lg hover:!scale-100 !text-xs !min-h-8"
            >
              {t('save')}
            </Button>
            <Button
              variant="secondary"
              size="small"
              isFullWidth={false}
              onClick={() => setIsEditing(false)}
              isEnabled={!isSaving}
              className={secondaryButtonClass}
            >
              {t('cancel')}
            </Button>
          </div>
        </>
      ) : (
        <>
          {note ? (
            <p className="text-sm whitespace-pre-line break-words">{note}</p>
          ) : (
            <p className="text-sm text-disabled">
              {t('booking_guest_note_empty')}
            </p>
          )}
          {canEdit && (
            <Button
              variant="secondary"
              size="small"
              isFullWidth={false}
              onClick={startEditing}
              className={`${secondaryButtonClass} self-start`}
            >
              {note
                ? t('booking_guest_note_edit')
                : t('booking_guest_note_add')}
            </Button>
          )}
        </>
      )}
    </BookingSurface>
  );
};

export default BookingGuestNote;
