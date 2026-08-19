import React from 'react';

import { useTranslations } from 'next-intl';

import type { Quest } from '../../types/quest';
import {
  getAwardDescription,
  getAwardLabel,
  getRankedPrizeEntries,
} from '../../utils/quests.helpers';

interface Props {
  quest: Quest;
}

const rankMedals: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

const PrizeCard = ({
  eyebrow,
  title,
  description,
  isHighlighted,
}: {
  eyebrow: string;
  title: string;
  description?: string | null;
  isHighlighted?: boolean;
}) => (
  <div
    className={`rounded-2xl p-5 ${
      isHighlighted
        ? 'border-2 border-accent bg-accent-light'
        : 'border border-gray-200'
    }`}
  >
    <div
      className={`text-[11px] font-bold uppercase tracking-widest ${
        isHighlighted ? 'text-accent' : 'text-gray-500'
      }`}
    >
      {eyebrow}
    </div>
    <div className="font-bold text-xl mt-1.5 leading-tight">{title}</div>
    {description && (
      <div className="text-sm text-gray-500 mt-1">{description}</div>
    )}
  </div>
);

const QuestPrizes = ({ quest }: Props) => {
  const t = useTranslations();
  const ranked = getRankedPrizeEntries(quest);
  const { eachAction, participation, notes } = quest.prize || {};

  if (!ranked.length && !eachAction && !participation) return null;

  // Prizes share the row rather than sitting in fixed thirds, so a single
  // winner card is not left stranded next to empty space.
  const cardCount =
    ranked.length + (eachAction ? 1 : 0) + (participation ? 1 : 0);
  const columns = Math.min(cardCount, 3);

  return (
    <section className="mb-8">
      <div
        className="grid gap-3 grid-cols-1 sm:grid-cols-[repeat(var(--quest-prize-cols),minmax(0,1fr))]"
        style={{ '--quest-prize-cols': columns } as React.CSSProperties}
      >
        {ranked.map(({ rank, award }) => (
          <PrizeCard
            key={rank}
            isHighlighted={rank === 1}
            eyebrow={`${rankMedals[rank] || '🏅'} ${
              rank === 1
                ? t('quests_prize_winner')
                : t('quests_prize_rank', { rank })
            }`}
            title={getAwardLabel(award, t)}
            description={getAwardDescription(award)}
          />
        ))}
        {eachAction && (
          <PrizeCard
            eyebrow={`🎟 ${t('quests_prize_each_action')}`}
            title={getAwardLabel(eachAction, t)}
            description={t('quests_prize_each_action_hint')}
          />
        )}
        {participation && (
          <PrizeCard
            eyebrow={`👥 ${t('quests_prize_participation')}`}
            title={getAwardLabel(participation, t)}
            description={t('quests_prize_participation_hint')}
          />
        )}
      </div>
      {notes && <p className="text-sm text-gray-500 mt-3">{notes}</p>}
    </section>
  );
};

export default QuestPrizes;
