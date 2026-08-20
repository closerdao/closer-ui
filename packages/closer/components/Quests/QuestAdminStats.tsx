import { useMemo } from 'react';

import { useTranslations } from 'next-intl';

import type { Quest, QuestAward } from '../../types/quest';
import { formatQuestCurrency, getQuestPhase } from '../../utils/quests.helpers';

interface Props {
  quests: Quest[];
}

/** Best case a single quest can pay out in one currency, ignoring perks/credits. */
const awardValue = (award: QuestAward | undefined, cur: string): number =>
  award && award.kind === 'currency' && award.cur === cur ? award.val : 0;

const questPayout = (quest: Quest, cur: string): number => {
  const { ranked, eachAction, participation } = quest.prize || {};
  const rankedTotal = Object.values(ranked || {}).reduce(
    (total, award) => total + awardValue(award, cur),
    0,
  );
  const participants = quest.stats?.participantCount || 0;
  const scoringEvents =
    quest.type === 'raffle'
      ? quest.stats?.totalTickets || 0
      : quest.stats?.totalActions || 0;
  return (
    rankedTotal +
    awardValue(eachAction, cur) * scoringEvents +
    awardValue(participation, cur) * participants
  );
};

const QuestAdminStats = ({ quests }: Props) => {
  const t = useTranslations();

  const stats = useMemo(() => {
    const live = quests.filter(
      (quest) => quest.status === 'live' && getQuestPhase(quest) === 'open',
    );
    const scheduled = quests.filter((quest) => quest.status === 'scheduled');
    const drafts = quests.filter((quest) => quest.status === 'draft');
    const pendingSettlement = quests.filter(
      (quest) => quest.status === 'locked',
    );
    const participants = live.reduce(
      (total, quest) => total + (quest.stats?.participantCount || 0),
      0,
    );
    const tickets = live.reduce(
      (total, quest) => total + (quest.stats?.totalTickets || 0),
      0,
    );
    const actions = live.reduce(
      (total, quest) => total + (quest.stats?.totalActions || 0),
      0,
    );
    const unsettled = quests.filter((quest) => quest.status !== 'settled');
    const carrots = unsettled.reduce(
      (total, quest) => total + questPayout(quest, 'carrots'),
      0,
    );

    return {
      live: live.length,
      scheduled: scheduled.length,
      drafts: drafts.length,
      pendingSettlement: pendingSettlement.length,
      participants,
      tickets,
      actions,
      carrots,
    };
  }, [quests]);

  const cards = [
    {
      key: 'live',
      label: t('quests_stats_live'),
      value: stats.live,
      sub: t('quests_stats_live_sub', {
        scheduled: stats.scheduled,
        drafts: stats.drafts,
      }),
    },
    {
      key: 'participants',
      label: t('quests_stats_participants'),
      value: stats.participants,
      sub: t('quests_stats_participants_sub'),
    },
    {
      key: 'scoring',
      label: t('quests_stats_scoring'),
      value: stats.tickets + stats.actions,
      sub: t('quests_stats_scoring_sub', {
        tickets: stats.tickets,
        actions: stats.actions,
      }),
    },
    {
      key: 'carrots',
      label: t('quests_stats_payout'),
      value: formatQuestCurrency(stats.carrots, 'carrots'),
      sub: stats.pendingSettlement
        ? t('quests_stats_pending_settlement', {
            count: stats.pendingSettlement,
          })
        : t('quests_stats_payout_sub'),
    },
  ];

  return (
    <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
      {cards.map((card) => (
        <div
          key={card.key}
          className="rounded-2xl border border-gray-200 bg-neutral-light px-4 py-3"
        >
          <div className="text-xs font-semibold text-gray-600">
            {card.label}
          </div>
          <div className="text-2xl font-semibold tabular-nums mt-1">
            {card.value}
          </div>
          <div className="text-xs text-gray-500">{card.sub}</div>
        </div>
      ))}
    </section>
  );
};

export default QuestAdminStats;
