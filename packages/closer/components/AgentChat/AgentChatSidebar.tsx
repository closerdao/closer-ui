import dayjs from 'dayjs';

import { MessageSquare, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

import type { AgentChatConversation } from '../../types/agentChat';

type Props = {
  conversations: AgentChatConversation[];
  activeRoom: string | null;
  isDraftNew: boolean;
  onSelect: (room: string) => void;
  onNewChat: () => void;
};

const AgentChatSidebar = ({
  conversations,
  activeRoom,
  isDraftNew,
  onSelect,
  onNewChat,
}: Props) => {
  const t = useTranslations();

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-line/10 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <MessageSquare className="h-4 w-4 shrink-0 text-accent" />
          <h1 className="truncate text-[15px] font-semibold text-foreground">
            {t('agent_chat_heading')}
          </h1>
        </div>
        <button
          type="button"
          onClick={onNewChat}
          className="flex min-h-[36px] min-w-[36px] shrink-0 items-center justify-center rounded-lg text-accent transition-colors hover:bg-neutral-light"
          title={t('agent_chat_new_conversation')}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2">
        {isDraftNew ? (
          <button
            type="button"
            className="mb-1 w-full rounded-lg bg-neutral-light/80 px-3 py-2.5 text-left text-sm font-medium text-foreground"
          >
            {t('agent_chat_new_conversation')}
          </button>
        ) : null}

        {conversations.length === 0 && !isDraftNew ? (
          <p className="px-2 py-6 text-center text-xs text-gray-500">
            {t('agent_chat_no_history')}
          </p>
        ) : null}

        <ul className="flex flex-col gap-0.5">
          {conversations.map((conversation) => {
            const isActive =
              !isDraftNew && activeRoom === conversation.room;
            return (
              <li key={conversation.room}>
                <button
                  type="button"
                  onClick={() => onSelect(conversation.room)}
                  className={`w-full rounded-lg px-3 py-2.5 text-left transition-colors ${
                    isActive
                      ? 'bg-neutral-light text-foreground'
                      : 'text-gray-700 hover:bg-neutral-light/60'
                  }`}
                >
                  <p className="truncate text-sm font-medium">
                    {conversation.title || t('agent_chat_untitled')}
                  </p>
                  {conversation.updatedAt ? (
                    <p className="mt-0.5 text-[11px] text-gray-500">
                      {dayjs(conversation.updatedAt).format('MMM D, HH:mm')}
                    </p>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default AgentChatSidebar;
