import Head from 'next/head';

import { useCallback, useEffect, useMemo, useState } from 'react';

import AdminLayout from '../../../components/Dashboard/AdminLayout';
import DashboardPageHeader from '../../../components/Dashboard/DashboardPageHeader';
import LeadsGlossary from '../../../components/Dashboard/LeadsGlossary';
import Pagination from '../../../components/Pagination';
import TimeSince from '../../../components/TimeSince';
import { Button, LinkButton, Spinner } from '../../../components/ui';

import { useTranslations } from 'next-intl';

import PageNotAllowed from '../../401';
import { useAuth } from '../../../contexts/auth';
import { usePlatform } from '../../../contexts/platform';
import { useConfig } from '../../../hooks/useConfig';
import useRBAC from '../../../hooks/useRBAC';
import models from '../../../models';
import { GeneralConfig } from '../../../types';
import { Village } from '../../../types/village';
import { getCachedConfig } from '../../../utils/cachedConfig.helpers';
import { parseMessageFromError } from '../../../utils/common';
import { canEnrichLeads } from '../../../utils/leads.helpers';
import { syncLeads } from '../../../utils/leads.utils';
import {
  Application,
  fetchVillagesByApplicationIds,
  getApplicationLinkHrefs,
} from '../../../utils/villageApplication.utils';
import PageNotFound from '../../not-found';

const LIST_LIMIT = 20;

/**
 * A federation curates villages rather than members, so each application is a
 * candidate listing on the map — everywhere else the applications dashboard is
 * unchanged. Read at call time rather than at module load so the flag can be
 * flipped per app without the bundle caching a stale value.
 */
const isFederation = () => process.env.NEXT_PUBLIC_IS_FEDERATION === 'true';

const STATUSES = ['open', 'conversation', 'approved', 'rejected'] as const;

type ApplicationStatus = (typeof STATUSES)[number];
type StatusFilter = ApplicationStatus | 'all';

/** Fields rendered in the card header rather than in the answers list. */
const HEADER_FIELDS = ['name', 'email', 'phone'];

const STATUS_STYLES: Record<ApplicationStatus, string> = {
  open: 'bg-accent-light text-accent',
  conversation: 'bg-blue-100 text-blue-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-gray-200 text-gray-600',
};

const answerFields = models.application.filter(
  (field) => !HEADER_FIELDS.includes(field.name),
);

/** `fields` keys are free-form, so turn `communitySize` into `Community size`. */
const humanizeFieldName = (name: string) =>
  name
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z\d])([A-Z])/g, '$1 $2')
    .trim()
    .split(/\s+/)
    .map((word, index) => {
      // Acronyms (URL, ID) keep their casing; everything else reads as a sentence.
      const cased = word === word.toUpperCase() ? word : word.toLowerCase();
      return index === 0
        ? cased.charAt(0).toUpperCase() + cased.slice(1)
        : cased;
    })
    .join(' ');

/** `fields` values are whatever the form sent — render them without crashing. */
const formatFieldValue = (value: unknown): string => {
  if (value === null || value === undefined || value === '') return '';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.map(formatFieldValue).join(', ');
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
};

/**
 * Merges the answers the legacy model asks for with the free-form `fields`
 * object, dropping anything unanswered so a card only shows real content.
 */
const getAnswers = (application: Application) => {
  const modelAnswers = answerFields
    .map(({ name, label }) => ({
      key: name,
      label,
      value: formatFieldValue(application[name]),
    }))
    .filter(({ value }) => value);

  const customAnswers = Object.entries(application.fields || {})
    .map(([name, value]) => ({
      key: `fields.${name}`,
      label: humanizeFieldName(name),
      value: formatFieldValue(value),
    }))
    .filter(({ value }) => value);

  return [...modelAnswers, ...customAnswers];
};

const ApplicationsDashboardPage = () => {
  const t = useTranslations();
  const { user } = useAuth();
  const { platform } = usePlatform() as { platform: any };
  const { hasAccess } = useRBAC();

  const defaultConfig = useConfig();
  const generalConfig = getCachedConfig('general') as GeneralConfig | null;
  const platformName =
    generalConfig?.platformName || defaultConfig?.platformName || '';
  // Turning the `applications` config off takes the whole feature away.
  const isApplicationsEnabled = defaultConfig?.applications?.enabled === true;

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);
  const [applications, setApplications] = useState<Application[]>([]);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState<Record<ApplicationStatus, number>>({
    open: 0,
    conversation: 0,
    approved: 0,
    rejected: 0,
  });
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [villagesByApplication, setVillagesByApplication] = useState<
    Record<string, Village>
  >({});

  const hasAccessToApplications =
    hasAccess('Applications') && isApplicationsEnabled;
  // Same gate as the leads board: the sync is a platform-wide job, not a
  // per-application edit, so only admin and team may kick it off.
  const canSync = canEnrichLeads(user);

  // `undefined` drops the `where` param entirely so the API returns every status.
  const where = useMemo(
    () => (statusFilter === 'all' ? undefined : { status: statusFilter }),
    [statusFilter],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [listAction, countAction] = await Promise.all([
        platform.application.get(
          { where, limit: LIST_LIMIT, page },
          { force: true },
        ),
        platform.application.getCount({ where }),
      ]);

      const rows = listAction?.results?.toJS?.() ?? [];
      setApplications(Array.isArray(rows) ? rows : []);

      const count = Number(countAction?.results);
      setTotal(Number.isNaN(count) ? rows.length : count);

      if (isFederation()) {
        // Looked up in one request for the whole page, so a village that was
        // already created shows as a link instead of a duplicate invitation.
        setVillagesByApplication(
          await fetchVillagesByApplicationIds(
            rows
              .map((row: Application) => row._id)
              .filter((id: string | undefined): id is string => Boolean(id)),
          ),
        );
      }
    } catch {
      setError(t('dashboard_applications_error_load'));
      setApplications([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, platform.application, t, where]);

  const loadCounts = useCallback(async () => {
    try {
      const actions = await Promise.all(
        STATUSES.map((status) =>
          platform.application.getCount({ where: { status } }),
        ),
      );
      setCounts(
        STATUSES.reduce((acc, status, index) => {
          const value = Number(actions[index]?.results);
          acc[status] = Number.isNaN(value) ? 0 : value;
          return acc;
        }, {} as Record<ApplicationStatus, number>),
      );
    } catch {
      // Counts are decorative — a failure here should not blank the list.
    }
  }, [platform.application]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  useEffect(() => {
    if (!user || !hasAccessToApplications) return;
    load();
  }, [load, user, hasAccessToApplications]);

  useEffect(() => {
    if (!user || !hasAccessToApplications) return;
    loadCounts();
  }, [loadCounts, user, hasAccessToApplications]);

  const updateStatus = async (id: string, status: ApplicationStatus) => {
    setSavingId(id);
    setError(null);
    try {
      await platform.application.patch(id, { status });
      await load();
      await loadCounts();
    } catch {
      setError(t('dashboard_applications_error_save'));
    } finally {
      setSavingId(null);
    }
  };

  const mailtoHref = (application: Application) => {
    const subject = encodeURIComponent(
      t('dashboard_applications_email_subject', { platformName }),
    );
    return `mailto:${application.email}?subject=${subject}`;
  };

  if (!isApplicationsEnabled) {
    return <PageNotFound />;
  }

  // Rebuilds the links between applications and the villages, leads and
  // accounts they turned into; the list is reloaded so the new links show.
  const rebuildLinks = async () => {
    setError(null);
    setSyncing(true);
    try {
      await syncLeads();
      await Promise.all([load(), loadCounts()]);
    } catch (err) {
      setError(parseMessageFromError(err));
    } finally {
      setSyncing(false);
    }
  };

  if (!user || !hasAccessToApplications) {
    return <PageNotAllowed />;
  }

  return (
    <>
      <Head>
        <title>{`${t(
          'dashboard_applications_title',
        )} - ${platformName}`}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <AdminLayout>
        <div className="flex flex-col gap-6 max-w-4xl">
          <DashboardPageHeader
            title={t('dashboard_applications_title')}
            subtitle={t('dashboard_applications_subtitle')}
          >
            {canSync && (
              <Button
                size="small"
                variant="secondary"
                isFullWidth={false}
                isEnabled={!loading && !syncing}
                isLoading={syncing}
                onClick={rebuildLinks}
              >
                {t('dashboard_applications_sync_leads')}
              </Button>
            )}
            <div className="flex flex-col gap-1 min-w-[200px]">
              <label
                htmlFor="application-status-filter"
                className="text-xs font-medium text-gray-500 uppercase tracking-wide"
              >
                {t('dashboard_applications_filter_label')}
              </label>
              <select
                id="application-status-filter"
                className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as StatusFilter)
                }
              >
                <option value="all">
                  {t('dashboard_applications_filter_all')}
                </option>
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {t(`dashboard_applications_status_${status}`)}
                  </option>
                ))}
              </select>
            </div>
          </DashboardPageHeader>

          <LeadsGlossary />

          <div className="flex flex-wrap gap-3">
            {STATUSES.map((status) => (
              <div
                key={status}
                className="bg-white rounded-md px-4 py-3 flex-1 min-w-[140px]"
              >
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  {t(`dashboard_applications_status_${status}`)}
                </p>
                <p className="text-xl font-bold">{counts[status]}</p>
              </div>
            ))}
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
          ) : applications.length === 0 ? (
            <p className="text-sm text-gray-600">
              {t('dashboard_applications_empty')}
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {applications.map((application) => {
                // `status` arrives as a free string; anything unrecognised
                // reads as open rather than blanking the badge.
                const status: ApplicationStatus = STATUSES.includes(
                  application.status as ApplicationStatus,
                )
                  ? (application.status as ApplicationStatus)
                  : 'open';
                const isExpanded = expandedId === application._id;
                const isSaving = savingId === application._id;
                const answers = isExpanded ? getAnswers(application) : [];
                const village = villagesByApplication[application._id];
                // `links` is what the leads sync recorded; the federation
                // lookup only fills in a village the sync has not seen yet.
                const hrefs = getApplicationLinkHrefs(application);
                const villageHref =
                  hrefs.village ||
                  (village
                    ? `/villages/${village.slug || village._id}`
                    : undefined);

                return (
                  <div
                    key={application._id}
                    className="bg-white rounded-md p-4 flex flex-col gap-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <div className="flex flex-col gap-1">
                        <p className="font-bold">
                          {application.name ||
                            t('dashboard_applications_no_name')}
                        </p>
                        <p className="text-sm text-gray-600 break-all">
                          {application.email || '—'}
                          {application.phone ? ` · ${application.phone}` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`text-xs uppercase tracking-wide rounded-full px-3 py-1 ${STATUS_STYLES[status]}`}
                        >
                          {t(`dashboard_applications_status_${status}`)}
                        </span>
                        {application.created && (
                          <span className="text-xs text-gray-500">
                            <TimeSince time={application.created} />
                          </span>
                        )}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="flex flex-col border-t border-gray-100 pt-3">
                        {answers.length === 0 ? (
                          <p className="text-sm text-gray-600 py-2">
                            {t('dashboard_applications_no_answers')}
                          </p>
                        ) : (
                          answers.map(({ key, label, value }) => (
                            <div
                              key={key}
                              className="flex flex-col gap-1 py-2 border-b border-gray-100 last:border-b-0"
                            >
                              <span className="text-xs uppercase tracking-wide text-gray-500">
                                {label}
                              </span>
                              <span className="text-sm whitespace-pre-line break-words">
                                {value}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3">
                      {application.email && (
                        <LinkButton
                          href={mailtoHref(application)}
                          variant="inline"
                          size="small"
                          isFullWidth={false}
                        >
                          {t('dashboard_applications_email_button')}
                        </LinkButton>
                      )}

                      {villageHref && (
                        <LinkButton
                          href={villageHref}
                          variant="inline"
                          size="small"
                          isFullWidth={false}
                        >
                          {t('dashboard_applications_view_village')}
                        </LinkButton>
                      )}

                      {isFederation() && !villageHref && (
                        <LinkButton
                          href={`/villages/create?applicationId=${encodeURIComponent(
                            application._id,
                          )}`}
                          variant="inline"
                          size="small"
                          isFullWidth={false}
                        >
                          {t('dashboard_applications_create_village')}
                        </LinkButton>
                      )}

                      {hrefs.lead && (
                        <LinkButton
                          href={hrefs.lead}
                          variant="inline"
                          size="small"
                          isFullWidth={false}
                        >
                          {t('dashboard_applications_view_lead')}
                        </LinkButton>
                      )}

                      {hrefs.user && (
                        <LinkButton
                          href={hrefs.user}
                          variant="inline"
                          size="small"
                          isFullWidth={false}
                        >
                          {t('dashboard_applications_view_account')}
                        </LinkButton>
                      )}

                      {status === 'open' && (
                        <Button
                          size="small"
                          variant="secondary"
                          isFullWidth={false}
                          isEnabled={!isSaving}
                          onClick={() =>
                            updateStatus(application._id, 'conversation')
                          }
                        >
                          {t('application_list_start_conversation')}
                        </Button>
                      )}
                      {status === 'conversation' && (
                        <Button
                          size="small"
                          variant="secondary"
                          isFullWidth={false}
                          isEnabled={!isSaving}
                          onClick={() =>
                            updateStatus(application._id, 'approved')
                          }
                        >
                          {t('application_list_approve')}
                        </Button>
                      )}
                      {status !== 'rejected' && (
                        <Button
                          size="small"
                          variant="secondary"
                          isFullWidth={false}
                          isEnabled={!isSaving}
                          onClick={() =>
                            updateStatus(application._id, 'rejected')
                          }
                        >
                          {t('dashboard_applications_reject')}
                        </Button>
                      )}
                      {status === 'rejected' && (
                        <Button
                          size="small"
                          variant="secondary"
                          isFullWidth={false}
                          isEnabled={!isSaving}
                          onClick={() => updateStatus(application._id, 'open')}
                        >
                          {t('application_list_reopen')}
                        </Button>
                      )}

                      <button
                        type="button"
                        className="text-sm text-accent underline ml-auto"
                        onClick={() =>
                          setExpandedId(isExpanded ? null : application._id)
                        }
                      >
                        {isExpanded
                          ? t('dashboard_applications_hide_answers')
                          : t('dashboard_applications_show_answers')}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <Pagination
            loadPage={(nextPage: number) => setPage(nextPage)}
            page={page}
            limit={LIST_LIMIT}
            total={total}
          />
        </div>
      </AdminLayout>
    </>
  );
};

export default ApplicationsDashboardPage;
