import { useEffect, useState } from 'react';

import { useTranslations } from 'next-intl';
import Link from 'next/link';

import { usePlatform } from '../../contexts/platform';
import type { CohousingApplication } from '../../types/cohousingApplication';
import { COHOUSING_STEP_BY_N } from '../../constants/cohousingFlow';
import Heading from '../ui/Heading';
import { FlowBadge } from './cohousingFlowUi';

const getCreatedById = (app: CohousingApplication) => {
  const c = app.createdBy;
  if (!c) {
    return '';
  }
  return typeof c === 'string' ? c : c._id || '';
};

const getEffectiveStep = (app: CohousingApplication) => {
  if (app.status === 'waitlist') {
    return 1;
  }
  return Math.min(Math.max(app.currentStep ?? 1, 1), 14);
};

const labelForApp = (app: CohousingApplication, t: (k: string) => string) => {
  const intake = app.intake;
  if (intake && typeof intake === 'object' && 'fullName' in intake && intake.fullName) {
    return String(intake.fullName);
  }
  const id = getCreatedById(app);
  return id ? `${t('cohousing_team_applicant')}: ${id.slice(-6)}` : t('cohousing_team_unknown');
};

export const CohousingTeamView = () => {
  const t = useTranslations();
  const { platform } = usePlatform() as { platform: any };
  const [list, setList] = useState<CohousingApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selId, setSelId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const res = await platform.cohousingapplication.get({
          sort_by: 'queuedAt',
          limit: 100,
        });
        const raw = res?.results?.toJS?.() ?? res?.results;
        const rows = Array.isArray(raw) ? raw : [];
        if (!cancelled) {
          setList(rows as CohousingApplication[]);
          if (rows[0]?._id) {
            setSelId(rows[0]._id);
          }
        }
      } catch {
        if (!cancelled) {
          setList([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [platform]);

  const selected = list.find((a) => a._id === selId) || list[0];
  const stepNum = selected ? getEffectiveStep(selected) : 1;
  const st = COHOUSING_STEP_BY_N[stepNum];
  const flagged = selected?.flag?.raised;

  const stats = {
    total: list.length,
    inQuiz: list.filter((a) => (a.currentStep ?? 1) === 2).length,
    inBuild: list.filter((a) => (a.currentStep ?? 1) >= 10).length,
    flagged: list.filter((a) => a.flag?.raised).length,
  };

  return (
    <main className="main-content w-full max-w-6xl mx-auto px-4 py-8">
      <Heading className="mb-6 font-sans uppercase tracking-tight">
        {t('cohousing_team_title')}
      </Heading>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {(
          [
            ['cohousing_team_stat_queue', stats.total, 'cohousing_team_stat_queue_sub'],
            ['cohousing_team_stat_quiz', stats.inQuiz, 'cohousing_team_stat_quiz_sub'],
            ['cohousing_team_stat_build', stats.inBuild, 'cohousing_team_stat_build_sub'],
            ['cohousing_team_stat_flag', stats.flagged, 'cohousing_team_stat_flag_sub'],
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
      </div>

      {loading ? (
        <p className="text-gray-600">{t('cohousing_team_loading')}</p>
      ) : (
        <div className="grid md:grid-cols-[minmax(260px,1fr)_2fr] gap-5">
          <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white">
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                {t('cohousing_team_queue_title', { count: list.length })}
              </span>
            </div>
            <div className="max-h-[600px] overflow-y-auto">
              {list.map((app) => {
                const active = selId === app._id;
                const sn = getEffectiveStep(app);
                return (
                  <button
                    key={app._id}
                    type="button"
                    onClick={() => setSelId(app._id)}
                    className={`w-full text-left px-4 py-3.5 border-b border-gray-100 flex gap-3 items-center transition-colors ${
                      active ? 'bg-accent/10 border-l-4 border-l-accent' : 'border-l-4 border-l-transparent'
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

          {selected && (
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
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selected.source && (
                        <FlowBadge>
                          {typeof selected.source === 'string'
                            ? selected.source
                            : JSON.stringify(selected.source)}
                        </FlowBadge>
                      )}
                      {selected.financingMode && (
                        <FlowBadge className="border-amber-300 bg-amber-50 text-amber-900">
                          {selected.financingMode}
                        </FlowBadge>
                      )}
                      {selected.tier && <FlowBadge>{selected.tier}</FlowBadge>}
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

                {selected.readiness && (
                  <div className="mt-4 p-3 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-700">
                    {t('cohousing_team_readiness_note')}
                  </div>
                )}

                <div className="mt-4">
                  <Link
                    href={`/cohousing/application/${selected._id}`}
                    className="text-accent font-medium text-sm hover:underline"
                  >
                    {t('cohousing_team_open_application')}
                  </Link>
                </div>
              </div>

              {st?.teamActionKey && (
                <div className="rounded-2xl border-2 border-accent bg-accent/5 p-5">
                  <span className="text-[10px] font-bold uppercase text-accent block mb-1">
                    {t('cohousing_team_action_required')}
                  </span>
                  <div className="font-sans text-xl font-black uppercase text-gray-900">
                    {t(st.teamActionKey)}
                  </div>
                  <p className="text-sm text-gray-600 mt-2">{t(st.descKey)}</p>
                </div>
              )}

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
            </div>
          )}
        </div>
      )}
    </main>
  );
};
