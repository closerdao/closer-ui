import Link from 'next/link';

import { useEffect, useState } from 'react';

import { useTranslations } from 'next-intl';

import type { Quest } from '../../types/quest';
import { getQuestUsers } from '../../utils/quests.api';
import { getAwardLabel } from '../../utils/quests.helpers';
import ProfilePhoto from '../ProfilePhoto';
import Heading from '../ui/Heading';

type ResolvedUser = {
  _id: string;
  screenname?: string;
  slug?: string;
  photo?: string;
};

interface Props {
  quest: Quest;
  /** Resolved server-side so a winner has a name before JS runs. */
  initialUsers?: ResolvedUser[];
}

const rankMedals: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

const QuestWinners = ({ quest, initialUsers }: Props) => {
  const t = useTranslations();
  const winners = quest.results?.winners || [];
  const { ticketsHash, drawSeed } = quest.results || {};

  /** The draw records ids; nobody wants to be congratulated as an ObjectId. */
  const [usersById, setUsersById] = useState<Record<string, ResolvedUser>>(() =>
    Object.fromEntries((initialUsers || []).map((user) => [user._id, user])),
  );
  const unresolvedIds = winners
    .filter((winner) => !winner.screenname && winner.userId)
    .map((winner) => winner.userId);
  const missingIds = unresolvedIds.filter((id) => !usersById[id]).join(',');

  useEffect(() => {
    if (!missingIds) return;
    let cancelled = false;
    getQuestUsers(missingIds.split(','))
      .then((users) => {
        if (cancelled || !users.length) return;
        setUsersById((current) => ({
          ...current,
          ...Object.fromEntries(users.map((user) => [user._id, user])),
        }));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [missingIds]);

  if (!winners.length && !ticketsHash) return null;

  return (
    <section className="mb-8">
      <Heading level={3} className="mb-3">
        {t('quests_winners_title')}
      </Heading>

      {winners.length ? (
        <div className="flex flex-col gap-2">
          {winners.map((winner) => {
            const resolved = usersById[winner.userId];
            const screenname = winner.screenname || resolved?.screenname;
            const slug = winner.slug || resolved?.slug;
            const photo = winner.photo || resolved?.photo;
            return (
              <div
                key={`${winner.rank}-${winner.userId}`}
                className="flex items-center gap-3 rounded-2xl border border-accent bg-accent-light py-3 px-4"
              >
                <span className="w-7 text-center font-bold text-accent">
                  {rankMedals[winner.rank] || winner.rank}
                </span>
                <ProfilePhoto
                  user={{ screenname, photo }}
                  size="10"
                  stack={false}
                />
                <div className="min-w-0">
                  <div className="font-bold truncate">
                    {screenname || t('quests_winners_unnamed')}
                  </div>
                  {winner.award && (
                    <div className="text-xs text-gray-600 truncate">
                      {getAwardLabel(winner.award, t)}
                    </div>
                  )}
                </div>
                {slug && (
                  <Link
                    href={`/members/${slug}`}
                    className="ml-auto text-sm underline shrink-0"
                  >
                    {t('quests_winners_profile')}
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-gray-500">{t('quests_winners_pending')}</p>
      )}

      {/* Fine print: the proof, for the handful of people who want to check it. */}
      {ticketsHash && (
        <details className="mt-4 rounded-2xl bg-neutral-light border border-gray-200 px-4 py-3 text-xs text-gray-500">
          <summary className="cursor-pointer font-semibold text-gray-600">
            {t('quests_winners_fine_print')}
          </summary>
          <p className="mt-2">{t('quests_winners_verify')}</p>
          <dl className="mt-2 space-y-1">
            <div>
              <dt className="inline font-semibold">
                {t('quests_winners_hash')}{' '}
              </dt>
              <dd className="inline break-all font-mono">{ticketsHash}</dd>
            </div>
            {drawSeed && (
              <div>
                <dt className="inline font-semibold">
                  {t('quests_winners_seed')}{' '}
                </dt>
                <dd className="inline break-all font-mono">{drawSeed}</dd>
              </div>
            )}
          </dl>
          <Link
            href={`/quests/${quest.slug}/audit`}
            className="inline-block underline mt-2 text-gray-600 hover:text-gray-800"
          >
            {t('quests_audit_link')}
          </Link>
        </details>
      )}
    </section>
  );
};

export default QuestWinners;
