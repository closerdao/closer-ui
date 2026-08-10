import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { ChevronDown, UserRound } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useTranslations } from 'next-intl';

import { usePlatform } from '../../contexts/platform';
import type { InteractionLiveRow } from '../../types/interaction';
import { cdn } from '../../utils/api';
import {
  embeddedUserFromInteraction,
  formatGeoBrief,
  formatUtmBrief,
  interactionUserId,
  signalsKeyCount,
  subscriberIdBrief,
} from '../../utils/metricsLive.helpers';

import { Heading, Spinner } from '../ui';

dayjs.extend(relativeTime);

const LIVE_POLL_MS = 15_000;
const LIVE_WINDOW_HOURS = 1;
const POP_CLEAR_MS = 2_400;

function buildLiveInteractionFilter() {
  const since = dayjs().subtract(LIVE_WINDOW_HOURS, 'hour').toISOString();
  return {
    where: { lastactive: { $gte: since } },
    limit: 100,
    sort_by: '-lastactive',
  };
}

function rowsFromAction(action: {
  results?: { toJS?: () => unknown } | unknown;
}): InteractionLiveRow[] {
  const r = action?.results;
  if (!r) return [];
  if (typeof (r as { toJS?: () => unknown }).toJS === 'function') {
    try {
      const j = (r as { toJS: () => unknown }).toJS();
      return Array.isArray(j) ? (j as InteractionLiveRow[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function pathLabel(row: InteractionLiveRow): string | null {
  const p = row.path ?? row.url ?? row.page;
  if (typeof p === 'string' && p.trim()) return p.trim();
  return null;
}

type UserLite = {
  _id: string;
  screenname?: string;
  email?: string;
  photo?: string;
  slug?: string;
  timezone?: string;
  lastactive?: string;
};

function DetailLine({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div className="grid grid-cols-[minmax(0,7.5rem)_1fr] gap-x-2 gap-y-0.5 text-xs">
      <dt className="text-gray-500 font-medium shrink-0">{label}</dt>
      <dd className="text-gray-800 break-words min-w-0">{value}</dd>
    </div>
  );
}

const MetricsLiveWidget = () => {
  const t = useTranslations();
  const { platform } = usePlatform() as { platform: Record<string, any> };

  const interactionApiRef = useRef(platform.interaction);
  const userApiRef = useRef(platform.user);
  useEffect(() => {
    interactionApiRef.current = platform.interaction;
    userApiRef.current = platform.user;
  }, [platform]);

  const [rows, setRows] = useState<InteractionLiveRow[]>([]);
  const [usersById, setUsersById] = useState<Record<string, UserLite>>({});
  const [liveLoading, setLiveLoading] = useState(true);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [poppingIds, setPoppingIds] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const prevIdsRef = useRef<Set<string>>(new Set());
  const firstFetchRef = useRef(true);
  const popTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );
  const rowsRef = useRef<InteractionLiveRow[]>([]);
  const usersByIdRef = useRef<Record<string, UserLite>>({});

  useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  useEffect(() => {
    usersByIdRef.current = usersById;
  }, [usersById]);

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const markPopping = useCallback((ids: string[]) => {
    if (!ids.length) return;
    setPoppingIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      return next;
    });
    ids.forEach((id) => {
      const existing = popTimeoutsRef.current.get(id);
      if (existing) clearTimeout(existing);
      popTimeoutsRef.current.set(
        id,
        setTimeout(() => {
          popTimeoutsRef.current.delete(id);
          setPoppingIds((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
        }, POP_CLEAR_MS),
      );
    });
  }, []);

  const fetchLive = useCallback(async () => {
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
      return;
    }
    if (rowsRef.current.length === 0) {
      setLiveLoading(true);
    }
    setLiveError(null);
    try {
      const filter = buildLiveInteractionFilter();
      const action = await interactionApiRef.current.get(filter, { force: true });
      const list = rowsFromAction(action);
      setRows(list);

      const idSet = new Set(
        list.map((r) => r._id).filter((id): id is string => Boolean(id)),
      );
      const newIds = [...idSet].filter((id) => !prevIdsRef.current.has(id));
      if (!firstFetchRef.current && newIds.length) {
        markPopping(newIds);
      }
      firstFetchRef.current = false;
      prevIdsRef.current = idSet;

      const userIds = [
        ...new Set(
          list
            .map((r) => interactionUserId(r))
            .filter((id): id is string => Boolean(id)),
        ),
      ];
      const missing = userIds.filter((id) => !usersByIdRef.current[id]);
      if (missing.length) {
        const uf = {
          where: { _id: { $in: missing } },
          limit: Math.min(missing.length, 100),
        };
        const uAction = await userApiRef.current.get(uf, { force: true });
        const uRows = rowsFromAction(uAction) as UserLite[];
        setUsersById((prev) => {
          const next = { ...prev };
          for (const u of uRows) {
            const id = u?._id != null ? String(u._id) : '';
            if (id) {
              next[id] = { ...u, _id: id };
            }
          }
          return next;
        });
      }
    } catch {
      setLiveError(t('metrics_live_error'));
      setRows([]);
    } finally {
      setLiveLoading(false);
    }
  }, [markPopping, t]);

  useEffect(() => {
    void fetchLive();
    const id = window.setInterval(() => {
      void fetchLive();
    }, LIVE_POLL_MS);
    const onVis = () => {
      if (document.visibilityState === 'visible') {
        void fetchLive();
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
      popTimeoutsRef.current.forEach((tid) => clearTimeout(tid));
      popTimeoutsRef.current.clear();
    };
  }, [fetchLive]);

  return (
    <div className="rounded-2xl border border-gray-200/90 bg-white shadow-md flex flex-col overflow-hidden xl:sticky xl:top-4 ring-1 ring-black/[0.03]">
      <div className="flex items-center justify-between gap-2 border-b border-gray-100 px-4 py-3 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="inline-flex h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.25)] animate-pulse"
            aria-hidden
          />
          <Heading level={4} className="truncate !mb-0">
            {t('metrics_live_title')}
          </Heading>
        </div>
        {liveLoading && rows.length === 0 ? (
          <Spinner />
        ) : null}
      </div>
      <p className="text-xs text-gray-500 px-4 pt-2.5 leading-relaxed">
        {t('metrics_live_subtitle')}
      </p>
      {liveError && (
        <p className="text-xs text-red-600 px-4 pt-1">{liveError}</p>
      )}
      <div className="max-h-[min(480px,55vh)] overflow-y-auto flex flex-col gap-2 p-3">
        {!liveLoading && rows.length === 0 ? (
          <p className="text-sm text-gray-500 px-1">{t('metrics_live_empty')}</p>
        ) : (
          rows.map((row) => {
            const uid = interactionUserId(row);
            const emb = embeddedUserFromInteraction(row);
            const prof = uid ? usersById[uid] : undefined;
            const name =
              emb?.screenname ||
              prof?.screenname ||
              emb?.email ||
              prof?.email ||
              (uid ? t('metrics_live_member') : t('metrics_live_anonymous'));
            const photoId = emb?.photo || prof?.photo;
            const photoUrl =
              photoId && cdn ? `${cdn}${photoId}-profile-sm.jpg` : null;
            const path = pathLabel(row);
            const la = row.lastactive ?? row.lastSeenAt;
            const when =
              typeof la === 'string' && la
                ? dayjs(la).fromNow()
                : t('metrics_live_now');
            const isPop = poppingIds.has(row._id);
            const isOpen = expanded.has(row._id);
            const slug = prof?.slug ?? emb?.slug;
            const memberHref =
              uid && (slug || uid) ? `/members/${slug || uid}` : null;

            const clientBits = [
              row.browser,
              row.os,
              row.device,
              row.timezone,
            ]
              .filter((x): x is string => typeof x === 'string' && x.length > 0)
              .join(' · ');

            const utmStr = formatUtmBrief(row.utm);
            const geoStr = formatGeoBrief(row.geo);
            const subId = subscriberIdBrief(row.subscriber);
            const sigN = signalsKeyCount(row.signals);

            return (
              <div
                key={row._id}
                className={`rounded-xl border overflow-hidden transition-shadow ${
                  isPop
                    ? 'border-accent/50 bg-gradient-to-br from-accent/[0.06] to-white shadow-md ring-2 ring-accent/25 animate-live-pop'
                    : 'border-gray-100 bg-gray-50/60 hover:border-gray-200/90'
                }`}
              >
                <div className="flex gap-3 px-3 py-2.5">
                  <div className="shrink-0 pt-0.5">
                    {photoUrl ? (
                      <img
                        src={photoUrl}
                        alt=""
                        className="h-11 w-11 rounded-full object-cover bg-gray-200 ring-2 ring-white shadow-sm"
                      />
                    ) : (
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-gray-200 to-gray-100 text-gray-500 ring-2 ring-white shadow-sm">
                        <UserRound className="h-5 w-5" aria-hidden />
                      </div>
                    )}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex flex-col gap-0.5">
                        {memberHref ? (
                          <Link
                            href={memberHref}
                            className="text-sm font-semibold text-accent hover:underline truncate"
                          >
                            {name}
                          </Link>
                        ) : (
                          <span className="text-sm font-semibold text-gray-900 truncate">
                            {name}
                          </span>
                        )}
                        <span className="text-[11px] text-gray-400 font-mono truncate">
                          {t('metrics_live_session')}{' '}
                          {typeof row._id === 'string' ? `…${row._id.slice(-8)}` : ''}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleExpanded(row._id)}
                        className="shrink-0 flex items-center gap-1 text-xs font-medium text-accent hover:text-accent-dark py-1 px-1.5 rounded-md hover:bg-white/80"
                        aria-expanded={isOpen}
                      >
                        {isOpen ? t('metrics_live_collapse') : t('metrics_live_expand')}
                        <ChevronDown
                          className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                          aria-hidden
                        />
                      </button>
                    </div>
                    <span className="text-xs text-gray-500">{when}</span>
                    {path ? (
                      <span className="text-xs text-gray-700 truncate font-mono" title={path}>
                        {path}
                      </span>
                    ) : null}
                    {clientBits ? (
                      <span className="text-[11px] text-gray-600 leading-snug line-clamp-2">
                        {clientBits}
                      </span>
                    ) : null}
                  </div>
                </div>
                {isOpen ? (
                  <div className="border-t border-gray-100/90 bg-white/90 px-3 py-3 flex flex-col gap-2">
                    <div className="flex flex-col gap-2">
                      <DetailLine
                        label={t('metrics_live_last_active')}
                        value={
                          row.lastactive
                            ? dayjs(row.lastactive).format('YYYY-MM-DD HH:mm')
                            : undefined
                        }
                      />
                      <DetailLine
                        label={t('metrics_live_last_seen')}
                        value={
                          row.lastSeenAt
                            ? dayjs(row.lastSeenAt).format('YYYY-MM-DD HH:mm')
                            : undefined
                        }
                      />
                      <DetailLine
                        label={t('metrics_live_linked_at')}
                        value={
                          row.linkedAt
                            ? dayjs(row.linkedAt).format('YYYY-MM-DD HH:mm')
                            : undefined
                        }
                      />
                      <DetailLine
                        label={t('metrics_live_ended_at')}
                        value={
                          row.endedAt
                            ? dayjs(row.endedAt).format('YYYY-MM-DD HH:mm')
                            : undefined
                        }
                      />
                      <DetailLine
                        label={t('metrics_live_subscriber')}
                        value={subId ?? undefined}
                      />
                      <DetailLine
                        label={t('metrics_live_ip')}
                        value={typeof row.ip === 'string' ? row.ip : undefined}
                      />
                      <DetailLine
                        label={t('metrics_live_network')}
                        value={
                          [row.screen, row.viewport, row.acceptLanguage]
                            .filter((x): x is string => typeof x === 'string' && x.length > 0)
                            .join(' · ') || undefined
                        }
                      />
                      <DetailLine
                        label={t('metrics_live_referrer')}
                        value={
                          typeof row.referrer === 'string' ? row.referrer : undefined
                        }
                      />
                      <DetailLine label={t('metrics_live_utm')} value={utmStr ?? undefined} />
                      <DetailLine label={t('metrics_live_geo')} value={geoStr ?? undefined} />
                      <DetailLine
                        label={t('metrics_live_signals')}
                        value={sigN > 0 ? String(sigN) : undefined}
                      />
                      <DetailLine
                        label={t('metrics_live_user_agent')}
                        value={
                          typeof row.userAgent === 'string'
                            ? row.userAgent.length > 160
                              ? `${row.userAgent.slice(0, 160)}…`
                              : row.userAgent
                            : undefined
                        }
                      />
                    </div>
                    {uid && prof ? (
                      <div className="pt-2 mt-1 border-t border-gray-100 flex flex-col gap-2">
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                          {t('metrics_live_member')}
                        </span>
                        <DetailLine
                          label={t('metrics_live_user_slug')}
                          value={prof.slug ?? undefined}
                        />
                        <DetailLine
                          label={t('metrics_live_user_timezone')}
                          value={prof.timezone ?? undefined}
                        />
                        <DetailLine
                          label={t('metrics_live_user_last_active')}
                          value={
                            prof.lastactive
                              ? dayjs(prof.lastactive).format('YYYY-MM-DD HH:mm')
                              : undefined
                          }
                        />
                        <DetailLine label={t('metrics_live_user_email')} value={prof.email ?? emb?.email} />
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default MetricsLiveWidget;
