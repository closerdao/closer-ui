import { ChangeEvent, useEffect, useState } from 'react';

import { useTranslations } from 'next-intl';

import api from '../utils/api';
import { parseMessageFromError } from '../utils/common';
import Modal from './Modal';
import { Button, ErrorMessage, Heading, Input, Textarea } from './ui';

// Mirrors the limits enforced by POST /events/:id/email-attendees.
const MAX_SUBJECT_LENGTH = 200;
const MAX_BODY_LENGTH = 10000;

interface EmailDraft {
  subject: string;
  body: string;
  linkText: string;
  linkUrl: string;
}

const EMPTY_DRAFT: EmailDraft = {
  subject: '',
  body: '',
  linkText: '',
  linkUrl: '',
};

const draftKey = (eventId: string) => `event-email-draft-${eventId}`;

const loadDraft = (eventId: string): EmailDraft => {
  try {
    const stored = localStorage.getItem(draftKey(eventId));
    if (!stored) return EMPTY_DRAFT;
    const parsed = JSON.parse(stored);
    return {
      subject: typeof parsed?.subject === 'string' ? parsed.subject : '',
      body: typeof parsed?.body === 'string' ? parsed.body : '',
      linkText: typeof parsed?.linkText === 'string' ? parsed.linkText : '',
      linkUrl: typeof parsed?.linkUrl === 'string' ? parsed.linkUrl : '',
    };
  } catch {
    return EMPTY_DRAFT;
  }
};

interface Props {
  eventId: string;
  closeModal: () => void;
}

const EventEmailAttendeesModal = ({ eventId, closeModal }: Props) => {
  const t = useTranslations();

  const [draft, setDraft] = useState<EmailDraft>(() => loadDraft(eventId));
  const [isSending, setIsSending] = useState(false);
  const [sentCount, setSentCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Keep the draft on this device until it is actually sent, so closing the
    // modal (or the tab) loses nothing.
    if (sentCount !== null) return;
    try {
      localStorage.setItem(draftKey(eventId), JSON.stringify(draft));
    } catch {
      // Storage full or unavailable — the draft just won't persist.
    }
  }, [draft, eventId, sentCount]);

  const setField = (field: keyof EmailDraft) => (value: string) =>
    setDraft((current) => ({ ...current, [field]: value }));

  const canSend =
    draft.subject.trim().length > 0 &&
    draft.subject.trim().length <= MAX_SUBJECT_LENGTH &&
    draft.body.trim().length > 0 &&
    draft.body.trim().length <= MAX_BODY_LENGTH;

  const send = async () => {
    setError(null);
    setIsSending(true);
    try {
      const { data } = await api.post(`/events/${eventId}/email-attendees`, {
        subject: draft.subject.trim(),
        body: draft.body.trim(),
        linkText: draft.linkText.trim(),
        linkUrl: draft.linkUrl.trim(),
      });
      setSentCount(data?.sent ?? 0);
      try {
        localStorage.removeItem(draftKey(eventId));
      } catch {
        // Nothing to clean up if storage is unavailable.
      }
    } catch (err) {
      setError(parseMessageFromError(err));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Modal closeModal={closeModal}>
      {sentCount !== null ? (
        <div className="flex flex-col gap-4">
          <Heading level={4}>{t('event_email_attendees_title')}</Heading>
          <p>{t('event_email_attendees_success', { count: sentCount })}</p>
          <Button onClick={closeModal}>
            {t('event_email_attendees_close_button')}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <Heading level={4}>{t('event_email_attendees_title')}</Heading>
          <p className="text-sm text-gray-600">
            {t('event_email_attendees_description')}
          </p>
          <Input
            label={t('event_email_attendees_subject_label')}
            value={draft.subject}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setField('subject')(e.target.value)
            }
            placeholder={t('event_email_attendees_subject_placeholder')}
            isRequired
          />
          <label className="flex flex-col gap-1 text-sm font-medium">
            {t('event_email_attendees_body_label')}
            <Textarea
              value={draft.body}
              onChange={(e) => setField('body')(e.target.value)}
              placeholder={t('event_email_attendees_body_placeholder')}
              className="min-h-[160px] text-base font-normal"
              maxLength={MAX_BODY_LENGTH}
            />
          </label>
          <Input
            label={t('event_email_attendees_link_url_label')}
            value={draft.linkUrl}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setField('linkUrl')(e.target.value)
            }
            placeholder="https://"
            type="url"
          />
          {draft.linkUrl.trim() && (
            <Input
              label={t('event_email_attendees_link_text_label')}
              value={draft.linkText}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setField('linkText')(e.target.value)
              }
              placeholder={t('event_email_attendees_link_text_placeholder')}
            />
          )}
          <p className="text-xs text-gray-500">
            {t('event_email_attendees_draft_note')}
          </p>
          {error && <ErrorMessage error={error} />}
          <Button onClick={send} isEnabled={canSend} isLoading={isSending}>
            {t('event_email_attendees_send_button')}
          </Button>
        </div>
      )}
    </Modal>
  );
};

export default EventEmailAttendeesModal;
