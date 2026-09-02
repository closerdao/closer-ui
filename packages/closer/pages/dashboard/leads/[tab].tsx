import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { useCallback, useEffect, useMemo, useState } from 'react';

import AdminLayout from '../../../components/Dashboard/AdminLayout';
import DashboardPageHeader from '../../../components/Dashboard/DashboardPageHeader';
import LeadCard, {
  LeadOwnerOption,
} from '../../../components/Dashboard/LeadCard';
import LeadEmailModal from '../../../components/Dashboard/LeadEmailModal';
import Pagination from '../../../components/Pagination';
import { Button, Spinner } from '../../../components/ui';

import { useTranslations } from 'next-intl';

import PageNotAllowed from '../../401';
import { useAuth } from '../../../contexts/auth';
import useRBAC from '../../../hooks/useRBAC';
import { Lead, LeadDraftFields, LeadEmailTemplate } from '../../../types/lead';
import { parseMessageFromError } from '../../../utils/common';
import {
  LEAD_PRESETS,
  buildLeadPatchPayload,
  buildLeadsQuery,
  canEnrichLeads,
  draftFieldsFromLead,
  isLeadsManager,
  leadEmailTemplatesFrom,
  leadEmailTypeFor,
  leadId,
  leadOwnerIds,
  leadsTabPath,
  resolveLeadPreset,
} from '../../../utils/leads.helpers';
import {
  enrichLead,
  fetchLeadActions,
  fetchLeadOwnerCandidates,
  fetchLeadOwners,
  fetchLeadsBoard,
  patchLead,
  previewLeadEmail,
  sendLeadEmail,
  syncLeads,
} from '../../../utils/leads.utils';

const LIST_LIMIT = 25;
const SEARCH_DEBOUNCE_MS = 300;

const LeadsDashboardPage = () => {
  const t = useTranslations();
  const router = useRouter();
  const { user } = useAuth();
  const { hasAccess } = useRBAC();

  const isManager = isLeadsManager(user);
  const canEnrich = canEnrichLeads(user);

  // The tab is the route segment, so the filter is linkable and survives a reload.
  const preset = resolveLeadPreset(router.query.tab);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  // `?lead=<id>` is how an application card points here: the board has no
  // per-lead route, so the linked lead opens expanded when it is on the page.
  const linkedLeadId = Array.isArray(router.query.lead)
    ? router.query.lead[0]
    : router.query.lead;
  const [drafts, setDrafts] = useState<Record<string, LeadDraftFields>>({});
  const [ownerNames, setOwnerNames] = useState<Record<string, string>>({});
  const [ownerOptions, setOwnerOptions] = useState<LeadOwnerOption[]>([]);
  const [emailTemplates, setEmailTemplates] = useState<LeadEmailTemplate[]>([]);
  const [emailTemplatesError, setEmailTemplatesError] = useState<string | null>(
    null,
  );
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  const hasAccessToLeads = hasAccess('Leads');

  useEffect(() => {
    const timer = setTimeout(
      () => setDebouncedSearch(search),
      SEARCH_DEBOUNCE_MS,
    );
    return () => clearTimeout(timer);
  }, [search]);

  const query = useMemo(
    () => buildLeadsQuery(preset, debouncedSearch),
    [preset, debouncedSearch],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { rows, total: count } = await fetchLeadsBoard({
        ...query,
        page,
        limit: LIST_LIMIT,
      });
      setLeads(rows);
      setTotal(count);
    } catch (err) {
      setError(parseMessageFromError(err));
      setLeads([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, query]);

  useEffect(() => {
    setPage(1);
  }, [preset, debouncedSearch]);

  useEffect(() => {
    if (linkedLeadId) setExpandedId(linkedLeadId);
  }, [linkedLeadId]);

  useEffect(() => {
    if (!user || !hasAccessToLeads) return;
    load();
  }, [load, user, hasAccessToLeads]);

  // Only a manager may reassign, so only a manager needs the candidate list.
  useEffect(() => {
    if (!user || !hasAccessToLeads || !isManager) {
      setOwnerOptions([]);
      return;
    }
    let cancelled = false;
    fetchLeadOwnerCandidates().then((candidates) => {
      if (cancelled) return;
      setOwnerOptions(
        candidates.map((candidate) => ({
          value: candidate._id,
          label: candidate.screenname || candidate.email || candidate._id,
        })),
      );
    });
    return () => {
      cancelled = true;
    };
  }, [user, hasAccessToLeads, isManager]);

  // The templates the send modal offers come from the API's action vocabulary.
  useEffect(() => {
    if (!user || !hasAccessToLeads) return;
    let cancelled = false;
    setEmailTemplatesError(null);
    fetchLeadActions()
      .then((vocabulary) => {
        if (!cancelled) setEmailTemplates(leadEmailTemplatesFrom(vocabulary));
      })
      .catch((err) => {
        // The button stays; the modal says the list could not be read, which
        // is a different problem from an instance with no templates.
        if (cancelled) return;
        setEmailTemplates([]);
        setEmailTemplatesError(parseMessageFromError(err));
      });
    return () => {
      cancelled = true;
    };
  }, [user, hasAccessToLeads]);

  /**
   * Owners come back as ids. Keyed on the ids themselves so an assignment
   * refetches the names while an unrelated re-render does not.
   */
  const ownerIdsKey = useMemo(
    () =>
      Array.from(new Set(leads.flatMap(leadOwnerIds)))
        .sort()
        .join(','),
    [leads],
  );

  useEffect(() => {
    if (!ownerIdsKey) {
      setOwnerNames({});
      return;
    }
    let cancelled = false;
    fetchLeadOwners(ownerIdsKey.split(',')).then((owners) => {
      if (cancelled) return;
      setOwnerNames(
        owners.reduce((acc: Record<string, string>, owner) => {
          acc[owner._id] = owner.screenname || owner.email || owner._id;
          return acc;
        }, {}),
      );
    });
    return () => {
      cancelled = true;
    };
  }, [ownerIdsKey]);

  /**
   * Seed edit state for rows the board has not shown before. A row already
   * being edited keeps its in-progress values across a reload.
   */
  useEffect(() => {
    setDrafts((prev) => {
      const next = { ...prev };
      for (const lead of leads) {
        const id = leadId(lead);
        if (next[id] === undefined) next[id] = draftFieldsFromLead(lead);
      }
      return next;
    });
  }, [leads]);

  const draftFor = (lead: Lead): LeadDraftFields =>
    drafts[leadId(lead)] ?? draftFieldsFromLead(lead);

  const setDraft = (
    id: string,
    field: keyof LeadDraftFields,
    value: string,
  ) => {
    setDrafts((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  };

  /** Runs the given call with the row marked busy, then refreshes the board. */
  const runRowAction = async (
    id: string,
    action: () => Promise<unknown>,
    { forgetDraft = false } = {},
  ) => {
    setSavingId(id);
    setError(null);
    try {
      await action();
      await load();
      // Dropped only once the reload has landed, so the field keeps showing
      // what was typed rather than flashing back to the pre-save value.
      if (forgetDraft) setDrafts(({ [id]: _saved, ...rest }) => rest);
    } catch (err) {
      setError(parseMessageFromError(err));
    } finally {
      setSavingId(null);
    }
  };

  const saveDraft = (lead: Lead) => {
    const id = leadId(lead);
    const payload = buildLeadPatchPayload(lead, draftFor(lead));
    // Blur fires on every field, including the ones nobody touched.
    if (Object.keys(payload).length === 0) return;
    void runRowAction(id, () => patchLead(id, payload), { forgetDraft: true });
  };

  const assignOwner = (lead: Lead, userId: string) => {
    const id = leadId(lead);
    void runRowAction(id, () =>
      patchLead(id, { managedBy: userId ? [userId] : [] }),
    );
  };

  const logContact = (lead: Lead) => {
    const id = leadId(lead);
    void runRowAction(id, () =>
      patchLead(id, { lastContactedAt: new Date().toISOString() }),
    );
  };

  const reEnrich = (lead: Lead) => {
    const id = leadId(lead);
    void runRowAction(id, () => enrichLead(id));
  };

  const rebuildLinks = async () => {
    setError(null);
    setLoading(true);
    try {
      await syncLeads();
      await load();
    } catch (err) {
      setError(parseMessageFromError(err));
      setLoading(false);
    }
  };

  if (!user || !hasAccessToLeads) {
    return <PageNotAllowed />;
  }

  return (
    <>
      <Head>
        <title>{t('dashboard_leads_title')}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <AdminLayout>
        <div className="flex flex-col gap-6 max-w-4xl">
          <DashboardPageHeader
            title={t('dashboard_leads_title')}
            subtitle={t('dashboard_leads_subtitle')}
          >
            <Button
              size="small"
              variant="primary"
              isFullWidth={false}
              isEnabled={!loading}
              onClick={() => setIsEmailModalOpen(true)}
            >
              {t('dashboard_leads_send_email')}
            </Button>
            {canEnrich && (
              <Button
                size="small"
                variant="secondary"
                isFullWidth={false}
                isEnabled={!loading}
                onClick={rebuildLinks}
              >
                {t('dashboard_leads_sync')}
              </Button>
            )}
          </DashboardPageHeader>

          {isEmailModalOpen && (
            <LeadEmailModal
              templates={emailTemplates}
              templatesError={emailTemplatesError}
              type={leadEmailTypeFor(preset)}
              onClose={() => setIsEmailModalOpen(false)}
              // The timeline and `emailsSent` changed for everyone written to.
              onSent={() => void load()}
              previewEmail={previewLeadEmail}
              sendEmail={sendLeadEmail}
            />
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <nav
              className="flex flex-wrap gap-1 p-1 bg-gray-100 rounded-full"
              aria-label={t('dashboard_leads_filter_label')}
            >
              {LEAD_PRESETS.map((option) => {
                const active = preset === option;
                return (
                  <Link
                    key={option}
                    href={leadsTabPath(option)}
                    aria-current={active ? 'page' : undefined}
                    className={`text-sm rounded-full px-3 py-1.5 transition-colors ${
                      active
                        ? 'bg-white text-gray-900 shadow-sm font-medium'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {t(`dashboard_leads_filter_${option}`)}
                  </Link>
                );
              })}
            </nav>

            <div className="flex flex-col gap-1 min-w-[200px]">
              <label
                htmlFor="leads-search"
                className="text-xs font-medium text-gray-500 uppercase tracking-wide"
              >
                {t('dashboard_leads_search_label')}
              </label>
              <input
                id="leads-search"
                type="search"
                className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
                placeholder={t('dashboard_leads_search_placeholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
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
          ) : leads.length === 0 ? (
            <p className="text-sm text-gray-600">
              {t('dashboard_leads_empty')}
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {leads.map((lead) => {
                const id = leadId(lead);
                const ownerId = leadOwnerIds(lead)[0];
                return (
                  <LeadCard
                    key={id}
                    lead={lead}
                    draft={draftFor(lead)}
                    isExpanded={expandedId === id}
                    isBusy={savingId === id}
                    isManager={isManager}
                    canEnrich={canEnrich}
                    ownerName={ownerId ? ownerNames[ownerId] ?? ownerId : null}
                    ownerOptions={ownerOptions}
                    onToggle={() =>
                      setExpandedId((prev) => (prev === id ? null : id))
                    }
                    onDraftChange={(field, value) => setDraft(id, field, value)}
                    onDraftBlur={() => saveDraft(lead)}
                    onOwnerChange={(userId) => assignOwner(lead, userId)}
                    onLogContact={() => logContact(lead)}
                    onEnrich={() => reEnrich(lead)}
                  />
                );
              })}
            </div>
          )}

          {!loading && total > LIST_LIMIT && (
            <Pagination
              loadPage={(nextPage: number) => setPage(nextPage)}
              page={page}
              limit={LIST_LIMIT}
              total={total}
            />
          )}
        </div>
      </AdminLayout>
    </>
  );
};

export default LeadsDashboardPage;
