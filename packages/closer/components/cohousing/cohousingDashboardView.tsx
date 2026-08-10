import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { useTranslations } from 'next-intl';

import { COHOUSING_STEP_BY_N } from '../../constants/cohousingFlow';
import { useAuth } from '../../contexts/auth';
import { usePlatform } from '../../contexts/platform';
import type { CohousingApplication } from '../../types/cohousingApplication';
import { parseMessageFromError } from '../../utils/common';
import {
  aggregateCohousingFundsCommitted,
  getCohousingFinancialSummary,
  getCohousingTierLabelKey,
} from '../../utils/cohousingFinancials.helpers';
import { formatIsoFiatAmount } from '../../utils/currencyFormat';
import Heading from '../ui/Heading';
import Spinner from '../ui/Spinner';
import CohousingAddParticipantModal from './cohousingAddParticipantModal';
import { CohousingQuizResultsView } from './cohousingQuizResultsView';
import { FlowBadge } from './cohousingFlowUi';

const clampStep = (n: number) => Math.min(Math.max(Math.floor(n), 1), 14);

const getCreatedById = (app: CohousingApplication) => {
  const c = app.createdBy;
  if (!c) {
    return '';
  }
  return typeof c === 'string' ? c : c._id || '';
};

const getApplicantUserId = (app: CohousingApplication): string | undefined => {
  const cb = app.createdBy;
  if (typeof cb === 'string') {
    return cb;
  }
  if (cb && typeof cb === 'object' && '_id' in cb) {
    return (cb as { _id: string })._id;
  }
  return undefined;
};

const getEffectiveStep = (app: CohousingApplication) => {
  if (app.status === 'waitlist') {
    return 1;
  }
  return clampStep(app.currentStep ?? 1);
};

const labelForApp = (app: CohousingApplication, t: (k: string) => string) => {
  const intake = app.intake;
  if (intake && typeof intake === 'object' && 'fullName' in intake && intake.fullName) {
    return String(intake.fullName);
  }
  const id = getCreatedById(app);
  return id ? `${t('cohousing_team_applicant')}: ${id.slice(-6)}` : t('cohousing_team_unknown');
};

const isStepSubmitted = (app: CohousingApplication, step: number) =>
  (app.stepHistory || []).some(
    (entry) =>
      entry?.event === 'participant_submitted' && Number(entry?.step) === step,
  );

const statusStyle = (status: string | undefined) => {
  switch (status) {
    case 'waitlist':
      return 'bg-gray-100 text-gray-700 border-gray-300';
    case 'active':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'approved':
      return 'bg-green-50 text-green-700 border-green-200';
    case 'dropped':
      return 'bg-red-50 text-red-700 border-red-200';
    default:
      return 'bg-amber-50 text-amber-700 border-amber-200';
  }
};

export const CohousingDashboardView = () => {
  const t = useTranslations();
  const router = useRouter();
  const { id: routeId } = router.query;
  const { user } = useAuth();
  const { platform } = usePlatform() as { platform: any };

  const [list, setList] = useState<CohousingApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState('active');
  const [addParticipantOpen, setAddParticipantOpen] = useState(false);

  const selectedId = useMemo(() => {
    if (typeof routeId === 'string') {
      return routeId;
    }
    return list[0]?._id ?? null;
  }, [routeId, list]);

  const selected = useMemo(
    () => list.find((app) => app._id === selectedId) || null,
    [list, selectedId],
  );

  const existingApplicantUserIds = useMemo(() => {
    const set = new Set<string>();
    for (const app of list) {
      const uid = getApplicantUserId(app);
      if (uid) {
        set.add(uid);
      }
    }
    return set;
  }, [list]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await platform.cohousingapplication.get({
        sort_by: 'queuedAt',
        limit: 200,
      });
      const raw = res?.results?.toJS?.() ?? res?.results;
      const rows = (Array.isArray(raw) ? raw : []) as CohousingApplication[];
      setList(rows);
    } catch (err) {
      setError(parseMessageFromError(err));
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [platform]);

  useEffect(() => {
    if (router.isReady) {
      void load();
    }
  }, [router.isReady, load]);

  useEffect(() => {
    if (selected?.status) {
      setSelectedStatus(selected.status);
    }
  }, [selected]);

  const navigateTo = useCallback(
    async (nextId: string) => {
      await router.replace(`/dashboard/cohousing/${nextId}`, undefined, {
        shallow: true,
      });
    },
    [router],
  );

  const onParticipantCreated = useCallback(
    async (newId: string) => {
      await load();
      await navigateTo(newId);
    },
    [load, navigateTo],
  );

  const patchSelected = useCallback(
    async (payload: Record<string, unknown>) => {
      if (!selected?._id) {
        return;
      }
      setSaving(true);
      setError(null);
      try {
        await platform.cohousingapplication.patch(selected._id, payload);
        await load();
      } catch (err) {
        setError(parseMessageFromError(err));
      } finally {
        setSaving(false);
      }
    },
    [load, platform, selected?._id],
  );

  const fundsCommitted = useMemo(
    () => aggregateCohousingFundsCommitted(list),
    [list],
  );

  const stats = {
    total: list.length,
    inQuiz: list.filter((a) => (a.currentStep ?? 1) === 2).length,
    inBuild: list.filter((a) => (a.currentStep ?? 1) >= 10).length,
    flagged: list.filter((a) => a.flag?.raised).length,
    fundsCommitted,
  };

  if (!router.isReady || loading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    );
  }

  const stepNum = selected ? getEffectiveStep(selected) : 1;
  const stepDef = COHOUSING_STEP_BY_N[stepNum];
  const flagged = selected?.flag?.raised;
  const awaitingParticipant = stepDef?.owner === 'participant';
  const submitted = selected ? isStepSubmitted(selected, stepNum) : false;
  const selectedCreatedById = selected
    ? getCreatedById(selected)
    : '';
  const isCurrentUserApplicant = Boolean(
    user?._id && selectedCreatedById && selectedCreatedById === user._id,
  );
  const financials = selected ? getCohousingFinancialSummary(selected) : null;
  const formatEur = (amount: number) => formatIsoFiatAmount(amount, 'EUR');

  return (
    <>
      <CohousingAddParticipantModal
        isOpen={addParticipantOpen}
        onClose={() => setAddParticipantOpen(false)}
        onCreated={onParticipantCreated}
        existingApplicantUserIds={existingApplicantUserIds}
      />

      <main className="main-content w-full max-w-6xl mx-auto px-4 py-8">
        <Heading className="mb-6 font-sans uppercase tracking-tight">
          {t('cohousing_team_title')}
        </Heading>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
          {(
            [
              ['cohousing_team_stat_queue', String(stats.total), 'cohousing_team_stat_queue_sub'],
              ['cohousing_team_stat_quiz', String(stats.inQuiz), 'cohousing_team_stat_quiz_sub'],
              ['cohousing_team_stat_build', String(stats.inBuild), 'cohousing_team_stat_build_sub'],
              ['cohousing_team_stat_flag', String(stats.flagged), 'cohousing_team_stat_flag_sub'],
            ] as const
          ).map(([k, v, sk]) => (
            <div
              key={k}
              className="rounded-2xl border border-gray-200 bg-accent/5 px-4 py-5 text-center"
            >
              <div className="font-sans text-3xl font-black text-accent leading-none mb-2">
                {v}
              </div>
              <div className="text-xs text-gray-700 font-medium">{t(k)}</div>
              <div className="text-[11px] text-gray-500 mt-0.5">{t(sk)}</div>
            </div>
          ))}
          <div className="rounded-2xl border border-gray-200 bg-accent/5 px-4 py-5 text-center">
            <div className="font-sans text-xl sm:text-2xl font-black text-accent leading-none mb-2 tabular-nums">
              {formatIsoFiatAmount(stats.fundsCommitted.total, 'EUR')}
            </div>
            <div className="text-xs text-gray-700 font-medium">
              {t('cohousing_team_stat_committed')}
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5">
              {t('cohousing_team_stat_committed_sub', {
                count: stats.fundsCommitted.count,
              })}
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-[minmax(260px,1fr)_2fr] gap-5">
          <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white">
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 min-w-0">
                {t('cohousing_team_queue_title', { count: list.length })}
              </span>
              <button
                type="button"
                onClick={() => setAddParticipantOpen(true)}
                className="shrink-0 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-accent text-white hover:opacity-90"
              >
                {t('cohousing_app_admin_add_participant')}
              </button>
            </div>
            <div className="max-h-[600px] overflow-y-auto">
              {list.map((app) => {
                const active = selectedId === app._id;
                const sn = getEffectiveStep(app);
                return (
                  <button
                    key={app._id}
                    type="button"
                    onClick={() => void navigateTo(app._id)}
                    className={`w-full text-left px-4 py-3.5 border-b border-gray-100 flex gap-3 items-center transition-colors ${
                      active
                        ? 'bg-accent/10 border-l-4 border-l-accent'
                        : 'border-l-4 border-l-transparent'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-full bg-accent text-white flex items-center justify-center font-sans text-xs font-black shrink-0">
                      {labelForApp(app, t).slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-sm font-bold text-gray-900 truncate">
                          {labelForApp(app, t)}
                        </span>
                        {app.flag?.raised && (
                          <span className="text-[9px] font-black text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-full">
                            !
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-gray-500 mt-0.5">
                        {t('cohousing_team_step_short', {
                          step: sn,
                          short: t(COHOUSING_STEP_BY_N[sn].shortKey),
                        })}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {!selected ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 text-gray-600">
              {error || t('cohousing_app_not_found')}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="rounded-2xl border border-gray-200 p-6 bg-white">
                <div className="flex flex-wrap gap-4 items-start">
                  <div className="w-14 h-14 rounded-full bg-accent text-white flex items-center justify-center font-sans text-xl font-black shrink-0">
                    {labelForApp(selected, t).slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <div className="font-sans text-2xl sm:text-3xl font-black uppercase text-gray-900 tracking-tight">
                      {labelForApp(selected, t)}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {selected.intake?.email || '—'}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase ${statusStyle(
                          selected.status,
                        )}`}
                      >
                        {selected.status || 'pending'}
                      </span>
                      {selected.source && (
                        <FlowBadge>
                          {typeof selected.source === 'string'
                            ? selected.source
                            : JSON.stringify(selected.source)}
                        </FlowBadge>
                      )}
                      {flagged && (
                        <FlowBadge className="border-red-300 bg-red-50 text-red-800">
                          {t('cohousing_team_flagged')}
                        </FlowBadge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase text-gray-500 block">
                      {t('cohousing_team_at_step')}
                    </span>
                    <div className="font-sans text-4xl font-black text-accent leading-none">
                      {stepNum}
                      <span className="text-gray-400 text-xl">/14</span>
                    </div>
                  </div>
                </div>

                {financials && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-3">
                      {t('cohousing_app_admin_financials')}
                    </span>
                    <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                      {financials.financingMode && (
                        <>
                          <dt className="text-gray-500">
                            {t('cohousing_app_admin_financials_mode')}
                          </dt>
                          <dd className="font-medium text-gray-900 capitalize">
                            {financials.financingMode}
                          </dd>
                        </>
                      )}
                      {financials.tier && (
                        <>
                          <dt className="text-gray-500">
                            {t('cohousing_app_admin_financials_tier')}
                          </dt>
                          <dd className="font-medium text-gray-900">
                            {t(getCohousingTierLabelKey(financials.tier))}
                          </dd>
                        </>
                      )}
                      {financials.reservationAmount != null &&
                        financials.tier !== 'existing' && (
                          <>
                            <dt className="text-gray-500">
                              {t('cohousing_app_admin_financials_reservation')}
                            </dt>
                            <dd className="font-sans tabular-nums font-bold text-gray-900">
                              {formatEur(financials.reservationAmount)}
                            </dd>
                          </>
                        )}
                      {financials.topupAmount != null && (
                        <>
                          <dt className="text-gray-500">
                            {t('cohousing_app_admin_financials_topup')}
                          </dt>
                          <dd className="font-sans tabular-nums font-bold text-gray-900">
                            {formatEur(financials.topupAmount)}
                            {financials.topupRate != null && (
                              <span className="ml-1.5 text-xs font-normal text-gray-500">
                                {t('cohousing_app_admin_financials_topup_rate', {
                                  rate: financials.topupRate.toFixed(2),
                                })}
                              </span>
                            )}
                          </dd>
                        </>
                      )}
                      {financials.totalAmount != null &&
                        financials.tier !== 'existing' && (
                          <>
                            <dt className="text-gray-500">
                              {t('cohousing_app_admin_financials_total')}
                            </dt>
                            <dd className="font-sans tabular-nums font-black text-accent text-lg">
                              {formatEur(financials.totalAmount)}
                            </dd>
                          </>
                        )}
                      {financials.documentsAcknowledged && (
                        <>
                          <dt className="text-gray-500">
                            {t('cohousing_app_admin_financials_documents')}
                          </dt>
                          <dd className="text-green-700 font-medium">
                            {t('cohousing_app_admin_financials_documents_yes')}
                          </dd>
                        </>
                      )}
                    </dl>
                  </div>
                )}

                {selected.readiness && (
                  <div className="mt-4 p-3 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-700">
                    {t('cohousing_team_readiness_note')}
                  </div>
                )}

                {isCurrentUserApplicant && (
                  <div className="mt-4">
                    <Link
                      href={`/cohousing/application/${selected._id}`}
                      className="text-accent font-medium text-sm hover:underline"
                    >
                      {t('cohousing_app_admin_back_to_participant')}
                    </Link>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">
                  {t('cohousing_app_admin_status')}
                </p>
                <div className="flex flex-wrap gap-2 items-center">
                  <select
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                  >
                    {['waitlist', 'active', 'approved', 'dropped'].map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void patchSelected({ status: selectedStatus })}
                    className="px-3.5 py-2 rounded-lg bg-accent text-white text-sm font-medium disabled:opacity-60"
                  >
                    {t('cohousing_app_admin_save_status')}
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">
                  {t('cohousing_app_admin_step')}
                </p>
                <p className="text-sm text-gray-700 mb-2">
                  {stepNum} · {stepDef ? t(stepDef.titleKey) : '—'}
                </p>
                <p className="text-sm text-gray-600 mb-3">
                  {awaitingParticipant
                    ? submitted
                      ? t('cohousing_app_admin_ready_to_advance')
                      : t('cohousing_app_admin_waiting_submission')
                    : t('cohousing_app_admin_team_step')}
                </p>
                <button
                  type="button"
                  disabled={
                    saving || stepNum >= 14 || (awaitingParticipant && !submitted)
                  }
                  onClick={() =>
                    void patchSelected({
                      currentStep: Math.min(stepNum + 1, 14),
                      stepHistory: [
                        ...(selected.stepHistory || []),
                        {
                          step: stepNum,
                          event: 'team_approved_step',
                          at: new Date().toISOString(),
                          by: user?._id,
                        },
                      ],
                    })
                  }
                  className="px-3.5 py-2 rounded-lg border border-gray-300 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('cohousing_app_admin_advance_step')}
                </button>
              </div>

              {stepDef?.teamActionKey && (
                <div className="rounded-2xl border-2 border-accent bg-accent/5 p-5">
                  <span className="text-[10px] font-bold uppercase text-accent block mb-1">
                    {t('cohousing_team_action_required')}
                  </span>
                  <div className="font-sans text-xl font-black uppercase text-gray-900">
                    {t(stepDef.teamActionKey)}
                  </div>
                  <p className="text-sm text-gray-600 mt-2">{t(stepDef.descKey)}</p>
                </div>
              )}

              <CohousingQuizResultsView application={selected} />

              {selected.teamNotes && selected.teamNotes.length > 0 && (
                <div className="rounded-2xl border border-gray-200 p-4 bg-gray-50">
                  <span className="text-[10px] font-bold uppercase text-gray-500">
                    {t('cohousing_team_notes')}
                  </span>
                  <ul className="mt-2 space-y-2 text-sm text-gray-700">
                    {selected.teamNotes.map((n, i) => (
                      <li key={i}>
                        {n.text}
                        <span className="text-gray-400 text-xs ml-2">
                          {n.at} · {n.by}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">
                  {t('cohousing_app_admin_raw')}
                </p>
                <pre className="text-xs text-gray-700 overflow-auto whitespace-pre-wrap break-words max-h-64">
                  {JSON.stringify(selected, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
};
