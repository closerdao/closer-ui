import Head from 'next/head';

import { useCallback, useEffect, useMemo, useState } from 'react';

import AdminLayout from '../../../components/Dashboard/AdminLayout';
import EngagementSampleEmailModal from '../../../components/Dashboard/engagementSampleEmailModal';
import Pagination from '../../../components/Pagination';
import {
  Button,
  Heading,
  Input,
  LinkButton,
  Spinner,
  Textarea,
} from '../../../components/ui';

import { Carrot } from 'lucide-react';
import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import PageNotAllowed from '../../401';
import { useAuth } from '../../../contexts/auth';
import { usePlatform } from '../../../contexts/platform';
import useRBAC from '../../../hooks/useRBAC';
import { EngagementConfig } from '../../../types/api';
import {
  EngagementOpportunity,
  EngagementOpportunityStatus,
  EngagementSampleEmailResults,
} from '../../../types/engagement';
import {
  buildDraftPatchPayload,
  buildEngagementListWhere,
  buildRewardPayload,
  clampRewardCarrots,
  copyProviderKey,
  draftFieldsFromOpportunity,
  engagementRowsFromFetchAction,
  EngagementListPreset,
  hostBriefText,
  managedByDisplayLines,
  opportunityEnrichmentPending,
  opportunityId,
  rewardCreditsAwarded,
  userIsEngagementManager,
} from '../../../utils/engagement.helpers';
import { parseMessageFromError } from '../../../utils/common';
import { getCachedConfig } from '../../../utils/cachedConfig.helpers';

const LIST_LIMIT = 50;

type DraftFields = {
  subject: string;
  body: string;
  ctaLink: string;
  ctaText: string;
  hostBrief: string;
};

function stageLabel(stage: string | undefined, t: (k: string) => string) {
  if (!stage) return '';
  const key = `engagement_stage_${stage}`;
  const label = t(key);
  return label === key ? stage : label;
}

function statusLabel(
  status: EngagementOpportunityStatus | undefined,
  t: (k: string) => string,
) {
  if (!status) return '';
  const key = `engagement_status_${status}`;
  const label = t(key);
  return label === key ? status : label;
}

const EngagementDashboardPage = () => {
  const t = useTranslations();
  const { user } = useAuth();
  const { platform } = usePlatform() as { platform: any };
  const { hasAccess } = useRBAC();

  const isManager = userIsEngagementManager(user);
  const canApproveSend = isManager;

  const engagementConfig = getCachedConfig('engagement') as EngagementConfig | null;
  const ctaHref =
    typeof engagementConfig?.ctaLink === 'string'
      ? engagementConfig.ctaLink.trim()
      : '';
  const ctaLabel =
    typeof engagementConfig?.ctaText === 'string'
      ? engagementConfig.ctaText.trim()
      : '';
  const engagementCtaEnabled = engagementConfig?.enabled !== false;
  const showEngagementCta =
    engagementCtaEnabled && Boolean(ctaHref && ctaLabel);
  const ctaIsExternal = /^https?:\/\//i.test(ctaHref);

  const [preset, setPreset] = useState<EngagementListPreset>('active');
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<EngagementOpportunity[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, DraftFields>>({});
  const [rewardAmounts, setRewardAmounts] = useState<Record<string, number>>(
    {},
  );
  const [savingId, setSavingId] = useState<string | null>(null);
  const [previewOpportunity, setPreviewOpportunity] =
    useState<EngagementOpportunity | null>(null);

  const whereClause = useMemo(() => {
    if (!user?._id) return {};
    return buildEngagementListWhere(isManager, preset, user._id);
  }, [isManager, preset, user?._id]);

  const load = useCallback(async () => {
    if (!user?._id) return;
    setLoading(true);
    setError(null);
    try {
      const action = await platform.engagementopportunity.fetchList({
        where: whereClause,
        limit: LIST_LIMIT,
        page,
      });
      const { rows, total: count } = engagementRowsFromFetchAction(action);
      setItems(rows);
      setTotal(count);
    } catch {
      setError(t('engagement_error_load'));
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, platform.engagementopportunity, t, user?._id, whereClause]);

  useEffect(() => {
    setPage(1);
  }, [preset, isManager, user?._id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setDrafts((prev) => {
      const next = { ...prev };
      for (const row of items) {
        const id = opportunityId(row);
        if (next[id] === undefined) {
          next[id] = draftFieldsFromOpportunity(row);
        }
      }
      return next;
    });
  }, [items]);

  useEffect(() => {
    setRewardAmounts((prev) => {
      const next = { ...prev };
      for (const row of items) {
        const id = opportunityId(row);
        if (next[id] === undefined) {
          const r = row.reward;
          const raw =
            r && typeof r === 'object' && 'amount' in r
              ? Number((r as { amount?: number }).amount)
              : 0;
          next[id] = clampRewardCarrots(Number.isNaN(raw) ? 0 : raw);
        }
      }
      return next;
    });
  }, [items]);

  const setDraft = (
    id: string,
    field: keyof DraftFields,
    value: string,
  ) => {
    setDrafts((prev) => ({
      ...prev,
      [id]: {
        subject: '',
        body: '',
        ctaLink: '',
        ctaText: '',
        hostBrief: '',
        ...prev[id],
        [field]: value,
      },
    }));
  };

  const setRewardAmount = (id: string, value: number) => {
    setRewardAmounts((prev) => ({
      ...prev,
      [id]: clampRewardCarrots(value),
    }));
  };

  const persistRewardAmount = async (row: EngagementOpportunity) => {
    const id = opportunityId(row);
    if (rewardCreditsAwarded(row)) return;
    const amt =
      rewardAmounts[id] ??
      clampRewardCarrots(
        Number(
          row.reward && typeof row.reward === 'object' && 'amount' in row.reward
            ? (row.reward as { amount?: number }).amount
            : 0,
        ),
      );
    try {
      await platform.engagementopportunity.patch(id, {
        reward: buildRewardPayload(row, amt),
      });
    } catch {
      setError(t('engagement_error_save'));
    }
  };

  const persistDraft = async (
    row: EngagementOpportunity,
    draft: DraftFields,
  ) => {
    const id = opportunityId(row);
    await platform.engagementopportunity.patch(
      id,
      buildDraftPatchPayload(draft),
    );
  };

  const applySampleToDraft = async (
    row: EngagementOpportunity,
    results: EngagementSampleEmailResults,
  ) => {
    const id = opportunityId(row);
    const next: DraftFields = {
      subject: results.subject ?? drafts[id]?.subject ?? '',
      body: results.body ?? drafts[id]?.body ?? '',
      ctaLink: results.ctaLink ?? drafts[id]?.ctaLink ?? '',
      ctaText: results.ctaText ?? drafts[id]?.ctaText ?? '',
      hostBrief: results.hostBrief ?? drafts[id]?.hostBrief ?? '',
    };
    setDrafts((prev) => ({ ...prev, [id]: next }));
    setSavingId(id);
    setError(null);
    try {
      await persistDraft(row, next);
      await load();
    } catch {
      setError(t('engagement_error_save'));
    } finally {
      setSavingId(null);
    }
  };

  const approveSend = async (row: EngagementOpportunity) => {
    const id = opportunityId(row);
    const d = drafts[id] ?? draftFieldsFromOpportunity(row);
    const amt =
      rewardAmounts[id] ??
      clampRewardCarrots(
        Number(
          row.reward && typeof row.reward === 'object' && 'amount' in row.reward
            ? (row.reward as { amount?: number }).amount
            : 0,
        ),
      );
    setSavingId(id);
    setError(null);
    try {
      await platform.engagementopportunity.approve(id, {
        ...buildDraftPatchPayload(d),
        reward: buildRewardPayload(row, amt),
      });
      await load();
      setDrafts((prev) => {
        const { [id]: _, ...rest } = prev;
        return rest;
      });
      setRewardAmounts((prev) => {
        const { [id]: __, ...rest } = prev;
        return rest;
      });
    } catch {
      setError(t('engagement_error_save'));
    } finally {
      setSavingId(null);
    }
  };

  const dismissOpp = async (row: EngagementOpportunity) => {
    const id = opportunityId(row);
    setSavingId(id);
    setError(null);
    try {
      await platform.engagementopportunity.dismiss(id, {});
      await load();
      setDrafts((prev) => {
        const { [id]: _, ...rest } = prev;
        return rest;
      });
      setRewardAmounts((prev) => {
        const { [id]: __, ...rest } = prev;
        return rest;
      });
    } catch {
      setError(t('engagement_error_save'));
    } finally {
      setSavingId(null);
    }
  };

  const updateStatus = async (
    row: EngagementOpportunity,
    status: EngagementOpportunityStatus,
  ) => {
    const id = opportunityId(row);
    setSavingId(id);
    setError(null);
    try {
      await platform.engagementopportunity.patch(id, { status });
      await load();
    } catch {
      setError(t('engagement_error_save'));
    } finally {
      setSavingId(null);
    }
  };

  if (!user || !hasAccess('Engagement')) {
    return <PageNotAllowed />;
  }

  return (
    <>
      <Head>
        <title>{t('engagement_title')}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <AdminLayout>
        <div className="flex flex-col gap-6 max-w-4xl">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div className="flex flex-col gap-1">
              <Heading level={2}>{t('engagement_title')}</Heading>
              <p className="text-sm text-gray-600">{t('engagement_simple_intro')}</p>
            </div>
            {(showEngagementCta || isManager) && (
              <div className="flex flex-col sm:flex-row sm:items-end gap-3 shrink-0">
                {showEngagementCta && (
                  <LinkButton
                    href={ctaHref}
                    variant="inline"
                    isFullWidth={false}
                    size="small"
                    className="!normal-case tracking-normal"
                    target={ctaIsExternal ? '_blank' : undefined}
                    rel={ctaIsExternal ? 'noopener noreferrer' : undefined}
                  >
                    {ctaLabel}
                  </LinkButton>
                )}
                {isManager && (
                  <div className="flex flex-col gap-1 min-w-[200px]">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      {t('engagement_filter_label')}
                    </span>
                    <select
                      className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
                      value={preset}
                      onChange={(e) =>
                        setPreset(e.target.value as EngagementListPreset)
                      }
                    >
                      <option value="active">
                        {t('engagement_filter_active')}
                      </option>
                      <option value="high">{t('engagement_filter_high')}</option>
                      <option value="all_open">
                        {t('engagement_filter_all_open')}
                      </option>
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          {loading ? (
            <div className="flex justify-center py-16">
              <Spinner />
            </div>
          ) : items.length === 0 ? (
            <p className="text-sm text-gray-600">{t('engagement_empty')}</p>
          ) : (
            <div className="flex flex-col gap-6">
              {items.map((row) => {
                const id = opportunityId(row);
                const d = drafts[id] ?? draftFieldsFromOpportunity(row);
                const meta = [
                  row.email || row.signals?.name,
                  row.priority && row.score != null
                    ? `${row.priority} · ${row.score}`
                    : row.score != null
                      ? String(row.score)
                      : null,
                  stageLabel(row.stage, t),
                ]
                  .filter(Boolean)
                  .join(' · ');
                const managedLines = managedByDisplayLines(row);
                const busy = savingId === id;
                const awarded = rewardCreditsAwarded(row);
                const enrichmentPending = opportunityEnrichmentPending(row);
                const rewardAmt =
                  rewardAmounts[id] ??
                  clampRewardCarrots(
                    Number(
                      row.reward &&
                        typeof row.reward === 'object' &&
                        'amount' in row.reward
                        ? (row.reward as { amount?: number }).amount
                        : 0,
                    ),
                  );
                const rewardMsg =
                  row.reward &&
                  typeof row.reward === 'object' &&
                  'message' in row.reward
                    ? String((row.reward as { message?: string }).message || '')
                    : '';
                const rewardSrc =
                  row.reward &&
                  typeof row.reward === 'object' &&
                  'source' in row.reward
                    ? String((row.reward as { source?: string }).source || '')
                    : '';
                const brief = hostBriefText(row) || d.hostBrief;
                const provider = row.aiMeta?.provider;
                const nextSteps = row.recommendedNextSteps ?? [];
                const signalReasons = row.signals?.reasons ?? [];
                const canActOnStatus =
                  row.status !== 'dismissed' &&
                  row.status !== 'converted' &&
                  row.status !== 'expired';

                return (
                  <div
                    key={id}
                    className="bg-white shadow rounded-lg border border-gray-100 p-4 flex flex-col gap-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="text-sm text-gray-700 font-medium break-all">
                        {meta || '—'}
                      </div>
                      {row.status ? (
                        <span className="text-xs font-medium uppercase tracking-wide rounded-full px-2.5 py-1 bg-gray-100 text-gray-700 shrink-0">
                          {statusLabel(row.status, t)}
                        </span>
                      ) : null}
                    </div>

                    {row.recommendedAction ? (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium text-gray-700">
                          {t('engagement_col_recommended_action')}:{' '}
                        </span>
                        {row.recommendedAction}
                      </p>
                    ) : null}

                    {brief ? (
                      <p className="text-sm text-gray-600 leading-snug">
                        {brief}
                      </p>
                    ) : null}

                    {signalReasons.length > 0 ? (
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                          {t('engagement_section_signals')}
                        </span>
                        <ul className="text-sm text-gray-600 list-disc list-inside flex flex-col gap-0.5">
                          {signalReasons.map((reason) => (
                            <li key={reason}>{reason}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    {nextSteps.length > 0 ? (
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                          {t('engagement_section_next_steps')}
                        </span>
                        <ul className="text-sm text-gray-600 list-disc list-inside flex flex-col gap-0.5">
                          {nextSteps.map((step) => (
                            <li key={step}>{step}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    <div className="text-sm text-gray-700 break-words">
                      <span className="font-medium text-gray-600">
                        {t('engagement_col_managed')}:{' '}
                      </span>
                      {managedLines.length > 0
                        ? managedLines.join(' · ')
                        : '—'}
                    </div>

                    {provider ? (
                      <span className="inline-flex self-start text-xs font-medium uppercase tracking-wide rounded-full px-2.5 py-1 bg-blue-50 text-blue-800">
                        {t(copyProviderKey(provider))}
                      </span>
                    ) : null}

                    {enrichmentPending ? (
                      <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-md px-3 py-2">
                        {t('engagement_enrichment_pending')}
                      </p>
                    ) : null}

                    <div className="rounded-md border border-amber-100 bg-amber-50/60 px-3 py-3 flex flex-col gap-2">
                      <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                        {t('engagement_section_reward')}
                      </span>
                      {rewardMsg ? (
                        <p className="text-sm text-gray-800">{rewardMsg}</p>
                      ) : null}
                      {rewardSrc ? (
                        <p className="text-xs text-gray-500 font-mono">
                          {rewardSrc}
                        </p>
                      ) : null}
                      <div className="flex flex-wrap items-center gap-2">
                        <Carrot
                          className="h-6 w-6 text-orange-500 shrink-0"
                          strokeWidth={1.75}
                          aria-hidden
                        />
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
                              value={rewardAmt}
                              disabled={busy}
                              onChange={(e) =>
                                setRewardAmount(
                                  id,
                                  Number(e.target.value),
                                )
                              }
                              onBlur={() => persistRewardAmount(row)}
                            />
                            <span className="text-sm text-gray-600">
                              {t('engagement_reward_credits')}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <label className="text-xs font-medium text-gray-600">
                      {t('engagement_draft_subject')}
                    </label>
                    <Input
                      value={d.subject}
                      onChange={(e) => setDraft(id, 'subject', e.target.value)}
                      isDisabled={busy}
                      placeholder={t('engagement_draft_subject')}
                    />
                    <label className="text-xs font-medium text-gray-600">
                      {t('engagement_draft_body')}
                    </label>
                    <Textarea
                      value={d.body}
                      onChange={(e) => setDraft(id, 'body', e.target.value)}
                      disabled={busy}
                      rows={8}
                      className="font-mono text-sm"
                      placeholder={t('engagement_draft_body')}
                    />
                    <label className="text-xs font-medium text-gray-600">
                      {t('engagement_draft_cta_link')}
                    </label>
                    <Input
                      value={d.ctaLink}
                      onChange={(e) => setDraft(id, 'ctaLink', e.target.value)}
                      isDisabled={busy}
                      placeholder={t('engagement_draft_cta_link')}
                    />
                    <label className="text-xs font-medium text-gray-600">
                      {t('engagement_draft_cta_text')}
                    </label>
                    <Input
                      value={d.ctaText}
                      onChange={(e) => setDraft(id, 'ctaText', e.target.value)}
                      isDisabled={busy}
                      placeholder={t('engagement_draft_cta_text')}
                    />
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Button
                        type="button"
                        variant="secondary"
                        isFullWidth={false}
                        isEnabled={!busy}
                        onClick={() => setPreviewOpportunity(row)}
                      >
                        {t('engagement_action_preview_email')}
                      </Button>
                      {canApproveSend && canActOnStatus && (
                        <Button
                          type="button"
                          variant="primary"
                          isFullWidth={false}
                          isEnabled={!busy && !enrichmentPending}
                          isLoading={busy}
                          onClick={() => approveSend(row)}
                        >
                          {t('engagement_action_approve_send')}
                        </Button>
                      )}
                      {canActOnStatus && (
                        <Button
                          type="button"
                          variant="secondary"
                          isFullWidth={false}
                          isEnabled={!busy}
                          onClick={() => dismissOpp(row)}
                        >
                          {t('engagement_action_dismiss')}
                        </Button>
                      )}
                      {canActOnStatus &&
                        row.status !== 'contacted' &&
                        row.status !== 'converted' && (
                          <Button
                            type="button"
                            variant="secondary"
                            isFullWidth={false}
                            isEnabled={!busy}
                            onClick={() => updateStatus(row, 'contacted')}
                          >
                            {t('engagement_action_mark_contacted')}
                          </Button>
                        )}
                      {canActOnStatus && row.status !== 'converted' && (
                        <Button
                          type="button"
                          variant="secondary"
                          isFullWidth={false}
                          isEnabled={!busy}
                          onClick={() => updateStatus(row, 'converted')}
                        >
                          {t('engagement_action_mark_converted')}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!loading && total > LIST_LIMIT && (
            <Pagination
              loadPage={(p: number) => setPage(p)}
              page={page}
              limit={LIST_LIMIT}
              total={total}
            />
          )}
        </div>

        {previewOpportunity ? (
          <EngagementSampleEmailModal
            opportunity={previewOpportunity}
            isManager={isManager}
            onClose={() => setPreviewOpportunity(null)}
            onApply={(results) =>
              applySampleToDraft(previewOpportunity, results)
            }
            sampleEmail={(payload) =>
              platform.engagementopportunity.sampleEmail(payload)
            }
          />
        ) : null}
      </AdminLayout>
    </>
  );
};

EngagementDashboardPage.getInitialProps = async (
  context: NextPageContext,
) => {
  try {
    return {};
  } catch (error) {
    return {
      error: parseMessageFromError(error),
    };
  }
};

export default EngagementDashboardPage;
