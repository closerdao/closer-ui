import Link from 'next/link';

import { useState } from 'react';

import { Pencil, Play, Ticket, Trophy, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';

import type { Quest } from '../../types/quest';
import { cdn } from '../../utils/api';
import { parseMessageFromError } from '../../utils/common';
import { publishQuest } from '../../utils/quests.api';
import {
  getAwardLabel,
  getQuestDateRange,
  getRankedPrizeEntries,
} from '../../utils/quests.helpers';
import { ErrorMessage } from '../ui';
import QuestStatusBadge from './QuestStatusBadge';

interface Props {
  quest: Quest;
  /** Adds the inline edit shortcut for quest admins. */
  isAdmin?: boolean;
  onPublished?: (quest?: Quest | null) => void;
}

const QuestCard = ({ quest, isAdmin, onPublished }: Props) => {
  const t = useTranslations();
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canPublish =
    isAdmin && (quest.status === 'draft' || quest.status === 'scheduled');

  const handlePublish = async () => {
    if (isPublishing) return;
    setIsPublishing(true);
    setError(null);
    try {
      const published = await publishQuest(quest.slug, quest.status);
      onPublished?.(published);
    } catch (err) {
      setError(parseMessageFromError(err));
    } finally {
      setIsPublishing(false);
    }
  };
  const topPrize = getRankedPrizeEntries(quest)[0]?.award;
  const coverImage = quest.visual?.coverImage;
  const imageUrl =
    coverImage && coverImage.startsWith('http')
      ? coverImage
      : coverImage
      ? `${cdn}${coverImage}-place-lg.jpg`
      : null;

  return (
    <div className="relative">
      {isAdmin && (
        <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
          {canPublish && (
            <button
              type="button"
              onClick={handlePublish}
              disabled={isPublishing}
              className="inline-flex items-center gap-1.5 rounded-full border-2 border-accent bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground hover:bg-accent-dark hover:border-accent-dark disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5" />
              {t('quests_admin_publish')}
            </button>
          )}
          <Link
            href={`/quests/${quest.slug}/edit`}
            className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-600 hover:text-accent hover:border-accent"
          >
            <Pencil className="w-3.5 h-3.5" />
            {t('quests_card_edit')}
          </Link>
        </div>
      )}
      <Link href={`/quests/${quest.slug}`} className="block group">
        <div className="bg-white rounded-2xl border border-gray-200 p-4 hover:shadow-md hover:border-gray-300 transition-all duration-200 h-full flex flex-col gap-4 md:flex-row">
          <div className="w-full md:w-32 md:h-32 aspect-[4/3] md:aspect-square shrink-0 overflow-hidden rounded-xl bg-neutral grid place-items-center">
            {imageUrl ? (
              <img
                className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                src={imageUrl}
                alt={quest.title}
              />
            ) : (
              <span className="text-4xl">{quest.visual?.emoji || '🎯'}</span>
            )}
          </div>

          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <QuestStatusBadge status={quest.status} />
              <span className="text-[11px] uppercase tracking-widest text-gray-400">
                {getQuestDateRange(quest)}
              </span>
            </div>

            <h3 className="font-bold text-lg group-hover:text-accent transition-colors">
              {quest.title}
            </h3>

            {(quest.shortDescription || quest.description) && (
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                {quest.shortDescription || quest.description}
              </p>
            )}

            <div className="flex items-center gap-4 mt-2.5 text-sm text-gray-500 flex-wrap">
              {topPrize && (
                <span className="flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 shrink-0" />
                  {getAwardLabel(topPrize, t)}
                </span>
              )}
              {Boolean(quest.stats?.participantCount) && (
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 shrink-0" />
                  {t('quests_card_participants', {
                    count: quest.stats?.participantCount || 0,
                  })}
                </span>
              )}
              {quest.type === 'raffle' &&
                Boolean(quest.stats?.totalTickets) && (
                  <span className="flex items-center gap-1.5">
                    <Ticket className="w-4 h-4 shrink-0" />
                    {t('quests_card_tickets', {
                      count: quest.stats?.totalTickets || 0,
                    })}
                  </span>
                )}
            </div>
          </div>
        </div>
      </Link>
      {error && (
        <div className="mt-2">
          <ErrorMessage error={error} />
        </div>
      )}
    </div>
  );
};

export default QuestCard;
