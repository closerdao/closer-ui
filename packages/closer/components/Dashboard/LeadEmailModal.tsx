import { useCallback, useEffect, useRef, useState } from 'react';

import { useTranslations } from 'next-intl';

import {
  LeadEmailBatchParams,
  LeadEmailBatchResult,
  LeadEmailPreview,
  LeadEmailRecipient,
  LeadEmailTemplate,
  LeadType,
} from '../../types/lead';
import { parseMessageFromError } from '../../utils/common';
import { defaultLeadEmailTemplate } from '../../utils/leads.helpers';
import Modal from '../Modal';
import { Button, Checkbox, Spinner, Textarea } from '../ui';

/** Typing in the message pauses this long before the preview re-renders. */
const PREVIEW_DEBOUNCE_MS = 500;

/**
 * The email body inside the page's own font. The template's own styles still
 * win — this is the base a bare document would otherwise render in serif.
 */
export function previewSrcDoc(body: string, fontFamily: string): string {
  const family = fontFamily.replace(/[<>]/g, '').trim();
  const rule = family ? `font-family:${family};` : '';
  return `<style>body{margin:0;${rule}font-size:14px;line-height:1.5;color:#111827}</style>${body}`;
}

/** Only a row the API would send to can be picked; the rest are greyed out. */
export const recipientIsSendable = (entry: LeadEmailRecipient): boolean =>
  !entry.status || entry.status === 'would_send';

const chipClass = (selected: boolean, sendable = true) =>
  `text-sm rounded-full px-2.5 py-0.5 border transition-colors max-w-full truncate ${
    !sendable
      ? 'bg-gray-50 text-gray-400 border-gray-100 line-through cursor-not-allowed'
      : selected
      ? 'bg-accent text-white border-accent'
      : 'bg-gray-100 text-gray-800 border-gray-200 hover:border-gray-400'
  }`;

const LABEL_CLASS =
  'text-xs font-semibold text-gray-500 uppercase tracking-wide';
const CONTROL_CLASS =
  'border border-gray-300 rounded-md px-3 py-2 text-sm bg-white w-full';

interface LeadEmailModalProps {
  /** The templates offered, from `GET /leads/actions`. */
  templates: LeadEmailTemplate[];
  /** Why the template list is empty, when it is the request that failed. */
  templatesError?: string | null;
  /** Restricts the batch to one pipeline; undefined reaches every lead. */
  type?: LeadType;
  onClose: () => void;
  /** Called once a batch has gone out, so the board can pick up the timeline. */
  onSent: (result: LeadEmailBatchResult) => void;
  previewEmail: (params: LeadEmailBatchParams) => Promise<LeadEmailPreview>;
  sendEmail: (params: LeadEmailBatchParams) => Promise<LeadEmailBatchResult>;
}

/**
 * Send one CRM template to every lead who has not had it. The API decides who
 * qualifies and what the next step in the email is; this modal lets the sender
 * pick the template, add their own words, read the result as one recipient
 * would, and confirm before anything goes out.
 */
const LeadEmailModal = ({
  templates,
  templatesError = null,
  type,
  onClose,
  onSent,
  previewEmail,
  sendEmail,
}: LeadEmailModalProps) => {
  const t = useTranslations();
  const [templateKey, setTemplateKey] = useState(() =>
    defaultLeadEmailTemplate(templates),
  );
  const [applicantsOnly, setApplicantsOnly] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [preview, setPreview] = useState<LeadEmailPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<LeadEmailBatchResult | null>(null);
  /** 'all' sends the whole batch; a lead id previews and sends to that one person. */
  const [recipient, setRecipient] = useState<string>('all');
  /** The page's own font, so the preview reads like the app rather than a bare document. */
  const [previewFont, setPreviewFont] = useState('');
  // A preview that lands after a newer one was requested is thrown away.
  const requestSeq = useRef(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setPreviewFont(window.getComputedStyle(document.body).fontFamily || '');
  }, []);

  useEffect(() => {
    if (templates.some((entry) => entry.key === templateKey)) return;
    setTemplateKey(defaultLeadEmailTemplate(templates));
  }, [templates, templateKey]);

  const template = templates.find((entry) => entry.key === templateKey);

  const batchParams = useCallback(
    (): LeadEmailBatchParams => ({
      send: templateKey,
      type,
      // Sent only when set: the API reads `applicantsOnly=false` as a filter too.
      applicantsOnly: applicantsOnly || undefined,
      subject: subject.trim() || undefined,
      message: message.trim() || undefined,
    }),
    [templateKey, type, applicantsOnly, subject, message],
  );

  const loadPreview = useCallback(async () => {
    if (!templateKey) return;
    const seq = ++requestSeq.current;
    setLoading(true);
    setError(null);
    try {
      const next = await previewEmail({
        ...batchParams(),
        // Preview-only: the send goes to everyone regardless of who was read.
        sampleId: recipient === 'all' ? undefined : recipient,
      });
      if (seq !== requestSeq.current) return;
      setPreview(next);
      // A person who dropped out of the batch cannot stay selected.
      if (
        recipient !== 'all' &&
        !(next.recipients ?? []).some((entry) => entry.leadId === recipient)
      ) {
        setRecipient('all');
      }
    } catch (err) {
      if (seq !== requestSeq.current) return;
      setPreview(null);
      setError(parseMessageFromError(err));
    } finally {
      if (seq === requestSeq.current) setLoading(false);
    }
  }, [templateKey, previewEmail, batchParams, recipient]);

  // The template switch re-previews at once; typing waits for a pause.
  useEffect(() => {
    if (result) return;
    setConfirming(false);
    const timer = setTimeout(loadPreview, PREVIEW_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [loadPreview, result]);

  const candidates = preview?.candidates ?? preview?.recipients?.length ?? 0;
  const singleRecipient = recipient === 'all' ? null : recipient;
  /** What the send button promises: one person, or everyone left in the batch. */
  const sendCount = singleRecipient ? 1 : candidates;
  const emailDisabled = preview?.sample?.emailEnabled === false;
  const canSend =
    Boolean(templateKey) &&
    sendCount > 0 &&
    !loading &&
    !sending &&
    !emailDisabled;

  const send = async () => {
    setSending(true);
    setError(null);
    try {
      const outcome = await sendEmail({
        ...batchParams(),
        ...(singleRecipient ? { leadIds: [singleRecipient] } : {}),
      });
      setResult(outcome);
      setConfirming(false);
      onSent(outcome);
    } catch (err) {
      setError(parseMessageFromError(err));
    } finally {
      setSending(false);
    }
  };

  const recipients = preview?.recipients ?? [];
  const sample = preview?.sample ?? null;
  const previewDocument = sample?.body
    ? previewSrcDoc(sample.body, previewFont)
    : '';

  return (
    <Modal closeModal={onClose} className="md:w-[760px] lg:w-[920px]">
      <div className="flex flex-col gap-4 pr-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-gray-900">
            {t('dashboard_leads_email_modal_title')}
          </h2>
          <p className="text-sm text-gray-600">
            {t('dashboard_leads_email_modal_subtitle')}
          </p>
        </div>

        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        {result ? (
          <div className="flex flex-col gap-3" data-testid="lead-email-result">
            <p className="text-sm text-gray-900 font-medium">
              {t('dashboard_leads_email_sent_summary', {
                sent: result.sent ?? 0,
                skipped: result.skipped ?? 0,
                failed: result.failed ?? 0,
              })}
            </p>
            {result.results?.length ? (
              <ul className="text-sm text-gray-700 flex flex-col gap-1 max-h-[280px] overflow-y-auto border border-gray-200 rounded-md px-3 py-2">
                {result.results.map((entry, index) => (
                  <li
                    key={entry.leadId ?? `${entry.email}-${index}`}
                    className="flex flex-wrap justify-between gap-2"
                  >
                    <span className="break-all">
                      {entry.projectName || entry.email}
                    </span>
                    <span className="text-gray-500">
                      {entry.status}
                      {entry.reason ? ` · ${entry.reason}` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
            <div>
              <Button
                type="button"
                variant="secondary"
                isFullWidth={false}
                onClick={onClose}
              >
                {t('dashboard_leads_email_close')}
              </Button>
            </div>
          </div>
        ) : (
          <>
            {templates.length === 0 ? (
              templatesError ? (
                <p className="text-sm text-red-600" role="alert">
                  {t('dashboard_leads_email_templates_failed', {
                    error: templatesError,
                  })}
                </p>
              ) : (
                <p className="text-sm text-gray-600">
                  {t('dashboard_leads_email_no_templates')}
                </p>
              )
            ) : (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="lead-email-template" className={LABEL_CLASS}>
                  {t('dashboard_leads_email_template_label')}
                </label>
                <select
                  id="lead-email-template"
                  className={CONTROL_CLASS}
                  value={templateKey}
                  disabled={sending}
                  onChange={(e) => setTemplateKey(e.target.value)}
                >
                  {templates.map((entry) => (
                    <option key={entry.key} value={entry.key}>
                      {entry.name}
                    </option>
                  ))}
                </select>
                {template?.description && (
                  <p className="text-xs text-gray-500">
                    {template.description}
                  </p>
                )}
              </div>
            )}

            <Checkbox
              id="lead-email-applicants-only"
              className="mb-0"
              isChecked={applicantsOnly}
              isEnabled={!sending}
              onChange={(e) => setApplicantsOnly(e.target.checked)}
            >
              <span className="flex flex-col text-sm font-normal text-gray-700">
                <span>{t('dashboard_leads_email_applicants_only')}</span>
                <span className="text-xs text-gray-500">
                  {t('dashboard_leads_email_applicants_only_hint')}
                </span>
              </span>
            </Checkbox>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="lead-email-subject" className={LABEL_CLASS}>
                {t('dashboard_leads_email_subject_label')}
              </label>
              <input
                id="lead-email-subject"
                type="text"
                className={CONTROL_CLASS}
                placeholder={
                  sample?.subject ||
                  t('dashboard_leads_email_subject_placeholder')
                }
                value={subject}
                disabled={sending}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="lead-email-message" className={LABEL_CLASS}>
                {t('dashboard_leads_email_message_label')}
              </label>
              <Textarea
                id="lead-email-message"
                value={message}
                disabled={sending}
                placeholder={t('dashboard_leads_email_message_placeholder')}
                onChange={(e) => setMessage(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                {t('dashboard_leads_email_message_hint')}
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className={LABEL_CLASS}>
                  {t('dashboard_leads_email_to_label')}
                </span>
                <span className="text-xs text-gray-500">
                  {t('dashboard_leads_email_recipients_label', {
                    count: candidates,
                  })}
                </span>
              </div>
              {recipients.length > 0 ? (
                <div
                  role="listbox"
                  aria-label={t('dashboard_leads_email_to_label')}
                  className="flex flex-wrap gap-1.5 border border-gray-300 rounded-md px-2 py-2 bg-white max-h-36 overflow-y-auto"
                >
                  <button
                    type="button"
                    role="option"
                    aria-selected={recipient === 'all'}
                    disabled={sending}
                    onClick={() => setRecipient('all')}
                    className={chipClass(recipient === 'all')}
                  >
                    {t('dashboard_leads_email_to_all')}
                  </button>
                  {recipients.map((entry, index) => {
                    const id = entry.leadId ?? `${entry.email}-${index}`;
                    const selected =
                      Boolean(entry.leadId) && entry.leadId === recipient;
                    // The API leaves out anyone who already had the template,
                    // but a row it reports as anything other than sendable —
                    // skipped, with its reason — is shown greyed, not offered.
                    const sendable = recipientIsSendable(entry);
                    return (
                      <button
                        key={id}
                        type="button"
                        role="option"
                        aria-selected={selected}
                        aria-disabled={!sendable || undefined}
                        title={
                          sendable
                            ? entry.email
                            : [entry.email, entry.reason]
                                .filter(Boolean)
                                .join(' · ')
                        }
                        disabled={sending || !entry.leadId || !sendable}
                        onClick={() => setRecipient(entry.leadId ?? 'all')}
                        className={chipClass(selected, sendable)}
                      >
                        {entry.projectName || entry.email}
                      </button>
                    );
                  })}
                </div>
              ) : !loading ? (
                <p className="text-sm text-gray-600">
                  {t('dashboard_leads_email_recipients_empty')}
                </p>
              ) : null}
              {recipients.length > 1 && (
                <p className="text-xs text-gray-500">
                  {t('dashboard_leads_email_pick_recipient')}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5 min-w-0">
              <span className={LABEL_CLASS}>
                {t('dashboard_leads_email_preview_label')}
              </span>
              {loading ? (
                <div className="flex justify-center py-12">
                  <Spinner />
                </div>
              ) : sample?.body ? (
                <div className="flex flex-col gap-1.5">
                  <p className="text-sm text-gray-900 font-medium break-words">
                    {sample.subject}
                  </p>
                  <p className="text-xs text-gray-500 break-all">
                    {t('dashboard_leads_email_sample_as', {
                      email: sample.email ?? '',
                    })}
                  </p>
                  <iframe
                    title={t('dashboard_leads_email_preview_label')}
                    srcDoc={previewDocument}
                    className="w-full h-[420px] border border-gray-200 rounded-md bg-white"
                    sandbox=""
                  />
                  {sample.ctaText && (
                    <p className="text-xs text-gray-500 break-all">
                      {sample.ctaText}
                      {sample.ctaLink ? ` → ${sample.ctaLink}` : ''}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-600">
                  {t('dashboard_leads_email_no_recipients')}
                </p>
              )}
            </div>

            {emailDisabled && (
              <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-md px-3 py-2">
                {t('dashboard_leads_email_disabled')}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2 pt-1">
              {confirming ? (
                <>
                  <span className="text-sm text-gray-700">
                    {t('dashboard_leads_email_confirm_hint', {
                      count: sendCount,
                    })}
                  </span>
                  <Button
                    type="button"
                    variant="primary"
                    isFullWidth={false}
                    isEnabled={canSend}
                    isLoading={sending}
                    onClick={send}
                  >
                    {t('dashboard_leads_email_confirm_send')}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    isFullWidth={false}
                    isEnabled={!sending}
                    onClick={() => setConfirming(false)}
                  >
                    {t('dashboard_leads_email_cancel')}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="primary"
                    isFullWidth={false}
                    isEnabled={canSend}
                    onClick={() => setConfirming(true)}
                  >
                    {t('dashboard_leads_email_send', { count: sendCount })}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    isFullWidth={false}
                    isEnabled={Boolean(templateKey) && !loading && !sending}
                    onClick={loadPreview}
                  >
                    {t('dashboard_leads_email_refresh_preview')}
                  </Button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default LeadEmailModal;
