import dayjs from 'dayjs';
import { useTranslations } from 'next-intl';

import type { Quest } from '../../types/quest';
import {
  getTicketSources,
  isQuestActionCounted,
} from '../../utils/quests.helpers';

interface Props {
  quest: Quest;
}

const QuestHowItWorks = ({ quest }: Props) => {
  const t = useTranslations();
  const closesAt = dayjs(quest.end);

  const steps: string[] = [];

  if (quest.type === 'raffle') {
    getTicketSources(quest).forEach((source) => {
      steps.push(
        t('quests_how_ticket_source', {
          label: source.label,
          tickets: source.ticketsPerUnit,
          max: source.maxTickets,
        }),
      );
    });
    if (quest.raffleConfig?.maxTicketsPerUser) {
      steps.push(
        t('quests_how_max_tickets', {
          count: quest.raffleConfig.maxTicketsPerUser,
        }),
      );
    }
    steps.push(
      t('quests_how_winners', { count: quest.raffleConfig?.winnerCount || 1 }),
    );
    steps.push(t('quests_how_verifiable'));
  } else if (quest.actionConfig) {
    steps.push(
      t('quests_how_action', { label: quest.actionConfig.actionLabel }),
    );
    if (quest.actionConfig.maxActionsPerUser) {
      steps.push(
        t('quests_how_max_actions', {
          count: quest.actionConfig.maxActionsPerUser,
        }),
      );
    }
    if (isQuestActionCounted(quest)) {
      steps.push(t('quests_how_counted'));
    } else if (quest.actionConfig.requiresApproval) {
      steps.push(t('quests_how_approval'));
    }
  }

  if (quest.roleRequired?.length) {
    steps.push(t('quests_how_roles', { roles: quest.roleRequired.join(', ') }));
  }

  if (closesAt.isValid()) {
    steps.push(
      t('quests_how_closes', {
        date: closesAt.format('MMM D, HH:mm'),
      }),
    );
  }

  if (!steps.length) return null;

  return (
    <div className="rounded-3xl border border-gray-200 p-6">
      <div className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-3">
        {t('quests_how_title')}
      </div>
      {steps.map((step, index) => (
        <div
          key={step}
          className={`flex gap-3 py-2.5 ${
            index ? 'border-t border-gray-200' : ''
          }`}
        >
          <span className="text-xs font-semibold text-accent pt-0.5 tabular-nums">
            {String(index + 1).padStart(2, '0')}
          </span>
          <span className="text-sm text-gray-600 leading-relaxed">{step}</span>
        </div>
      ))}
    </div>
  );
};

export default QuestHowItWorks;
