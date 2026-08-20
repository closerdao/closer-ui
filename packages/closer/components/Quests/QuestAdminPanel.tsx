import { useCallback, useEffect, useState } from 'react';

import { Check, Lock, Play, Sparkles, Wallet, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

import type { Quest, QuestAction } from '../../types/quest';
import { parseMessageFromError } from '../../utils/common';
import {
  drawQuest,
  getQuestActions,
  lockQuest,
  publishQuest,
  settleQuest,
  verifyQuestAction,
} from '../../utils/quests.api';
import { getQuestPhase } from '../../utils/quests.helpers';
import { Button, ErrorMessage } from '../ui';
import Heading from '../ui/Heading';

interface Props {
  quest: Quest;
  onChanged: () => void;
}

/**
 * The lifecycle a quest admin drives by hand: reviewing submissions members
 * made against admin-verified sources, then locking, drawing and settling.
 * lock/draw/settle are separate routes precisely so the ticket set and the
 * payout ledger get written — they are refused on a plain PATCH.
 */
const QuestAdminPanel = ({ quest, onChanged }: Props) => {
  const t = useTranslations();
  const [pendingActions, setPendingActions] = useState<QuestAction[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [seed, setSeed] = useState('');

  const isDraft = quest.status === 'draft' || quest.status === 'scheduled';
  const isLive = quest.status === 'live';
  const isLocked = quest.status === 'locked';
  const isSettled = quest.status === 'settled';
  const hasEnded = getQuestPhase(quest) === 'closed';
  const hasDrawn = Boolean(quest.results?.winners?.length);
  const needsSeed = quest.raffleConfig?.drawMethod === 'externalSeed';

  const loadPendingActions = useCallback(async () => {
    if (!quest._id) return;
    try {
      const actions = await getQuestActions(quest._id, { status: 'pending' });
      setPendingActions(actions);
    } catch {
      setPendingActions([]);
    }
  }, [quest._id]);

  useEffect(() => {
    loadPendingActions();
  }, [loadPendingActions]);

  const run = async (id: string, work: () => Promise<unknown>) => {
    if (busyId) return;
    setError(null);
    setBusyId(id);
    try {
      await work();
      await loadPendingActions();
      onChanged();
    } catch (err) {
      setError(parseMessageFromError(err));
    } finally {
      setBusyId(null);
    }
  };

  const decide = (action: QuestAction, decision: 'verified' | 'rejected') =>
    run(action._id, () =>
      verifyQuestAction(quest.slug, action._id, { decision }),
    );

  const handlePublish = () =>
    run('publish', () => publishQuest(quest.slug, quest.status));

  const handleLock = () =>
    run('lock', () =>
      // The route refuses an early lock unless we say we mean it.
      lockQuest(quest.slug, hasEnded ? {} : { force: true }),
    );

  const handleDraw = () =>
    run('draw', () => {
      const trimmedSeed = seed.trim();
      return drawQuest(quest.slug, trimmedSeed ? { seed: trimmedSeed } : {});
    });
  const handleSettle = () => run('settle', () => settleQuest(quest.slug));

  return (
    <section className="rounded-3xl border border-gray-200 p-6 mb-8">
      <Heading level={3} className="mb-1">
        {t('quests_admin_title')}
      </Heading>
      <p className="text-sm text-gray-500 mb-4">{t('quests_admin_intro')}</p>

      {error && <ErrorMessage error={error} />}

      <div className="mb-6">
        <div className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-2">
          {t('quests_admin_pending', { count: pendingActions.length })}
        </div>
        {pendingActions.length ? (
          <ul className="flex flex-col gap-2">
            {pendingActions.map((action) => (
              <li
                key={action._id}
                className="flex items-center gap-3 rounded-xl border border-gray-200 px-3 py-2 text-sm"
              >
                <span className="min-w-0 flex-1 truncate">
                  {action.proof?.value || action.sourceKey || action._id}
                </span>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-success hover:underline disabled:opacity-50"
                  disabled={busyId === action._id}
                  onClick={() => decide(action, 'verified')}
                >
                  <Check className="w-4 h-4" />
                  {t('quests_admin_verify')}
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-failure hover:underline disabled:opacity-50"
                  disabled={busyId === action._id}
                  onClick={() => decide(action, 'rejected')}
                >
                  <X className="w-4 h-4" />
                  {t('quests_admin_reject')}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500 italic">
            {t('quests_admin_pending_none')}
          </p>
        )}
      </div>

      <div className="border-t border-gray-200 pt-4 flex flex-col gap-3">
        {isDraft && (
          <div>
            <Button
              onClick={handlePublish}
              isLoading={busyId === 'publish'}
              isEnabled={!busyId}
              isFullWidth={false}
            >
              <Play className="w-4 h-4 mr-2" />
              {t('quests_admin_publish')}
            </Button>
            <p className="text-xs text-gray-500 mt-1">
              {t('quests_admin_publish_hint')}
            </p>
          </div>
        )}

        {isLive && !isLocked && !isSettled && (
          <div>
            <Button
              onClick={handleLock}
              isLoading={busyId === 'lock'}
              isEnabled={!busyId}
              isFullWidth={false}
              variant="secondary"
            >
              <Lock className="w-4 h-4 mr-2" />
              {t('quests_admin_lock')}
            </Button>
            <p className="text-xs text-gray-500 mt-1">
              {hasEnded
                ? t('quests_admin_lock_hint')
                : t('quests_admin_lock_early_hint')}
            </p>
          </div>
        )}

        {isLocked && !hasDrawn && (
          <div>
            {needsSeed && (
              <input
                className="new-input w-full !px-3 !py-2.5 !rounded-lg !border !border-solid !border-gray-200 bg-white mb-2"
                value={seed}
                placeholder={t('quests_admin_seed_placeholder')}
                onChange={(event) => setSeed(event.target.value)}
              />
            )}
            <Button
              onClick={handleDraw}
              isLoading={busyId === 'draw'}
              isEnabled={!busyId && (!needsSeed || seed.trim().length > 0)}
              isFullWidth={false}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {t('quests_admin_draw')}
            </Button>
            <p className="text-xs text-gray-500 mt-1">
              {t('quests_admin_draw_hint')}
            </p>
          </div>
        )}

        {hasDrawn && !isSettled && (
          <div>
            <Button
              onClick={handleSettle}
              isLoading={busyId === 'settle'}
              isEnabled={!busyId}
              isFullWidth={false}
            >
              <Wallet className="w-4 h-4 mr-2" />
              {t('quests_admin_settle')}
            </Button>
            <p className="text-xs text-gray-500 mt-1">
              {t('quests_admin_settle_hint')}
            </p>
          </div>
        )}

        {isSettled && (
          <p className="text-sm text-success">{t('quests_admin_settled')}</p>
        )}
      </div>
    </section>
  );
};

export default QuestAdminPanel;
