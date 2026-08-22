import { ChangeEvent, ReactNode } from 'react';

import { Button, Input, Textarea } from '../ui';

import { Carrot, ChevronDown } from 'lucide-react';
import { useTranslations } from 'next-intl';

import {
  EngagementDraftFields,
  EngagementOpportunity,
  EngagementOpportunityStatus,
} from '../../types/engagement';
import {
  bodyWordCount,
  copyIsAiDrafted,
  copyProviderKey,
  ENGAGEMENT_BODY_MAX_WORDS,
  ENGAGEMENT_BODY_MIN_WORDS,
  hostBriefText,
  journeyHighlights,
  managedByDisplayLines,
  markdownLinks,
  opportunityDaysUntilExpiry,
  opportunityEnrichmentPending,
  opportunityId,
  opportunityIsActionable,
  rewardCreditsAwarded,
  rewardMessage,
  rewardSource,
} from '../../utils/engagement.helpers';

interface Props {
  opportunity: EngagementOpportunity;
  draft: EngagementDraftFields;
  rewardAmount: number;
  isExpanded: boolean;
  isBusy: boolean;
  canApproveSend: boolean;
  onToggle: () => void;
  onDraftChange: (field: keyof EngagementDraftFields, value: string) => void;
  onRewardChange: (amount: number) => void;
  onRewardBlur: () => void;
  onPreview: () => void;
  onApprove: () => void;
  onDismiss: () => void;
  onStatusChange: (status: EngagementOpportunityStatus) => void;
}

const Pill = ({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'accent' | 'warning' | 'urgent';
}) => {
  const tones = {
    neutral: 'bg-gray-100 text-gray-700',
    accent: 'bg-accent-light text-accent',
    warning: 'bg-amber-100 text-amber-800',
    urgent: 'bg-red-100 text-red-800',
  };
  return (
    <span
      className={`text-xs font-medium rounded-full px-2.5 py-0.5 whitespace-nowrap ${tones[tone]}`}
    >
      {children}
    </span>
  );
};

const Section = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => (
  <div className="flex flex-col gap-1.5">
    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
      {title}
    </span>
    {children}
  </div>
);

/**
 * One row of the approval queue: a scannable summary that expands into the
 * working panel. Only one card is open at a time, so the queue stays readable
 * at a glance instead of being twenty stacked email forms.
 */
const EngagementOpportunityCard = ({
  opportunity: row,
  draft,
  rewardAmount,
  isExpanded,
  isBusy,
  canApproveSend,
  onToggle,
  onDraftChange,
  onRewardChange,
  onRewardBlur,
  onPreview,
  onApprove,
  onDismiss,
  onStatusChange,
}: Props) => {
  const t = useTranslations();
  /**
   * Stages, statuses, cohorts and email types are open sets defined by the API,
   * so a new value can arrive before it has a translation. `t.has` is checked
   * first because calling `t()` on an unknown key logs a MISSING_MESSAGE error
   * even when the caller handles the fallback.
   */
  const labelFor = (prefix: string, value: string | undefined) => {
    if (!value) return '';
    const key = `${prefix}${value}`;
    return t.has(key) ? t(key) : value;
  };
  const id = opportunityId(row);
  const panelId = `engagement-panel-${id}`;

  const name = row.signals?.name?.trim();
  const email = row.email?.trim();
  const daysLeft = opportunityDaysUntilExpiry(row);
  const canAct = opportunityIsActionable(row);
  const enrichmentPending = opportunityEnrichmentPending(row);
  const awarded = rewardCreditsAwarded(row);
  const highlights = journeyHighlights(row);
  const reasons = row.signals?.reasons ?? [];
  const nextSteps = row.recommendedNextSteps ?? [];
  const brief = hostBriefText(row) || draft.hostBrief;
  const emailTypeLabel = labelFor('engagement_email_type_', row.emailType);
  const provider = row.aiMeta?.provider;
  const isAiDrafted = copyIsAiDrafted(provider);
  const voice = row.aiMeta?.voice;
  const bodyLinks = markdownLinks(draft.body);
  const words = bodyWordCount(draft.body);
  const wordsOffTarget =
    words > 0 &&
    (words < ENGAGEMENT_BODY_MIN_WORDS || words > ENGAGEMENT_BODY_MAX_WORDS);
  const stageLabel = labelFor('engagement_stage_', row.stage);
  const managedLines = managedByDisplayLines(row);
  const reward = { message: rewardMessage(row), source: rewardSource(row) };

  return (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isExpanded}
        aria-controls={panelId}
        className="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors"
      >
        <div className="flex flex-col gap-1.5 min-w-0 grow">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="font-medium text-gray-900 break-words">
              {name || email || '—'}
            </span>
            {name && email ? (
              <span className="text-sm text-gray-500 break-all">{email}</span>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {emailTypeLabel ? (
              <Pill tone="accent">{emailTypeLabel}</Pill>
            ) : null}
            {/* A reconnect row's stage repeats its email type — show it once. */}
            {stageLabel && stageLabel !== emailTypeLabel ? (
              <Pill>{stageLabel}</Pill>
            ) : null}
            {row.cohort ? (
              <Pill>{labelFor('engagement_cohort_', row.cohort)}</Pill>
            ) : null}
            {row.score != null ? (
              <Pill tone={row.priority === 'high' ? 'warning' : 'neutral'}>
                {row.priority
                  ? `${labelFor('engagement_priority_', row.priority)} · ${row.score}`
                  : String(row.score)}
              </Pill>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <div className="flex items-center gap-2">
            {row.status ? (
              <span className="text-xs font-medium uppercase tracking-wide text-gray-600">
                {labelFor('engagement_status_', row.status)}
              </span>
            ) : null}
            <ChevronDown
              className={`h-4 w-4 text-gray-400 transition-transform ${
                isExpanded ? 'rotate-180' : ''
              }`}
              aria-hidden
            />
          </div>
          {daysLeft != null ? (
            <Pill tone={daysLeft <= 3 ? 'urgent' : 'neutral'}>
              {daysLeft === 0
                ? t('engagement_expires_today')
                : t('engagement_expires_in', { days: daysLeft })}
            </Pill>
          ) : null}
        </div>
      </button>

      {isExpanded ? (
        <div
          id={panelId}
          className="border-t border-gray-100 px-4 py-4 flex flex-col gap-5"
        >
          {enrichmentPending ? (
            <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-md px-3 py-2">
              {t('engagement_enrichment_pending')}
            </p>
          ) : null}

          {brief ? (
            <p className="text-sm text-gray-700 leading-relaxed">{brief}</p>
          ) : null}

          {highlights.length > 0 ? (
            <Section title={t('engagement_section_journey')}>
              <div className="flex flex-wrap gap-1.5">
                {highlights.map((highlight) => (
                  <span
                    key={highlight}
                    className="text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-md px-2 py-1"
                  >
                    {highlight}
                  </span>
                ))}
              </div>
            </Section>
          ) : null}

          {reasons.length > 0 || nextSteps.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-5">
              {reasons.length > 0 ? (
                <Section title={t('engagement_section_signals')}>
                  <ul className="text-sm text-gray-600 list-disc list-outside pl-4 flex flex-col gap-0.5">
                    {reasons.map((reason) => (
                      <li key={reason}>{reason}</li>
                    ))}
                  </ul>
                </Section>
              ) : null}
              {nextSteps.length > 0 ? (
                <Section title={t('engagement_section_next_steps')}>
                  <ul className="text-sm text-gray-600 list-disc list-outside pl-4 flex flex-col gap-0.5">
                    {nextSteps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ul>
                </Section>
              ) : null}
            </div>
          ) : null}

          <div className="flex flex-col gap-3 rounded-md border border-gray-200 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {t('engagement_section_draft')}
              </span>
              {provider ? (
                <Pill tone={isAiDrafted ? 'neutral' : 'warning'}>
                  {t(copyProviderKey(provider))}
                </Pill>
              ) : null}
            </div>

            <label
              className="text-xs font-medium text-gray-600"
              htmlFor={`subject-${id}`}
            >
              {t('engagement_draft_subject')}
            </label>
            <Input
              id={`subject-${id}`}
              value={draft.subject}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                onDraftChange('subject', e.target.value)
              }
              isDisabled={isBusy}
              placeholder={t('engagement_draft_subject')}
            />

            <label
              className="text-xs font-medium text-gray-600"
              htmlFor={`body-${id}`}
            >
              {t('engagement_draft_body')}
            </label>
            <Textarea
              id={`body-${id}`}
              value={draft.body}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                onDraftChange('body', e.target.value)
              }
              disabled={isBusy}
              rows={12}
              placeholder={t('engagement_draft_body')}
            />
            <p
              className={`text-xs ${
                wordsOffTarget ? 'text-amber-700' : 'text-gray-500'
              }`}
            >
              {t('engagement_draft_word_count', {
                words,
                min: ENGAGEMENT_BODY_MIN_WORDS,
                max: ENGAGEMENT_BODY_MAX_WORDS,
              })}
            </p>

            {/* The renderer turns these into anchors, so check them here. */}
            {bodyLinks.length > 0 ? (
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-gray-600">
                  {t('engagement_draft_links')}
                </span>
                <ul className="flex flex-col gap-0.5">
                  {bodyLinks.map((link) => (
                    <li key={`${link.text}-${link.url}`} className="text-sm">
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent underline break-all"
                      >
                        {link.text}
                      </a>{' '}
                      <span className="text-gray-400 break-all">
                        {link.url}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label
                  className="text-xs font-medium text-gray-600"
                  htmlFor={`cta-text-${id}`}
                >
                  {t('engagement_draft_cta_text')}
                </label>
                <Input
                  id={`cta-text-${id}`}
                  value={draft.ctaText}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    onDraftChange('ctaText', e.target.value)
                  }
                  isDisabled={isBusy}
                  placeholder={t('engagement_draft_cta_text')}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label
                  className="text-xs font-medium text-gray-600"
                  htmlFor={`cta-link-${id}`}
                >
                  {t('engagement_draft_cta_link')}
                </label>
                <Input
                  id={`cta-link-${id}`}
                  value={draft.ctaLink}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    onDraftChange('ctaLink', e.target.value)
                  }
                  isDisabled={isBusy}
                  placeholder={t('engagement_draft_cta_link')}
                />
              </div>
            </div>

            {isAiDrafted && voice?.exampleIds?.length ? (
              <details className="text-xs text-gray-500">
                <summary className="cursor-pointer">
                  {t('engagement_voice_why')}
                </summary>
                <p className="pt-1.5 leading-relaxed">
                  {t('engagement_voice_explainer')}
                  {voice.tags?.length ? ` · ${voice.tags.join(', ')}` : ''}
                </p>
                <p className="pt-1 font-mono break-all">
                  {voice.exampleIds.join(', ')}
                </p>
              </details>
            ) : null}
          </div>

          <div className="rounded-md border border-amber-100 bg-amber-50/60 px-3 py-3 flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Carrot
                className="h-5 w-5 text-orange-500 shrink-0"
                strokeWidth={1.75}
                aria-hidden
              />
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide grow">
                {t('engagement_section_reward')}
              </span>
              {awarded ? (
                <span className="text-sm text-gray-700">
                  {t('engagement_reward_issued')}
                </span>
              ) : (
                <>
                  <label className="sr-only" htmlFor={`reward-${id}`}>
                    {t('engagement_reward_amount')}
                  </label>
                  <input
                    id={`reward-${id}`}
                    type="number"
                    min={0}
                    max={2}
                    step={1}
                    className="w-16 border border-gray-300 rounded-md px-2 py-1.5 text-sm"
                    value={rewardAmount}
                    disabled={isBusy}
                    onChange={(e) => onRewardChange(Number(e.target.value))}
                    onBlur={onRewardBlur}
                  />
                  <span className="text-sm text-gray-600">
                    {t('engagement_reward_credits')}
                  </span>
                </>
              )}
            </div>
            {reward.message ? (
              <p className="text-sm text-gray-700">{reward.message}</p>
            ) : null}
            {reward.source ? (
              <p className="text-xs text-gray-500 font-mono break-all">
                {reward.source}
              </p>
            ) : null}
          </div>

          {managedLines.length > 0 ? (
            <p className="text-sm text-gray-600 break-words">
              <span className="font-medium text-gray-700">
                {t('engagement_col_managed')}:{' '}
              </span>
              {managedLines.join(' · ')}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-4">
            {canApproveSend && canAct && (
              <Button
                type="button"
                variant="primary"
                size="small"
                isFullWidth={false}
                isEnabled={!isBusy && !enrichmentPending}
                isLoading={isBusy}
                onClick={onApprove}
              >
                {t('engagement_action_approve_send')}
              </Button>
            )}
            <Button
              type="button"
              variant="secondary"
              size="small"
              isFullWidth={false}
              isEnabled={!isBusy}
              onClick={onPreview}
            >
              {t('engagement_action_preview_email')}
            </Button>
            {canAct && row.status !== 'contacted' && (
              <Button
                type="button"
                variant="secondary"
                size="small"
                isFullWidth={false}
                isEnabled={!isBusy}
                onClick={() => onStatusChange('contacted')}
              >
                {t('engagement_action_mark_contacted')}
              </Button>
            )}
            {canAct && (
              <Button
                type="button"
                variant="secondary"
                size="small"
                isFullWidth={false}
                isEnabled={!isBusy}
                onClick={() => onStatusChange('converted')}
              >
                {t('engagement_action_mark_converted')}
              </Button>
            )}
            {canAct && (
              <Button
                type="button"
                variant="secondary"
                size="small"
                isFullWidth={false}
                isEnabled={!isBusy}
                onClick={onDismiss}
              >
                {t('engagement_action_dismiss')}
              </Button>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default EngagementOpportunityCard;
