import { ReactNode, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';

import { ChevronDown, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';

import {
  Lead,
  LeadDraftFields,
  LeadFitCheckLine,
  LeadFitExplanation,
  LeadQualificationKey,
} from '../../types/lead';
import {
  fitExplanationOf,
  fitVerdictColor,
  leadBriefIsFallback,
  leadDisplayName,
  leadFactsWithSource,
  leadHistory,
  leadId,
  leadNeedsFitExplanation,
  leadNextActionIsOverdue,
  leadOpenQuestions,
  leadOwnerId,
  leadPrimaryVillage,
  leadQualificationVerdict,
  leadStageKey,
  leadSuggestedCriteria,
  leadTitle,
  leadVillageIsDraft,
  qualificationVerdictColor,
} from '../../utils/leads.helpers';
import { fetchVillageFit } from '../../utils/leads.utils';
import Tag from '../Tag';
import TimeSince from '../TimeSince';
import ExternalLinkDisplay from '../display/externalLinkDisplay';
import { proposalMarkdownComponents } from '../display/proposalMarkdown';
import { Button, Input, LinkButton, Textarea } from '../ui';
import LeadHistory from './LeadHistory';
import LeadNextSteps from './LeadNextSteps';
import LeadPerson from './LeadPerson';
import LeadQualification from './LeadQualification';

export interface LeadOwnerOption {
  value: string;
  label: string;
}

interface Props {
  lead: Lead;
  draft: LeadDraftFields;
  isExpanded: boolean;
  isBusy: boolean;
  /** Managers see the owner picker and the internal score/segment. */
  isManager: boolean;
  canEnrich: boolean;
  ownerName: string | null;
  ownerOptions: LeadOwnerOption[];
  /** Ids resolved to names, for the owner line and the timeline's actors. */
  actorNames: Record<string, string>;
  onToggle: () => void;
  onDraftChange: (field: keyof LeadDraftFields, value: string) => void;
  onDraftBlur: () => void;
  onOwnerChange: (userId: string) => void;
  onLogContact: () => void;
  onEnrich: () => void;
  /** One match-criteria answer; `null` clears it. Village leads only. */
  onQualify: (key: LeadQualificationKey, value: boolean | null) => void;
  onInviteOwner: () => void;
  onSendNextStep: () => void;
  onPublishVillage: () => void;
}

/** `label — reason`, or whichever of the two the API filled in. */
const FitLine = ({ line }: { line: LeadFitCheckLine }) => (
  <li className="text-sm text-gray-800 break-words">
    {line.label ? <span className="font-medium">{line.label}</span> : null}
    {line.label && line.reason ? ' — ' : null}
    {line.reason}
  </li>
);

/**
 * Why the verdict is what it is. `failing` is what to change and `unanswered`
 * is what to go and ask, so the two are headed differently.
 */
const FitExplanationBlock = ({
  explanation,
}: {
  explanation: LeadFitExplanation;
}) => {
  const t = useTranslations();
  const failing = explanation.failing ?? [];
  const unanswered = explanation.unanswered ?? [];
  return (
    <div className="flex flex-col gap-2">
      {explanation.headline?.trim() ? (
        <p className="text-sm font-medium text-gray-900">
          {explanation.headline}
        </p>
      ) : null}
      {explanation.detail?.trim() ? (
        <p className="text-sm text-gray-800 break-words">
          {explanation.detail}
        </p>
      ) : null}
      {failing.length > 0 ? (
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-red-700">
            {t('dashboard_leads_fit_failing')}
          </span>
          <ul className="flex flex-col gap-1 list-disc list-inside">
            {failing.map((line, index) => (
              <FitLine key={line.key ?? `failing-${index}`} line={line} />
            ))}
          </ul>
        </div>
      ) : null}
      {unanswered.length > 0 ? (
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-500">
            {t('dashboard_leads_fit_unanswered')}
          </span>
          <ul className="flex flex-col gap-1 list-disc list-inside">
            {unanswered.map((line, index) => (
              <FitLine key={line.key ?? `unanswered-${index}`} line={line} />
            ))}
          </ul>
        </div>
      ) : null}
    </div>
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
 * One row of the leads board: a scannable line that expands into the brief a
 * GTM person reads before a call. Only one card is open at a time so a board of
 * fifty stays readable.
 *
 * The header is a single toggle button, so links that belong to the lead — the
 * village, the opportunities — live in the action row rather than nested inside
 * it, where they would be unreachable by keyboard and invalid markup besides.
 */
const LeadCard = ({
  lead,
  draft,
  isExpanded,
  isBusy,
  isManager,
  canEnrich,
  ownerName,
  ownerOptions,
  actorNames,
  onToggle,
  onDraftChange,
  onDraftBlur,
  onOwnerChange,
  onLogContact,
  onEnrich,
  onQualify,
  onInviteOwner,
  onSendNextStep,
  onPublishVillage,
}: Props) => {
  const t = useTranslations();
  /**
   * Stages and verdicts are open enums the pipeline adds to, so an unknown value
   * renders as itself. `t.has` is checked first because calling `t()` on a
   * missing key logs a MISSING_MESSAGE error even when the caller handles it.
   */
  const labelFor = (key: string, value: string | undefined) =>
    value ? (t.has(key) ? t(key) : value) : '';

  const id = leadId(lead);
  const panelId = `lead-panel-${id}`;
  const title = leadTitle(lead);
  const contactName = leadDisplayName(lead);
  const village = leadPrimaryVillage(lead);
  // A village lead is headed with the village, so the person behind it moves
  // to the secondary line instead of repeating in the meta row below.
  const villageIsTitle = Boolean(village?.name) && title === village?.name;
  const secondary = [
    contactName && contactName !== title ? contactName : null,
    lead.email && lead.email !== title && lead.email !== contactName
      ? lead.email
      : null,
  ].filter(Boolean) as string[];
  const verdict = lead.fit?.verdict;
  const isVillageLead = lead.type === 'village';
  // The team's own call, distinct from the fit check the job computes: a
  // pending one is not shown in the header, where it would only be noise.
  const qualification = isVillageLead ? leadQualificationVerdict(lead) : null;
  const stageLabel = labelFor(leadStageKey(lead.stage), lead.stage);
  const isFallbackBrief = leadBriefIsFallback(lead);
  const overdue = leadNextActionIsOverdue(lead);
  const facts = leadFactsWithSource(lead);
  const questions = leadOpenQuestions(lead);
  const suggested = leadSuggestedCriteria(lead);
  const highlights = lead.signals?.journeyHighlights ?? [];
  const opportunities = lead.opportunities ?? [];
  const ownerValue = leadOwnerId(lead) ?? '';
  const history = leadHistory(lead);

  /**
   * A verdict on its own is not actionable. The job embeds the explanation on
   * newer leads; for the rest it is read from the village when the card opens,
   * so a closed board makes no extra requests.
   */
  const embeddedExplanation = fitExplanationOf(lead.fit);
  const fitVillageId = leadNeedsFitExplanation(lead);
  const [fetchedExplanation, setFetchedExplanation] =
    useState<LeadFitExplanation | null>(null);
  useEffect(() => {
    if (!isExpanded || !fitVillageId || fetchedExplanation) return;
    let cancelled = false;
    fetchVillageFit(fitVillageId).then((fit) => {
      if (cancelled) return;
      setFetchedExplanation(fitExplanationOf(fit));
    });
    return () => {
      cancelled = true;
    };
  }, [isExpanded, fitVillageId, fetchedExplanation]);
  const explanation = embeddedExplanation ?? fetchedExplanation;

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
              {title || t('dashboard_leads_no_name')}
            </span>
            {title
              ? secondary.map((line) => (
                  <span key={line} className="text-sm text-gray-500 break-all">
                    {line}
                  </span>
                ))
              : null}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {stageLabel ? (
              <Tag color="primary" size="small">
                {stageLabel}
              </Tag>
            ) : null}
            {verdict ? (
              <Tag color={fitVerdictColor(verdict)} size="small">
                {labelFor(`dashboard_leads_verdict_${verdict}`, verdict)}
              </Tag>
            ) : null}
            {qualification && qualification !== 'pending' ? (
              <Tag
                color={qualificationVerdictColor(qualification)}
                size="small"
              >
                {labelFor(
                  `dashboard_leads_qualification_verdict_${qualification}`,
                  qualification,
                )}
              </Tag>
            ) : null}
            {village && leadVillageIsDraft(village) ? (
              <Tag color="orange" size="small">
                {t('dashboard_leads_village_draft')}
              </Tag>
            ) : null}
            {isFallbackBrief ? (
              // The brief was written without the model — fewer fields are
              // filled, so it is worth reading before acting on it.
              <span
                className="inline-flex items-center gap-1 text-xs text-amber-800 bg-amber-100 rounded-full px-2.5 py-0.5"
                title={t('dashboard_leads_provider_fallback_hint')}
              >
                <Sparkles size={12} aria-hidden="true" />
                {t('dashboard_leads_provider_fallback')}
              </span>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500">
            {village?.name && !villageIsTitle ? (
              <span>{village.name}</span>
            ) : null}
            <span>
              {ownerName
                ? t('dashboard_leads_owner_value', { name: ownerName })
                : t('dashboard_leads_owner_unassigned')}
            </span>
            {lead.lastContactedAt ? (
              <span>
                {t('dashboard_leads_last_contacted')}{' '}
                <TimeSince time={lead.lastContactedAt} />
              </span>
            ) : (
              <span>{t('dashboard_leads_never_contacted')}</span>
            )}
            {lead.nextActionAt ? (
              <span className={overdue ? 'text-red-600 font-medium' : ''}>
                {t('dashboard_leads_next_action')}{' '}
                <TimeSince time={lead.nextActionAt} />
              </span>
            ) : null}
          </div>
        </div>

        <ChevronDown
          size={18}
          aria-hidden="true"
          className={`shrink-0 mt-1 text-gray-400 transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isExpanded && (
        <div
          id={panelId}
          className="px-4 pb-4 flex flex-col gap-4 border-t border-gray-100 pt-4"
        >
          {/*
            First, because it is the first thing anyone asks of a cold lead:
            who is this, and are they real. Everything below is our reading of
            them; this is what they and their account actually say.
          */}
          <Section title={t('dashboard_leads_person_title')}>
            <LeadPerson lead={lead} />
          </Section>

          {isVillageLead ? (
            <Section title={t('dashboard_leads_qualification_title')}>
              <LeadQualification
                lead={lead}
                isBusy={isBusy}
                onAnswer={onQualify}
                note={draft.qualificationNote}
                onNoteChange={(value) =>
                  onDraftChange('qualificationNote', value)
                }
                onNoteBlur={onDraftBlur}
              />
            </Section>
          ) : null}

          {/*
            The fields a GTM person actually writes to, kept near the top. They
            used to sit ninth, below every read-only section, which is a long
            way to scroll to leave a note and far enough down to be missed
            entirely.
          */}
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label={t('dashboard_leads_tags_label')}
              value={draft.tags}
              placeholder={t('dashboard_leads_tags_placeholder')}
              onChange={(e) => onDraftChange('tags', e.target.value)}
              onBlur={onDraftBlur}
              isDisabled={isBusy}
            />
            <Input
              label={t('dashboard_leads_next_action_label')}
              type="date"
              value={draft.nextActionAt}
              onChange={(e) => onDraftChange('nextActionAt', e.target.value)}
              onBlur={onDraftBlur}
              isDisabled={isBusy}
            />
          </div>

          {isManager && (
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor={`lead-owner-${id}`}
                className="text-xs font-semibold text-gray-500 uppercase tracking-wide"
              >
                {t('dashboard_leads_owner_label')}
              </label>
              <select
                id={`lead-owner-${id}`}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
                value={ownerValue}
                disabled={isBusy}
                onChange={(e) => onOwnerChange(e.target.value)}
              >
                <option value="">
                  {t('dashboard_leads_owner_unassigned')}
                </option>
                {ownerOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor={`lead-notes-${id}`}
              className="text-xs font-semibold text-gray-500 uppercase tracking-wide"
            >
              {t('dashboard_leads_notes_label')}
            </label>
            <Textarea
              id={`lead-notes-${id}`}
              value={draft.notes}
              disabled={isBusy}
              onChange={(e) => onDraftChange('notes', e.target.value)}
              onBlur={onDraftBlur}
            />
          </div>

          {isVillageLead ? (
            <Section title={t('dashboard_leads_journey_title')}>
              <LeadNextSteps
                lead={lead}
                isBusy={isBusy}
                onInviteOwner={onInviteOwner}
                onSendNextStep={onSendNextStep}
                onPublish={onPublishVillage}
              />
            </Section>
          ) : null}

          {explanation ? (
            <Section title={t('dashboard_leads_fit_title')}>
              <FitExplanationBlock explanation={explanation} />
            </Section>
          ) : null}

          <Section title={t('dashboard_leads_brief_title')}>
            {lead.aiContext?.trim() ? (
              <div className="text-sm text-gray-800">
                <ReactMarkdown components={proposalMarkdownComponents}>
                  {lead.aiContext}
                </ReactMarkdown>
              </div>
            ) : (
              <p className="text-sm text-gray-600">
                {t('dashboard_leads_no_brief')}
              </p>
            )}
          </Section>

          {facts.length > 0 && (
            <Section title={t('dashboard_leads_facts_title')}>
              <ul className="flex flex-col gap-1.5">
                {facts.map((fact, index) => (
                  <li
                    key={`${id}-fact-${index}`}
                    className="text-sm text-gray-800 break-words"
                  >
                    {fact.label ? (
                      <span className="font-medium">{fact.label}: </span>
                    ) : null}
                    {fact.text}
                    {fact.sourceUrl ? (
                      <span className="ml-1">
                        <ExternalLinkDisplay href={fact.sourceUrl} />
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {questions.length > 0 && (
            <Section title={t('dashboard_leads_questions_title')}>
              <ul className="flex flex-col gap-2 list-disc list-inside">
                {questions.map((question, index) => (
                  <li
                    key={`${id}-question-${index}`}
                    className="text-sm text-gray-800 break-words"
                  >
                    {question}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {suggested.length > 0 && (
            <Section title={t('dashboard_leads_suggested_title')}>
              {/*
                Suggestions only. Writing them to `village.criteria` needs a
                human to confirm each one, and the fit questionnaire that does
                that is not part of this page yet.
              */}
              <p className="text-sm text-gray-600">
                {t('dashboard_leads_suggested_hint')}
              </p>
              <ul className="flex flex-col gap-1.5">
                {suggested.map((entry) => (
                  <li
                    key={`${id}-suggested-${entry.key}`}
                    className="text-sm text-gray-800 break-words"
                  >
                    <span className="font-medium">
                      {labelFor(`villages_criteria_${entry.key}`, entry.key)}:{' '}
                    </span>
                    {String(entry.value ?? '—')}
                    {typeof entry.confidence === 'number' ? (
                      <span className="text-gray-500">
                        {' '}
                        ({Math.round(entry.confidence * 100)}%)
                      </span>
                    ) : null}
                    {entry.sourceUrl ? (
                      <span className="ml-1">
                        <ExternalLinkDisplay href={entry.sourceUrl} />
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {(highlights.length > 0 ||
            lead.signals?.nightsStayed != null ||
            lead.signals?.totalSpent != null ||
            opportunities.length > 0 ||
            (isManager &&
              (lead.signals?.score != null || lead.signals?.segment))) && (
            <Section title={t('dashboard_leads_signals_title')}>
              <div className="flex flex-wrap gap-1.5">
                {/*
                  The job's own reading of the lead. Managers only, as the
                  model says: it is a ranking aid, not something to quote at
                  the person it is about.
                */}
                {isManager && lead.signals?.score != null && (
                  <Tag color="primary" size="small">
                    {t('dashboard_leads_signal_score', {
                      score: lead.signals.score,
                    })}
                  </Tag>
                )}
                {isManager && lead.signals?.segment && (
                  <Tag color="primary" size="small">
                    {labelFor(
                      `dashboard_leads_segment_${lead.signals.segment}`,
                      lead.signals.segment,
                    )}
                  </Tag>
                )}
                {lead.signals?.nightsStayed != null && (
                  <Tag color="neutral" size="small">
                    {t('dashboard_leads_signal_nights', {
                      count: lead.signals.nightsStayed,
                    })}
                  </Tag>
                )}
                {lead.signals?.totalSpent != null && (
                  <Tag color="neutral" size="small">
                    {t('dashboard_leads_signal_spend', {
                      amount: lead.signals.totalSpent,
                      currency: lead.signals.totalSpentCurrency ?? '',
                    })}
                  </Tag>
                )}
                {opportunities.length > 0 && (
                  <Tag color="neutral" size="small">
                    {t('dashboard_leads_signal_opportunities', {
                      count: opportunities.length,
                    })}
                  </Tag>
                )}
              </div>
              {highlights.length > 0 && (
                <ul className="flex flex-col gap-1 list-disc list-inside">
                  {highlights.map((highlight, index) => (
                    <li
                      key={`${id}-highlight-${index}`}
                      className="text-sm text-gray-800 break-words"
                    >
                      {highlight}
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          )}

          {history.length > 0 && (
            <Section title={t('dashboard_leads_history_title')}>
              <LeadHistory lead={lead} actorNames={actorNames} />
            </Section>
          )}

          <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3">
            {lead.email && (
              <LinkButton
                href={`mailto:${lead.email}`}
                variant="inline"
                size="small"
                isFullWidth={false}
              >
                {t('dashboard_leads_email_button')}
              </LinkButton>
            )}
            {village ? (
              <LinkButton
                href={`/villages/${village.slug || village._id}`}
                variant="inline"
                size="small"
                isFullWidth={false}
              >
                {t('dashboard_leads_view_village')}
              </LinkButton>
            ) : null}
            {opportunities.length > 0 && (
              <LinkButton
                href="/dashboard/engagement"
                variant="inline"
                size="small"
                isFullWidth={false}
              >
                {t('dashboard_leads_view_opportunities')}
              </LinkButton>
            )}
            <Button
              size="small"
              variant="secondary"
              isFullWidth={false}
              isEnabled={!isBusy}
              onClick={onLogContact}
            >
              {t('dashboard_leads_log_contact')}
            </Button>
            {canEnrich && (
              <Button
                size="small"
                variant="secondary"
                isFullWidth={false}
                isEnabled={!isBusy}
                onClick={onEnrich}
              >
                {t('dashboard_leads_enrich')}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadCard;
