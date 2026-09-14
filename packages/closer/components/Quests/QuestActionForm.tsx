import { FormEvent, useMemo, useState } from 'react';

import { useTranslations } from 'next-intl';

import { FIELD_SELECT_CLASS } from '../../constants/formStyles';
import type { Quest, QuestAction, QuestMe } from '../../types/quest';
import { parseMessageFromError } from '../../utils/common';
import { submitQuestAction } from '../../utils/quests.api';
import {
  getTicketSources,
  isQuestActionCounted,
} from '../../utils/quests.helpers';
import { Button, ErrorMessage, Input, Textarea } from '../ui';

interface Props {
  quest: Quest;
  me: QuestMe | null;
  myActions: QuestAction[];
  onSubmitted: () => void;
}

const QuestActionForm = ({ quest, me, myActions, onSubmitted }: Props) => {
  const t = useTranslations();
  const isRaffle = quest.type === 'raffle';

  /** Automatic sources are aggregated backend-side, never submitted by hand. */
  const manualSources = useMemo(
    () =>
      getTicketSources(quest).filter(
        (source) => source.verification !== 'automatic',
      ),
    [quest],
  );

  const [sourceKey, setSourceKey] = useState(manualSources[0]?.key || '');
  const [proofValue, setProofValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  if (isRaffle && !manualSources.length) return null;
  if (!isRaffle && !quest.actionConfig) return null;
  // A counted quest is tallied backend-side, so there is nothing to submit.
  if (isQuestActionCounted(quest)) return null;

  const proofType = isRaffle ? 'url' : quest.actionConfig?.proofType || 'text';
  const needsProof = proofType !== 'automatic';
  const maxActions = quest.actionConfig?.maxActionsPerUser;
  const usedActions = isRaffle
    ? 0
    : myActions.filter((action) => action.status !== 'rejected').length ||
      me?.entry?.actionCount ||
      0;
  const hasReachedMax = Boolean(maxActions && usedActions >= maxActions);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (isSaving || hasReachedMax) return;
    setError(null);
    setIsSaving(true);
    try {
      await submitQuestAction(quest.slug, {
        ...(isRaffle && sourceKey ? { sourceKey } : {}),
        ...(needsProof
          ? { proof: { type: proofType, value: proofValue.trim() } }
          : {}),
      });
      setProofValue('');
      setHasSubmitted(true);
      onSubmitted();
    } catch (err) {
      setError(parseMessageFromError(err));
    } finally {
      setIsSaving(false);
    }
  };

  const isValid = !needsProof || proofValue.trim().length > 0;

  return (
    <section className="rounded-3xl border border-gray-200 p-6 mb-8">
      <div className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-3">
        {isRaffle
          ? t('quests_action_submit_ticket')
          : quest.actionConfig?.actionLabel || t('quests_action_submit')}
      </div>

      {maxActions ? (
        <p className="text-sm text-gray-500 mb-3">
          {t('quests_action_used', { used: usedActions, max: maxActions })}
        </p>
      ) : null}

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {isRaffle && manualSources.length > 1 && (
          <label className="flex flex-col gap-1 text-sm">
            {t('quests_action_source')}
            <select
              className={FIELD_SELECT_CLASS}
              value={sourceKey}
              onChange={(event) => setSourceKey(event.target.value)}
            >
              {manualSources.map((source) => (
                <option key={source.key} value={source.key}>
                  {source.label}
                </option>
              ))}
            </select>
          </label>
        )}

        {needsProof &&
          (proofType === 'text' ? (
            <Textarea
              value={proofValue}
              onChange={(event) => setProofValue(event.target.value)}
              placeholder={
                quest.actionConfig?.proofPrompt || t('quests_action_proof')
              }
            />
          ) : (
            <Input
              value={proofValue}
              onChange={(event) => setProofValue(event.target.value)}
              placeholder={
                quest.actionConfig?.proofPrompt || t('quests_action_proof')
              }
              validation={proofType === 'url' ? 'url' : undefined}
            />
          ))}

        <Button
          type="submit"
          isLoading={isSaving}
          isEnabled={isValid && !isSaving && !hasReachedMax}
        >
          {hasReachedMax
            ? t('quests_action_max_reached')
            : t('quests_action_submit')}
        </Button>
      </form>

      {error && <ErrorMessage error={error} />}

      {hasSubmitted && !error && (
        <p className="text-sm text-success mt-3">
          {quest.actionConfig?.requiresApproval === false
            ? t('quests_action_submitted')
            : t('quests_action_submitted_pending')}
        </p>
      )}

      {myActions.length > 0 && (
        <div className="mt-5 border-t border-gray-200 pt-4">
          <div className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-2">
            {t('quests_action_history')}
          </div>
          <ul className="flex flex-col gap-2">
            {myActions.map((action) => (
              <li
                key={action._id}
                className="flex items-center gap-3 text-sm text-gray-600"
              >
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-bold uppercase ${
                    action.status === 'verified'
                      ? 'bg-green-50 text-success'
                      : action.status === 'rejected' ||
                        action.status === 'reversed'
                      ? 'bg-red-50 text-failure'
                      : 'bg-amber-50 text-pending'
                  }`}
                >
                  {action.status}
                </span>
                <span className="truncate">
                  {action.proof?.value || action.sourceKey || ''}
                </span>
                <span className="ml-auto tabular-nums shrink-0">
                  {isRaffle ? action.tickets || 0 : action.points || 0}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
};

export default QuestActionForm;
