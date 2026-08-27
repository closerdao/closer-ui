import Link from 'next/link';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { RefreshCw, Ticket, Trophy } from 'lucide-react';
import { useTranslations } from 'next-intl';

import type {
  Quest,
  QuestLeaderboardRow,
  QuestLeaderboard as QuestLeaderboardType,
} from '../../types/quest';
import {
  formatQuestCurrency,
  getLeaderboardRowUser,
  getRowActionCount,
  getRowEarned,
  getTicketBreakdown,
} from '../../utils/quests.helpers';
import ProfilePhoto from '../ProfilePhoto';
import Heading from '../ui/Heading';

dayjs.extend(relativeTime);

interface Props {
  quest: Quest;
  leaderboard: QuestLeaderboardType | null;
  isLoading?: boolean;
  /** When the standings were last pulled; omitted once the quest is closed. */
  lastUpdated?: number | null;
  onRefresh?: () => void;
}

const rankMedals: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

const QuestLeaderboard = ({
  quest,
  leaderboard,
  isLoading,
  lastUpdated,
  onRefresh,
}: Props) => {
  const t = useTranslations();
  const isRaffle = quest.type === 'raffle';
  // A singleAction quest ranks by what the actions actually pay, so the score
  // column shows the earnings whenever the per-action award has a total.
  const showsEarnings =
    !isRaffle && quest.prize?.eachAction?.kind === 'currency';

  const getScore = (row: QuestLeaderboardRow) =>
    isRaffle ? row.ticketCount || 0 : row.points || 0;

  const renderRow = (
    row: QuestLeaderboardRow,
    index: number,
    { isMe }: { isMe?: boolean } = {},
  ) => {
    const rowUser = getLeaderboardRowUser(row);
    const rank = row.rank ?? index + 1;
    const breakdown = isRaffle
      ? getTicketBreakdown(quest, row.ticketsBySource)
      : t('quests_leaderboard_actions', {
          count: getRowActionCount(quest, row),
        });
    const earned = showsEarnings ? getRowEarned(quest, row) : null;
    const isLeader = rank === 1;

    return (
      <div
        key={rowUser._id || `${rank}-${index}`}
        className={`flex items-center gap-3 rounded-2xl py-3 px-4 ${
          isMe
            ? 'border-2 border-accent bg-accent-light'
            : `border ${isLeader ? 'border-accent' : 'border-gray-200'}`
        }`}
      >
        <span
          className={`w-7 text-center font-bold ${
            isLeader || isMe ? 'text-accent' : 'text-gray-500'
          }`}
        >
          {rankMedals[rank] || rank}
        </span>
        <ProfilePhoto user={rowUser} size="10" stack={false} />
        <div className="min-w-0">
          <div className="font-bold truncate">
            {isMe
              ? t('quests_leaderboard_you')
              : rowUser.screenname || t('quests_leaderboard_anonymous')}
          </div>
          {(rowUser.slug || breakdown) && (
            <div className="text-xs text-gray-500 truncate">
              {rowUser.slug && (
                <Link
                  href={`/members/${rowUser.slug}`}
                  className="hover:underline"
                >
                  @{rowUser.slug}
                </Link>
              )}
              {rowUser.slug && breakdown && <span className="mx-1">·</span>}
              {breakdown}
            </div>
          )}
        </div>
        <div className="ml-auto flex items-center gap-2">
          {isRaffle ? (
            <Ticket
              className={`w-4 h-4 ${
                isLeader || isMe ? 'text-accent' : 'text-gray-400'
              }`}
            />
          ) : earned ? null : (
            <Trophy
              className={`w-4 h-4 ${
                isLeader || isMe ? 'text-accent' : 'text-gray-400'
              }`}
            />
          )}
          <span className="text-lg font-semibold tabular-nums whitespace-nowrap">
            {earned
              ? formatQuestCurrency(earned.amount, earned.cur)
              : getScore(row)}
          </span>
        </div>
      </div>
    );
  };

  const top = leaderboard?.top || [];
  const me = leaderboard?.me;
  const showPinnedMe = Boolean(
    me &&
      (me.pinned ||
        !top.some(
          (row) =>
            getLeaderboardRowUser(row)._id === getLeaderboardRowUser(me)._id,
        )),
  );

  return (
    <section className="mb-8">
      <div className="flex items-baseline mb-3">
        <Heading level={3}>{t('quests_leaderboard_title')}</Heading>
        <span className="ml-auto text-[11px] font-bold uppercase tracking-widest text-gray-500">
          {isRaffle
            ? t('quests_leaderboard_tickets')
            : showsEarnings
            ? t('quests_leaderboard_earned')
            : t('quests_leaderboard_points')}
        </span>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            title={t('quests_leaderboard_refresh')}
            className="ml-3 text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`}
            />
          </button>
        )}
      </div>

      {isLoading && !top.length ? (
        <p className="text-gray-500">{t('quests_leaderboard_loading')}</p>
      ) : top.length ? (
        <div className="flex flex-col gap-2">
          {top.map((row, index) => renderRow(row, index))}

          {showPinnedMe && me && (
            <>
              <div className="text-center text-gray-300 tracking-[0.5em] py-1">
                ···
              </div>
              {renderRow(me, top.length, { isMe: true })}
            </>
          )}
        </div>
      ) : (
        <p className="text-gray-500 italic">{t('quests_leaderboard_empty')}</p>
      )}

      {Boolean(lastUpdated) && (
        <p className="text-xs text-gray-400 mt-3 text-center">
          {t('quests_leaderboard_updated', {
            when: dayjs(lastUpdated).fromNow(),
          })}
        </p>
      )}

      {Boolean(leaderboard?.totalParticipants) && (
        <p className="text-center text-sm text-gray-500 mt-4">
          {isRaffle
            ? t('quests_leaderboard_summary_raffle', {
                participants: leaderboard?.totalParticipants || 0,
                tickets: leaderboard?.totalTickets || 0,
              })
            : t('quests_leaderboard_summary_action', {
                participants: leaderboard?.totalParticipants || 0,
              })}
        </p>
      )}
    </section>
  );
};

export default QuestLeaderboard;
