import { useEffect, useMemo, useRef, useState } from 'react';

import { useTranslations } from 'next-intl';

import { Question, QuestionnaireItemHandle } from '../../types';
import {
  getBookingAnswers,
  getBookingQuestionnaire,
} from '../../utils/booking.helpers';
import { parseMessageFromError } from '../../utils/common';
import QuestionnaireItem from '../QuestionnaireItem';
import BookingSurface, {
  BookingSectionEyebrow,
} from '../booking/bookingSurface';
import { Button, ErrorMessage } from '../ui';

interface Props {
  /**
   * `booking.fields` — one single-key object per question, keyed by the question
   * label the guest was shown (see `Booking['fields']`).
   */
  fields?: { [key: string]: string }[] | null;
  /**
   * The event's custom questions. Given them, unanswered ones are listed too —
   * without them only answers can be shown, since the questions are unknown.
   */
  questions?: Question[];
  /**
   * Turns the section into a form. Receives the full `fields` array to persist.
   */
  onSave?: (fields: { [key: string]: string }[]) => Promise<void>;
  /** Renders as a bare list, for use inside an existing surface such as a card. */
  compact?: boolean;
  className?: string;
}

const upsertAnswer = (
  answers: { [key: string]: string }[],
  name: string,
  value: string,
): { [key: string]: string }[] => {
  const hasEntry = answers.some((answer) => Object.keys(answer)[0] === name);
  if (!hasEntry) {
    return [...answers, { [name]: value }];
  }
  return answers.map((answer) =>
    Object.keys(answer)[0] === name ? { [name]: value } : answer,
  );
};

const BookingQuestionnaireAnswers = ({
  fields,
  questions,
  onSave,
  compact = false,
  className,
}: Props) => {
  const t = useTranslations();

  const entries = useMemo<{ question: Question; answer: string }[]>(() => {
    if (questions?.length) {
      return getBookingQuestionnaire(questions, fields);
    }
    return getBookingAnswers(fields).map(({ question, answer }) => ({
      question: { name: question, type: 'text' as const, options: [] },
      answer,
    }));
  }, [questions, fields]);

  const unansweredCount = entries.filter(
    ({ answer }) => answer.trim() === '',
  ).length;
  const answeredCount = entries.length - unansweredCount;
  const canEdit = Boolean(onSave) && Boolean(questions?.length);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ [key: string]: string }[]>([]);
  const draftRef = useRef(draft);
  draftRef.current = draft;

  // The booking reloads after a save, so the draft is seeded from the entries
  // each time the form opens rather than held across renders.
  useEffect(() => {
    if (!isEditing) return;
    setDraft(
      entries.map(({ question, answer }) => ({ [question.name]: answer })),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing]);

  const itemRefs = useRef(new Map<string, QuestionnaireItemHandle>());

  const handleAnswer = (name: string, value: string) => {
    setDraft((previous) => upsertAnswer(previous, name, value));
  };

  const handleSave = async () => {
    if (!onSave) return;
    // QuestionnaireItem debounces what it reports, so a save landing right
    // after the last keystroke would otherwise drop it.
    let next = draftRef.current;
    itemRefs.current.forEach((item) => {
      const { name, value } = item.flush();
      next = upsertAnswer(next, name, value);
    });
    setDraft(next);

    setIsSaving(true);
    setSaveError(null);
    try {
      await onSave(next);
      setIsEditing(false);
    } catch (error) {
      setSaveError(parseMessageFromError(error));
    } finally {
      setIsSaving(false);
    }
  };

  if (!entries.length) {
    return null;
  }

  const getDraftAnswer = (name: string) => {
    const entry = draft.find((answer) => Object.keys(answer)[0] === name);
    return entry ? entry[name] ?? '' : '';
  };

  const form = (
    <div className="flex flex-col gap-4">
      {entries.map(({ question }) => (
        <QuestionnaireItem
          key={question.name}
          question={question}
          savedAnswer={getDraftAnswer(question.name)}
          handleAnswer={handleAnswer}
          className="mb-0"
          ref={(handle) => {
            if (handle) {
              itemRefs.current.set(question.name, handle);
            } else {
              itemRefs.current.delete(question.name);
            }
          }}
        />
      ))}
      {saveError && <ErrorMessage error={saveError} />}
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={handleSave}
          isLoading={isSaving}
          isEnabled={!isSaving}
          isFullWidth={false}
          size="small"
        >
          {t('booking_details_questionnaire_save')}
        </Button>
        <Button
          onClick={() => {
            setSaveError(null);
            setIsEditing(false);
          }}
          variant="secondary"
          size="small"
          isFullWidth={false}
          isEnabled={!isSaving}
        >
          {t('generic_cancel')}
        </Button>
      </div>
    </div>
  );

  const list = (
    <div className="flex flex-col">
      {entries.map(({ question, answer }) => (
        <div
          key={question.name}
          className="flex flex-col gap-1 py-2 border-b border-line last:border-b-0 last:pb-0 first:pt-0"
        >
          <span className="text-xs uppercase tracking-wide text-complimentary-light">
            {question.name}
          </span>
          {answer.trim() ? (
            <p className="text-sm whitespace-pre-line break-words">{answer}</p>
          ) : (
            <p className="text-sm italic text-complimentary-light">
              {t('booking_details_questionnaire_unanswered')}
            </p>
          )}
        </div>
      ))}
    </div>
  );

  const body = (
    <>
      {isEditing ? form : list}
      {canEdit && !isEditing && (
        <div>
          <Button
            onClick={() => setIsEditing(true)}
            variant="secondary"
            size="small"
            isFullWidth={false}
          >
            {answeredCount
              ? t('booking_details_questionnaire_edit')
              : t('booking_details_questionnaire_answer')}
          </Button>
        </div>
      )}
    </>
  );

  if (compact) {
    return (
      <div className={className}>
        <BookingSectionEyebrow className="mb-1">
          {t('booking_details_questionnaire_title')}
        </BookingSectionEyebrow>
        {body}
      </div>
    );
  }

  return (
    <BookingSurface
      tone="elevated"
      padding="md"
      className={`flex flex-col gap-3 ${className || ''}`}
    >
      <BookingSectionEyebrow>
        {t('booking_details_questionnaire_title')}
      </BookingSectionEyebrow>
      {canEdit && !isEditing && unansweredCount > 0 && (
        <p className="text-sm text-complimentary-light">
          {t('booking_details_questionnaire_prompt')}
        </p>
      )}
      {body}
    </BookingSurface>
  );
};

export default BookingQuestionnaireAnswers;
