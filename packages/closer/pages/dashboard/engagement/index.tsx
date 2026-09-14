import Head from 'next/head';

import { useCallback, useEffect, useMemo, useState } from 'react';

import AdminLayout from '../../../components/Dashboard/AdminLayout';
import DashboardPageHeader from '../../../components/Dashboard/DashboardPageHeader';
import EngagementOpportunityCard from '../../../components/Dashboard/EngagementOpportunityCard';
import EngagementSampleEmailModal from '../../../components/Dashboard/engagementSampleEmailModal';
import Pagination from '../../../components/Pagination';
import { LinkButton, Spinner } from '../../../components/ui';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import PageNotAllowed from '../../401';
import { useAuth } from '../../../contexts/auth';
import { usePlatform } from '../../../contexts/platform';
import useRBAC from '../../../hooks/useRBAC';
import { EngagementConfig } from '../../../types/api';
import {
  EngagementDraftFields,
  EngagementOpportunity,
  EngagementOpportunityStatus,
  EngagementSampleEmailResults,
} from '../../../types/engagement';
import { getCachedConfig } from '../../../utils/cachedConfig.helpers';
import { parseMessageFromError } from '../../../utils/common';
import {
  buildDraftPatchPayload,
  buildEngagementListWhere,
  buildRewardPayload,
  clampRewardCarrots,
  draftFieldsFromOpportunity,
  engagementRowsFromFetchAction,
  ENGAGEMENT_LIST_PRESETS,
  ENGAGEMENT_MAX_OPEN,
  ENGAGEMENT_STALE_DAYS,
  EngagementListPreset,
  opportunityId,
  rewardCarrots,
  rewardCreditsAwarded,
  userIsEngagementManager,
} from '../../../utils/engagement.helpers';

const LIST_LIMIT = 50;

const EngagementDashboardPage = () => {
  const t = useTranslations();
  const { user } = useAuth();
  const { platform } = usePlatform() as { platform: any };
  const { hasAccess } = useRBAC();

  const isManager = userIsEngagementManager(user);

  const engagementConfig = getCachedConfig(
    'engagement',
  ) as EngagementConfig | null;
  const ctaHref =
    typeof engagementConfig?.ctaLink === 'string'
      ? engagementConfig.ctaLink.trim()
      : '';
  const ctaLabel =
    typeof engagementConfig?.ctaText === 'string'
      ? engagementConfig.ctaText.trim()
      : '';
  const showEngagementCta =
    engagementConfig?.enabled === true && Boolean(ctaHref && ctaLabel);
  const ctaIsExternal = /^https?:\/\//i.test(ctaHref);

  const [preset, setPreset] = useState<EngagementListPreset>('active');
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<EngagementOpportunity[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, EngagementDraftFields>>(
    {},
  );
  const [rewardAmounts, setRewardAmounts] = useState<Record<string, number>>(
    {},
  );
  const [savingId, setSavingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
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

  /**
   * Seed local edit state for rows the queue has not shown before. Rows already
   * being edited keep their in-progress values across a reload.
   */
  useEffect(() => {
    setDrafts((prev) => {
      const next = { ...prev };
      for (const row of items) {
        const id = opportunityId(row);
        if (next[id] === undefined) next[id] = draftFieldsFromOpportunity(row);
      }
      return next;
    });
    setRewardAmounts((prev) => {
      const next = { ...prev };
      for (const row of items) {
        const id = opportunityId(row);
        if (next[id] === undefined) next[id] = rewardCarrots(row);
      }
      return next;
    });
  }, [items]);

  const forgetLocalEdits = (id: string) => {
    setDrafts(({ [id]: _drop, ...rest }) => rest);
    setRewardAmounts(({ [id]: _drop, ...rest }) => rest);
  };

  const draftFor = (row: EngagementOpportunity): EngagementDraftFields =>
    drafts[opportunityId(row)] ?? draftFieldsFromOpportunity(row);

  const rewardFor = (row: EngagementOpportunity): number =>
    rewardAmounts[opportunityId(row)] ?? rewardCarrots(row);

  const setDraft = (
    id: string,
    field: keyof EngagementDraftFields,
    value: string,
  ) => {
    setDrafts((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  };

  const setRewardAmount = (id: string, value: number) => {
    setRewardAmounts((prev) => ({ ...prev, [id]: clampRewardCarrots(value) }));
  };

  const persistRewardAmount = async (row: EngagementOpportunity) => {
    if (rewardCreditsAwarded(row)) return;
    try {
      await platform.engagementopportunity.patch(opportunityId(row), {
        reward: buildRewardPayload(row, rewardFor(row)),
      });
    } catch {
      setError(t('engagement_error_save'));
    }
  };

  /** Runs the given call with the row marked busy, then refreshes the queue. */
  const runRowAction = async (
    row: EngagementOpportunity,
    action: () => Promise<unknown>,
    { clearEdits = false } = {},
  ) => {
    const id = opportunityId(row);
    setSavingId(id);
    setError(null);
    try {
      await action();
      await load();
      if (clearEdits) forgetLocalEdits(id);
    } catch {
      setError(t('engagement_error_save'));
    } finally {
      setSavingId(null);
    }
  };

  const applySampleToDraft = async (
    row: EngagementOpportunity,
    results: EngagementSampleEmailResults,
  ) => {
    const id = opportunityId(row);
    const current = draftFor(row);
    const next: EngagementDraftFields = {
      subject: results.subject ?? current.subject,
      body: results.body ?? current.body,
      ctaLink: results.ctaLink ?? current.ctaLink,
      ctaText: results.ctaText ?? current.ctaText,
      hostBrief: results.hostBrief ?? current.hostBrief,
    };
    setDrafts((prev) => ({ ...prev, [id]: next }));
    await runRowAction(row, () =>
      platform.engagementopportunity.patch(id, buildDraftPatchPayload(next)),
    );
  };

  const approveSend = (row: EngagementOpportunity) =>
    runRowAction(
      row,
      () =>
        platform.engagementopportunity.approve(opportunityId(row), {
          ...buildDraftPatchPayload(draftFor(row)),
          reward: buildRewardPayload(row, rewardFor(row)),
        }),
      { clearEdits: true },
    );

  const dismissOpp = (row: EngagementOpportunity) =>
    runRowAction(
      row,
      () => platform.engagementopportunity.dismiss(opportunityId(row), {}),
      { clearEdits: true },
    );

  const updateStatus = (
    row: EngagementOpportunity,
    status: EngagementOpportunityStatus,
  ) =>
    runRowAction(row, () =>
      platform.engagementopportunity.patch(opportunityId(row), { status }),
    );

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
          <DashboardPageHeader
            title={t('engagement_title')}
            subtitle={t('engagement_simple_intro')}
          >
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
          </DashboardPageHeader>

          {isManager && (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div
                className="flex gap-1 p-1 bg-gray-100 rounded-full"
                role="tablist"
                aria-label={t('engagement_filter_label')}
              >
                {ENGAGEMENT_LIST_PRESETS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    role="tab"
                    aria-selected={preset === option}
                    onClick={() => setPreset(option)}
                    className={`text-sm rounded-full px-3 py-1.5 transition-colors ${
                      preset === option
                        ? 'bg-white text-gray-900 shadow-sm font-medium'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {t(`engagement_filter_${option}`)}
                  </button>
                ))}
              </div>
              {!loading && (
                <span className="text-sm text-gray-500">
                  {/* Only the default view is exactly the set of open slots. */}
                  {preset === 'active'
                    ? t('engagement_queue_summary', {
                        count: total,
                        max: ENGAGEMENT_MAX_OPEN,
                        days: ENGAGEMENT_STALE_DAYS,
                      })
                    : t('engagement_result_count', { count: total })}
                </span>
              )}
            </div>
          )}

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
            <div className="flex flex-col gap-3">
              {items.map((row) => {
                const id = opportunityId(row);
                return (
                  <EngagementOpportunityCard
                    key={id}
                    opportunity={row}
                    draft={draftFor(row)}
                    rewardAmount={rewardFor(row)}
                    isExpanded={expandedId === id}
                    isBusy={savingId === id}
                    canApproveSend={isManager}
                    onToggle={() =>
                      setExpandedId((prev) => (prev === id ? null : id))
                    }
                    onDraftChange={(field, value) => setDraft(id, field, value)}
                    onRewardChange={(amount) => setRewardAmount(id, amount)}
                    onRewardBlur={() => persistRewardAmount(row)}
                    onPreview={() => setPreviewOpportunity(row)}
                    onApprove={() => approveSend(row)}
                    onDismiss={() => dismissOpp(row)}
                    onStatusChange={(status) => updateStatus(row, status)}
                  />
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

EngagementDashboardPage.getInitialProps = async (_context: NextPageContext) => {
  try {
    return {};
  } catch (error) {
    return {
      error: parseMessageFromError(error),
    };
  }
};

export default EngagementDashboardPage;
