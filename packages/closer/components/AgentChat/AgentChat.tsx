import { useRouter } from 'next/router';

import {
  FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import { ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { useTranslations } from 'next-intl';

import { useAuth } from '../../contexts/auth';
import type {
  AgentChatConversation,
  AgentChatResponse,
  ChatTurn,
} from '../../types/agentChat';
import {
  createAgentRoomId,
  messageToTurn,
  sendAgentMessage,
  setStoredAgentChatRoom,
} from '../../utils/agentChat.helpers';
import {
  loadAgentChatStore,
  setActiveRoom,
  upsertAgentChatConversation,
} from '../../utils/agentChat.storage';
import { parseMessageFromError } from '../../utils/common';
import AgentChatSidebar from './AgentChatSidebar';
import AgentChatThread from './AgentChatThread';

const AgentChat = () => {
  const t = useTranslations();
  const router = useRouter();
  const { user } = useAuth();
  const userId = user?._id ?? '';

  const [conversations, setConversations] = useState<AgentChatConversation[]>(
    [],
  );
  const [room, setRoom] = useState<string | null>(null);
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDraftNew, setIsDraftNew] = useState(true);
  const [mobileShowThread, setMobileShowThread] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!userId) return;
    const store = loadAgentChatStore(userId);
    setConversations(store.conversations);

    const active = store.activeRoom;
    const activeConversation = active
      ? store.conversations.find((c) => c.room === active)
      : null;

    const isMobile =
      typeof window !== 'undefined' &&
      window.matchMedia('(max-width: 1023px)').matches;

    if (activeConversation) {
      setRoom(activeConversation.room);
      setTurns(activeConversation.turns);
      setIsDraftNew(false);
      setMobileShowThread(!isMobile);
    } else if (store.conversations[0]) {
      setRoom(store.conversations[0].room);
      setTurns(store.conversations[0].turns);
      setIsDraftNew(false);
      setActiveRoom(userId, store.conversations[0].room);
      setMobileShowThread(!isMobile);
    } else {
      setRoom(null);
      setTurns([]);
      setIsDraftNew(true);
      setMobileShowThread(false);
    }
    setHydrated(true);
  }, [userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [turns, sending, room]);

  const persistTurns = useCallback(
    (roomId: string, nextTurns: ChatTurn[]) => {
      if (!userId) return;
      const store = upsertAgentChatConversation(userId, roomId, nextTurns);
      setConversations(store.conversations);
      setStoredAgentChatRoom(userId, roomId);
    },
    [userId],
  );

  const selectConversation = useCallback(
    (roomId: string) => {
      if (!userId) return;
      const store = loadAgentChatStore(userId);
      const conversation = store.conversations.find((c) => c.room === roomId);
      if (!conversation) return;
      setConversations(store.conversations);
      setRoom(roomId);
      setTurns(conversation.turns);
      setIsDraftNew(false);
      setError(null);
      setInput('');
      setMobileShowThread(true);
      setActiveRoom(userId, roomId);
      textareaRef.current?.focus();
    },
    [userId],
  );

  const handleNewConversation = useCallback(() => {
    setRoom(null);
    setTurns([]);
    setIsDraftNew(true);
    setError(null);
    setInput('');
    setMobileShowThread(true);
    if (userId) {
      setActiveRoom(userId, null);
    }
    textareaRef.current?.focus();
  }, [userId]);

  const resolveRoomForSend = useCallback((): string | undefined => {
    if (room) return room;
    if (isDraftNew && userId) {
      const newRoom = createAgentRoomId(userId);
      setRoom(newRoom);
      setIsDraftNew(false);
      setStoredAgentChatRoom(userId, newRoom);
      return newRoom;
    }
    return undefined;
  }, [room, isDraftNew, userId]);

  const appendResponse = useCallback(
    (response: AgentChatResponse) => {
      setRoom(response.room);
      setIsDraftNew(false);
      setTurns((prev) => {
        const nextTurns: ChatTurn[] = [
          ...prev,
          messageToTurn(response.message, 'user'),
          {
            ...messageToTurn(response.assistantMessage, 'assistant'),
            knowledge: response.knowledge,
            classification: response.classification,
          },
        ];
        persistTurns(response.room, nextTurns);
        return nextTurns;
      });
    },
    [persistTurns],
  );

  const handleSend = async (event?: FormEvent) => {
    event?.preventDefault();
    const content = input.trim();
    if (!content || sending) return;

    setError(null);
    setSending(true);
    const draftContent = content;
    setInput('');

    try {
      const roomToSend = resolveRoomForSend();
      const response = await sendAgentMessage(draftContent, roomToSend);
      appendResponse(response);
    } catch (err) {
      setInput(draftContent);
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        if (status === 401) {
          router.push(`/login?back=${encodeURIComponent(router.asPath)}`);
          return;
        }
        if (status === 403) {
          setRoom(null);
          setIsDraftNew(true);
          if (userId) {
            setActiveRoom(userId, null);
          }
          setError(t('agent_chat_invalid_room'));
          return;
        }
      }
      setError(parseMessageFromError(err));
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  };

  const activeTitle =
    conversations.find((c) => c.room === room)?.title ||
    (isDraftNew ? t('agent_chat_new_conversation') : t('agent_chat_untitled'));

  if (!hydrated) {
    return (
      <div className="flex h-[calc(100vh-64px)] w-full items-center justify-center bg-neutral-light/15">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-64px)] w-full bg-neutral-light/15">
      <aside
        className={`flex w-full shrink-0 flex-col border-r border-line/10 lg:w-72 ${
          mobileShowThread ? 'hidden lg:flex' : 'flex'
        }`}
      >
        <AgentChatSidebar
          conversations={conversations}
          activeRoom={room}
          isDraftNew={isDraftNew}
          onSelect={selectConversation}
          onNewChat={handleNewConversation}
        />
      </aside>

      <section
        className={`min-w-0 flex-1 flex-col bg-neutral-light/10 ${
          mobileShowThread ? 'flex' : 'hidden lg:flex'
        }`}
      >
        <header className="flex shrink-0 items-center gap-2 border-b border-line/10 bg-white/95 px-4 py-3 backdrop-blur lg:px-6">
          <button
            type="button"
            onClick={() => setMobileShowThread(false)}
            className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg text-gray-700 hover:bg-neutral-light lg:hidden"
            aria-label={t('agent_chat_back_to_history')}
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <p className="min-w-0 flex-1 truncate text-sm font-medium text-foreground lg:pl-0">
            {activeTitle}
          </p>
        </header>

        <AgentChatThread
          turns={turns}
          sending={sending}
          error={error}
          input={input}
          onInputChange={setInput}
          onSend={handleSend}
          messagesEndRef={messagesEndRef}
          textareaRef={textareaRef}
        />
      </section>
    </div>
  );
};

export default AgentChat;
