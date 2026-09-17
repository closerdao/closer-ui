import { useEffect, useState } from 'react';

import dayjs from 'dayjs';
import { Check } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Lead } from '../../types/lead';
import {
  dateTimeInputValue,
  leadCallDoneAt,
  leadCallIsOverdue,
  leadCallScheduledAt,
  leadId,
} from '../../utils/leads.helpers';
import TimeSince from '../TimeSince';
import { Button, Textarea } from '../ui';

interface Props {
  lead: Lead;
  isBusy: boolean;
  /** What was said, edited as part of the card's draft. */
  transcript: string;
  onTranscriptChange: (value: string) => void;
  /** Books the call for an ISO timestamp; `null` unbooks it. */
  onSchedule: (scheduledAt: string | null) => void;
  /** Marks the call done, taking the transcript typed so far with it. */
  onDone: () => void;
  /** A call marked done by mistake. */
  onReopen: () => void;
  onSaveTranscript: () => void;
}

/** The id of the date field, so the row's button can put the cursor in it. */
export const leadCallInputId = (lead: Lead) => `lead-call-at-${leadId(lead)}`;

const CALL_TIME_FORMAT = 'D MMM YYYY, HH:mm';

/**
 * The call with the lead: book it, mark it done, paste what was said. The
 * transcript is saved by its own button rather than on blur like the card's
 * other fields - the natural move after pasting is straight to "mark as
 * done", and a save-on-blur would disable that button under the click.
 */
const LeadCall = ({
  lead,
  isBusy,
  transcript,
  onTranscriptChange,
  onSchedule,
  onDone,
  onReopen,
  onSaveTranscript,
}: Props) => {
  const t = useTranslations();
  const scheduledAt = leadCallScheduledAt(lead);
  const doneAt = leadCallDoneAt(lead);
  const overdue = leadCallIsOverdue(lead);
  const inputId = leadCallInputId(lead);
  const transcriptId = `lead-call-transcript-${leadId(lead)}`;

  const [when, setWhen] = useState(dateTimeInputValue(scheduledAt));
  // Follows the lead: a booking made elsewhere replaces what the field held.
  useEffect(() => {
    setWhen(dateTimeInputValue(scheduledAt));
  }, [scheduledAt]);

  const whenIsValid = Boolean(when) && dayjs(when).isValid();
  const whenChanged = when !== dateTimeInputValue(scheduledAt);
  const transcriptChanged = transcript !== (lead.call?.transcript ?? '');

  return (
    <div className="flex flex-col gap-3" data-testid="lead-call">
      <p
        className={`text-sm ${
          doneAt ? 'text-green-700' : overdue ? 'text-red-600' : 'text-gray-600'
        }`}
        data-testid="lead-call-status"
      >
        {doneAt ? (
          <span className="inline-flex items-center gap-1.5">
            <Check size={14} aria-hidden="true" />
            {t('dashboard_leads_call_status_done')} <TimeSince time={doneAt} />
          </span>
        ) : scheduledAt ? (
          t(
            overdue
              ? 'dashboard_leads_call_status_overdue'
              : 'dashboard_leads_call_status_scheduled',
            { when: dayjs(scheduledAt).format(CALL_TIME_FORMAT) },
          )
        ) : (
          t('dashboard_leads_call_status_none')
        )}
      </p>

      <div className="flex flex-wrap items-end gap-2">
        <div className="flex flex-col gap-1">
          <label htmlFor={inputId} className="text-xs text-gray-500">
            {t('dashboard_leads_call_when_label')}
          </label>
          <input
            id={inputId}
            type="datetime-local"
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm bg-white"
            value={when}
            disabled={isBusy}
            onChange={(e) => setWhen(e.target.value)}
          />
        </div>
        <Button
          size="small"
          variant={scheduledAt || doneAt ? 'secondary' : 'primary'}
          isFullWidth={false}
          isEnabled={!isBusy && whenIsValid && whenChanged}
          onClick={() => onSchedule(dayjs(when).toISOString())}
        >
          {scheduledAt
            ? t('dashboard_leads_action_reschedule_call')
            : doneAt
              ? t('dashboard_leads_action_schedule_next_call')
              : t('dashboard_leads_action_schedule_call')}
        </Button>
        {scheduledAt && !doneAt ? (
          <Button
            size="small"
            variant="secondary"
            isFullWidth={false}
            isEnabled={!isBusy}
            onClick={() => onSchedule(null)}
          >
            {t('dashboard_leads_action_unschedule_call')}
          </Button>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={transcriptId} className="text-xs text-gray-500">
          {t('dashboard_leads_call_transcript_label')}
        </label>
        <Textarea
          id={transcriptId}
          className="min-h-[8rem] max-h-[24rem] font-mono text-xs"
          value={transcript}
          placeholder={t('dashboard_leads_call_transcript_placeholder')}
          disabled={isBusy}
          onChange={(e) => onTranscriptChange(e.target.value)}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {doneAt ? null : (
          <Button
            size="small"
            variant="primary"
            isFullWidth={false}
            isEnabled={!isBusy}
            onClick={onDone}
          >
            {t('dashboard_leads_action_call_done')}
          </Button>
        )}
        {/* Once the call is done, or for notes taken ahead of it. */}
        {doneAt || transcriptChanged ? (
          <Button
            size="small"
            variant={doneAt ? 'primary' : 'secondary'}
            isFullWidth={false}
            isEnabled={!isBusy && transcriptChanged}
            onClick={onSaveTranscript}
          >
            {t('dashboard_leads_action_save_transcript')}
          </Button>
        ) : null}
        {transcriptChanged ? (
          <span className="text-xs text-amber-800">
            {t('dashboard_leads_call_transcript_unsaved')}
          </span>
        ) : null}
        {doneAt ? (
          <Button
            size="small"
            variant="secondary"
            isFullWidth={false}
            isEnabled={!isBusy}
            onClick={onReopen}
          >
            {t('dashboard_leads_action_call_reopen')}
          </Button>
        ) : null}
      </div>
    </div>
  );
};

export default LeadCall;
