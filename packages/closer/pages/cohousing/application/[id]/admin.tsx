import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import CohousingAddParticipantModal from '../../../../components/cohousing/cohousingAddParticipantModal';
import { COHOUSING_STEP_BY_N } from '../../../../components/cohousing/cohousingTimeline';
import Spinner from '../../../../components/ui/Spinner';
import { useAuth } from '../../../../contexts/auth';
import { usePlatform } from '../../../../contexts/platform';
import type { CohousingApplication } from '../../../../types/cohousingApplication';
import { loadLocaleData } from '../../../../utils/locale.helpers';
import PageNotAllowed from '../../../401';

const clampStep = (n: number) => Math.min(Math.max(Math.floor(n), 1), 14);

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

const getDisplayName = (app: CohousingApplication) => {
  if (app.intake?.fullName) {
    return app.intake.fullName;
  }
  if (typeof app.createdBy === 'object' && app.createdBy?.screenname) {
    return app.createdBy.screenname;
  }
  return app._id;
};

const isStepSubmitted = (app: CohousingApplication, step: number) =>
  (app.stepHistory || []).some(
    (entry) => entry?.event === 'participant_submitted' && Number(entry?.step) === step,
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

const statusDot = (status: string | undefined) => {
  switch (status) {
    case 'waitlist':
      return 'bg-gray-400';
    case 'active':
      return 'bg-blue-500';
    case 'approved':
      return 'bg-green-500';
    case 'dropped':
      return 'bg-red-500';
    default:
      return 'bg-amber-500';
  }
};

const CohousingApplicationAdminPage = () => {
  const t = useTranslations();
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const { platform } = usePlatform() as { platform: any };

  const [apps, setApps] = useState<CohousingApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState('active');
  const [addParticipantOpen, setAddParticipantOpen] = useState(false);

  const isTeamRole = Boolean(
    user?.roles?.includes('admin') ||
      user?.roles?.includes('community-curator') ||
      user?.roles?.includes('team'),
  );

  const selectedId =
    typeof id === 'string' ? id : apps[0]?._id || null;

  const selected = useMemo(
    () => apps.find((app) => app._id === selectedId) || null,
    [apps, selectedId],
  );

  const existingApplicantUserIds = useMemo(() => {
    const set = new Set<string>();
    for (const app of apps) {
      const uid = getApplicantUserId(app);
      if (uid) {
        set.add(uid);
      }
    }
    return set;
  }, [apps]);

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
      setApps(rows);
    } catch {
      setError(t('cohousing_app_load_error'));
      setApps([]);
    } finally {
      setLoading(false);
    }
  }, [platform, t]);

  useEffect(() => {
    if (router.isReady && isTeamRole) {
      void load();
    }
  }, [router.isReady, isTeamRole, load]);

  useEffect(() => {
    if (selected?.status) {
      setSelectedStatus(selected.status);
    }
  }, [selected]);

  const navigateTo = useCallback(
    async (nextId: string) => {
      await router.replace(`/cohousing/application/${nextId}/admin`, undefined, {
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
      } catch {
        setError(t('cohousing_intake_error_generic'));
      } finally {
        setSaving(false);
      }
    },
    [load, platform, selected?._id, t],
  );

  if (!user || !isTeamRole) {
    return <PageNotAllowed />;
  }

  if (!router.isReady || loading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    );
  }

  if (error && !selected) {
    return (
      <main className="main-content w-full max-w-3xl mx-auto px-4 py-16 text-center text-gray-700">
        {error}
      </main>
    );
  }

  const step = clampStep(selected?.currentStep ?? 1);
  const stepDef = COHOUSING_STEP_BY_N[step];
  const awaitingParticipant = stepDef?.owner === 'participant';
  const submitted = selected ? isStepSubmitted(selected, step) : false;

  return (
    <>
      <CohousingAddParticipantModal
        isOpen={addParticipantOpen}
        onClose={() => setAddParticipantOpen(false)}
        onCreated={onParticipantCreated}
        existingApplicantUserIds={existingApplicantUserIds}
      />
      <Head>
        <title>{t('cohousing_app_admin_page_title')}</title>
      </Head>
      <main className="main-content w-full max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
          <h1 className="text-3xl font-semibold text-gray-900">
            {t('cohousing_app_admin_title')}
          </h1>
          {selected && (
            <Link
              href={`/cohousing/application/${selected._id}`}
              className="text-accent underline font-medium"
            >
              {t('cohousing_app_admin_back_to_participant')}
            </Link>
          )}
        </div>

        <div className="grid lg:grid-cols-[340px_1fr] gap-5">
          <aside className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between gap-2">
              <p className="text-xs uppercase tracking-wide text-gray-500 min-w-0">
                {t('cohousing_app_admin_participants', { count: apps.length })}
              </p>
              <button
                type="button"
                onClick={() => setAddParticipantOpen(true)}
                className="shrink-0 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-accent text-white hover:opacity-90"
              >
                {t('cohousing_app_admin_add_participant')}
              </button>
            </div>
            <div className="max-h-[72vh] overflow-y-auto">
              {apps.map((app) => {
                const active = app._id === selectedId;
                const appStep = clampStep(app.currentStep ?? 1);
                return (
                  <button
                    key={app._id}
                    type="button"
                    onClick={() => void navigateTo(app._id)}
                    className={`w-full text-left px-4 py-3 border-b border-gray-100 transition-colors ${
                      active ? 'bg-accent/10' : 'bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {getDisplayName(app)}
                      </p>
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${statusDot(app.status)}`}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {t('cohousing_app_admin_step')}: {appStep}
                    </p>
                  </button>
                );
              })}
            </div>
          </aside>

          <section>
            {!selected ? (
              <div className="rounded-xl border border-gray-200 bg-white p-6 text-gray-600">
                {t('cohousing_app_not_found')}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                        {t('cohousing_app_admin_applicant')}
                      </p>
                      <p className="text-lg font-medium text-gray-900">
                        {getDisplayName(selected)}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {selected.intake?.email || '—'}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full border text-xs font-semibold uppercase ${statusStyle(
                        selected.status,
                      )}`}
                    >
                      {selected.status || 'pending'}
                    </span>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">
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

                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">
                    {t('cohousing_app_admin_step')}
                  </p>
                  <p className="text-sm text-gray-700 mb-3">
                    {step} · {stepDef ? t(stepDef.titleKey) : '—'}
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
                    disabled={saving || step >= 14 || (awaitingParticipant && !submitted)}
                    onClick={() =>
                      void patchSelected({
                        currentStep: Math.min(step + 1, 14),
                        stepHistory: [
                          ...(selected.stepHistory || []),
                          {
                            step,
                            event: 'team_approved_step',
                            at: new Date().toISOString(),
                            by: user._id,
                          },
                        ],
                      })
                    }
                    className="px-3.5 py-2 rounded-lg border border-gray-300 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t('cohousing_app_admin_advance_step')}
                  </button>
                </div>

                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">
                    {t('cohousing_app_admin_raw')}
                  </p>
                  <pre className="text-xs text-gray-700 overflow-auto whitespace-pre-wrap break-words">
                    {JSON.stringify(selected, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
};

export default CohousingApplicationAdminPage;

export async function getStaticProps({ locale }: NextPageContext) {
  return {
    props: {
      messages: await loadLocaleData(locale as string, 'tdf'),
    },
  };
}

export async function getStaticPaths() {
  return { paths: [], fallback: 'blocking' };
}
