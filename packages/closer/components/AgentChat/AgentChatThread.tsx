import {
  FormEvent,
  KeyboardEvent,
  RefObject,
} from 'react';

import { Send } from 'lucide-react';
import { useTranslations } from 'next-intl';
import ReactMarkdown from 'react-markdown';

import { proposalMarkdownComponents } from '../display/proposalMarkdown';
import { Button } from '../ui';
import Spinner from '../ui/Spinner';

import type { ChatTurn } from '../../types/agentChat';
import AgentChatKnowledge from './AgentChatKnowledge';
import AgentChatMessageMetaDisplay from './AgentChatMessageMetaDisplay';

type Props = {
  turns: ChatTurn[];
  sending: boolean;
  error: string | null;
  input: string;
  onInputChange: (value: string) => void;
  onSend: (event?: FormEvent) => void;
  messagesEndRef: RefObject<HTMLDivElement>;
  textareaRef: RefObject<HTMLTextAreaElement>;
};

const AgentChatThread = ({
  turns,
  sending,
  error,
  input,
  onInputChange,
  onSend,
  messagesEndRef,
  textareaRef,
}: Props) => {
  const t = useTranslations();

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      onSend();
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-6 sm:px-8">
        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4">
          {turns.length === 0 && !sending ? (
            <p className="m-auto max-w-sm text-center text-sm text-gray-500">
              {t('agent_chat_empty_state')}
            </p>
          ) : null}

          {turns.map((turn) => (
            <div
              key={turn.id}
              className={`flex ${turn.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[90%] rounded-2xl px-4 py-2.5 text-sm sm:max-w-[85%] ${
                  turn.role === 'user'
                    ? 'bg-accent text-white'
                    : 'border border-line/10 bg-white text-gray-900 shadow-sm'
                }`}
              >
                {turn.role === 'assistant' ? (
                  <div className="markdown min-w-0 max-w-full break-words text-[13px]">
                    <ReactMarkdown components={proposalMarkdownComponents}>
                      {turn.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap break-words">
                    {turn.content}
                  </p>
                )}
                {turn.role === 'assistant' ? (
                  <AgentChatMessageMetaDisplay meta={turn.meta} />
                ) : null}
                {turn.role === 'assistant' && turn.knowledge?.length ? (
                  <AgentChatKnowledge knowledge={turn.knowledge} />
                ) : null}
              </div>
            </div>
          ))}

          {sending ? (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-2xl border border-line/10 bg-white px-4 py-3 text-sm text-gray-600 shadow-sm">
                <Spinner />
                {t('agent_chat_typing')}
              </div>
            </div>
          ) : null}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <form
        onSubmit={onSend}
        className="shrink-0 border-t border-line/10 bg-white/95 px-4 py-4 backdrop-blur sm:px-8"
      >
        <div className="mx-auto w-full max-w-3xl">
          {error ? (
            <p className="mb-2 text-sm text-red-600" role="alert">
              {error}
            </p>
          ) : null}
          <div className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('agent_chat_placeholder')}
              rows={2}
              disabled={sending}
              className="min-h-[48px] flex-1 resize-none rounded-xl border border-line/20 bg-white px-4 py-3 text-sm outline-none focus:border-accent disabled:bg-gray-50"
            />
            <Button
              type="submit"
              isEnabled={Boolean(input.trim()) && !sending}
              isLoading={sending}
              isFullWidth={false}
              variant="inline"
              className="!min-h-[48px] shrink-0"
            >
              <Send className="h-4 w-4" />
              <span className="sr-only">{t('agent_chat_send')}</span>
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AgentChatThread;
