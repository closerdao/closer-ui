import Link from 'next/link';

import { ArrowRight, Check, Ticket, Trophy } from 'lucide-react';
import { useTranslations } from 'next-intl';

import type { Quest, QuestMe } from '../../types/quest';
import {
  formatOdds,
  getMyTicketCount,
  getPotentialTickets,
  getTicketSourceAction,
  getTicketSources,
  getTicketsForSource,
  isQuestOpen,
} from '../../utils/quests.helpers';

interface Props {
  quest: Quest;
  me: QuestMe | null;
  totalTickets?: number;
  isAuthenticated: boolean;
  isLoading?: boolean;
  /** Events referenced by ticket sources, so a source can link to its page. */
  eventsById?: Record<string, { slug?: string; name?: string }>;
  bookingToken?: string;
}

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="flex-1 rounded-xl bg-neutral-light px-3 py-2">
    <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
      {label}
    </div>
    <div className="text-base font-semibold tabular-nums">{value}</div>
  </div>
);

const QuestEntryPanel = ({
  quest,
  me,
  totalTickets,
  isAuthenticated,
  isLoading,
  eventsById,
  bookingToken,
}: Props) => {
  const t = useTranslations();
  const isRaffle = quest.type === 'raffle';
  const isOpen = isQuestOpen(quest);
  const sources = getTicketSources(quest);
  const myTickets = getMyTicketCount(me);
  const potentialTickets = me?.potentialTickets ?? getPotentialTickets(quest);
  const odds = formatOdds(me?.odds, myTickets, totalTickets);
  const isWithdrawn = me?.entry?.status === 'withdrawn';
  const isDisqualified = me?.entry?.status === 'disqualified';
  const ticketsWithinReach = Math.max(0, potentialTickets - myTickets);
  const score = isRaffle ? myTickets : me?.entry?.points || 0;
  const progress = potentialTickets
    ? Math.min(100, Math.round((myTickets / potentialTickets) * 100))
    : 0;

  /** A source is worth pointing at while it still has tickets left in it. */
  const openSources = isRaffle
    ? sources
        .map((source) => ({
          source,
          earned: getTicketsForSource(me, source.key),
          action: getTicketSourceAction(source, { eventsById, bookingToken }),
        }))
        .filter(
          ({ source, earned, action }) => action && earned < source.maxTickets,
        )
    : [];

  if (!isAuthenticated) {
    return (
      <div className="rounded-3xl border-2 border-accent overflow-hidden">
        <div className="bg-accent-light px-6 py-3 flex items-center gap-2">
          <Ticket className="w-4 h-4 text-accent" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-accent">
            {t('quests_entry_title')}
          </span>
        </div>
        <div className="p-6">
          <p className="text-sm text-gray-600 mb-4">
            {t('quests_entry_login_prompt')}
          </p>
          <Link
            href={`/login?back=${encodeURIComponent(`/quests/${quest.slug}`)}`}
            className="btn-primary w-full text-center"
          >
            {t('quests_entry_login')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border-2 border-accent overflow-hidden">
      <div className="bg-accent-light px-6 py-3 flex items-center gap-2">
        {isRaffle ? (
          <Ticket className="w-4 h-4 text-accent" />
        ) : (
          <Trophy className="w-4 h-4 text-accent" />
        )}
        <span className="text-[11px] font-bold uppercase tracking-widest text-accent">
          {t('quests_entry_title')}
        </span>
      </div>

      <div className="p-6">
        <div className="flex items-baseline gap-2">
          <span className="text-5xl leading-none font-semibold tabular-nums">
            {isLoading && !me ? '–' : score}
          </span>
          <span className="text-sm text-gray-500">
            {isRaffle
              ? t('quests_entry_tickets_unit', { count: score })
              : t('quests_entry_points')}
          </span>
        </div>

        {isRaffle && potentialTickets > 0 && (
          <>
            <div
              className="h-1.5 rounded-full bg-neutral mt-4 overflow-hidden"
              role="progressbar"
              aria-valuenow={myTickets}
              aria-valuemin={0}
              aria-valuemax={potentialTickets}
            >
              <div
                className="h-full bg-accent rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="text-xs text-gray-500 mt-1.5">
              {t('quests_entry_of_possible', { count: potentialTickets })}
            </div>
          </>
        )}

        {(me?.rank || odds) && (
          <div className="flex gap-2 mt-4">
            {me?.rank ? (
              <Stat label={t('quests_entry_rank')} value={`#${me.rank}`} />
            ) : null}
            {odds ? <Stat label={t('quests_entry_odds')} value={odds} /> : null}
          </div>
        )}

        {isDisqualified && (
          <p className="text-sm text-failure mt-4">
            {t('quests_entry_disqualified')}
          </p>
        )}

        {isWithdrawn && (
          <p className="text-sm text-failure mt-4">
            {t('quests_entry_withdrawn')}
          </p>
        )}

        {isRaffle && sources.length > 0 && (
          <div className="mt-6">
            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-3">
              {t('quests_entry_how_to_earn')}
            </div>
            <div className="flex flex-col gap-3">
              {sources.map((source) => {
                const earned = getTicketsForSource(me, source.key);
                const isComplete = earned >= source.maxTickets;
                return (
                  <div key={source.key} className="flex gap-2.5 items-start">
                    <span
                      className={`w-5 h-5 mt-0.5 shrink-0 rounded-full grid place-items-center text-[10px] font-bold ${
                        isComplete
                          ? 'bg-accent text-accent-foreground'
                          : earned > 0
                          ? 'bg-accent-light text-accent border border-accent'
                          : 'bg-neutral border border-gray-200 text-gray-400'
                      }`}
                    >
                      {isComplete ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        earned || ''
                      )}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div
                        className={`text-sm leading-snug ${
                          isComplete
                            ? 'font-medium text-gray-500 line-through decoration-gray-300'
                            : 'font-medium'
                        }`}
                      >
                        {source.label}
                      </div>
                      {source.hint && !isComplete && (
                        <div className="text-xs text-gray-500">
                          {source.hint}
                        </div>
                      )}
                    </div>
                    <span
                      className={`text-sm tabular-nums shrink-0 ${
                        earned > 0 ? 'text-foreground' : 'text-gray-400'
                      }`}
                    >
                      {earned}/{source.maxTickets}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {Boolean(me?.pendingActions) && (
          <p className="text-sm text-gray-500 mt-4">
            {t('quests_entry_pending_actions', {
              count: me?.pendingActions || 0,
            })}
          </p>
        )}

        {isRaffle && isOpen && (
          <div className="bg-neutral rounded-xl px-3 py-2.5 text-sm text-gray-600 mt-5">
            {ticketsWithinReach > 0
              ? t('quests_entry_within_reach', { count: ticketsWithinReach })
              : t('quests_entry_complete')}
          </div>
        )}

        {/* Entry is automatic — nobody has to opt in, so say so rather than
            leaving the panel looking like it is waiting on the member. */}
        {isOpen && !isWithdrawn && !isDisqualified && (
          <p className="text-xs text-gray-500 mt-4">
            {quest.roleRequired?.length
              ? t('quests_entry_automatic_roles', {
                  roles: quest.roleRequired.join(', '),
                })
              : t('quests_entry_automatic')}
          </p>
        )}

        {isOpen && openSources.length > 0 && (
          <div className="mt-5 flex flex-col gap-2">
            {openSources.slice(0, 3).map(({ source, action }, index) => (
              <Link
                key={source.key}
                href={action?.href || '#'}
                className={`w-full text-center rounded-full px-4 py-3 text-sm font-bold uppercase tracking-wide border-2 ${
                  index === 0
                    ? 'bg-accent border-accent text-accent-foreground hover:bg-accent-dark hover:border-accent-dark'
                    : 'border-accent text-accent hover:bg-accent-light'
                }`}
              >
                {t(action?.labelKey as string, action?.values)}
                <ArrowRight className="w-4 h-4 inline-block ml-1.5 -mt-0.5" />
              </Link>
            ))}
          </div>
        )}

        {!isOpen && (
          <p className="text-sm text-gray-500 flex items-center gap-2 mt-5">
            {isRaffle ? (
              <Ticket className="w-4 h-4" />
            ) : (
              <Trophy className="w-4 h-4" />
            )}
            {t('quests_entry_closed')}
          </p>
        )}
      </div>
    </div>
  );
};

export default QuestEntryPanel;
