import type {
  AgentChatConversation,
  AgentChatStore,
  ChatTurn,
} from '../types/agentChat';

const LEGACY_ROOM_KEY = 'agentChatRoom';
const MAX_CONVERSATIONS = 50;
const TITLE_MAX_LENGTH = 48;

function storageKey(userId: string): string {
  return `agentChat:${userId}`;
}

function emptyStore(): AgentChatStore {
  return { activeRoom: null, conversations: [] };
}

function migrateLegacyRoom(store: AgentChatStore): AgentChatStore {
  if (typeof window === 'undefined') return store;
  try {
    const legacyRoom = sessionStorage.getItem(LEGACY_ROOM_KEY);
    if (!legacyRoom) return store;
    sessionStorage.removeItem(LEGACY_ROOM_KEY);
    if (store.conversations.some((c) => c.room === legacyRoom)) {
      return { ...store, activeRoom: legacyRoom };
    }
    return {
      activeRoom: legacyRoom,
      conversations: [
        {
          room: legacyRoom,
          title: '',
          turns: [],
          updatedAt: new Date().toISOString(),
        },
        ...store.conversations,
      ],
    };
  } catch {
    return store;
  }
}

export function conversationTitleFromTurns(turns: ChatTurn[]): string {
  const firstUser = turns.find((turn) => turn.role === 'user');
  if (!firstUser?.content.trim()) return '';
  const text = firstUser.content.trim().replace(/\s+/g, ' ');
  if (text.length <= TITLE_MAX_LENGTH) return text;
  return `${text.slice(0, TITLE_MAX_LENGTH)}…`;
}

export function loadAgentChatStore(userId: string): AgentChatStore {
  if (typeof window === 'undefined') return emptyStore();
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) {
      return migrateLegacyRoom(emptyStore());
    }
    const parsed = JSON.parse(raw) as AgentChatStore;
    if (!parsed?.conversations || !Array.isArray(parsed.conversations)) {
      return migrateLegacyRoom(emptyStore());
    }
    return migrateLegacyRoom({
      activeRoom: parsed.activeRoom ?? null,
      conversations: parsed.conversations,
    });
  } catch {
    return migrateLegacyRoom(emptyStore());
  }
}

export function saveAgentChatStore(
  userId: string,
  store: AgentChatStore,
): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(store));
  } catch {
    return;
  }
}

export function setActiveRoom(userId: string, room: string | null): void {
  const store = loadAgentChatStore(userId);
  saveAgentChatStore(userId, { ...store, activeRoom: room });
}

export function upsertAgentChatConversation(
  userId: string,
  room: string,
  turns: ChatTurn[],
): AgentChatStore {
  const store = loadAgentChatStore(userId);
  const existing = store.conversations.find((c) => c.room === room);
  const title =
    conversationTitleFromTurns(turns) || existing?.title || '';
  const entry: AgentChatConversation = {
    room,
    title,
    turns,
    updatedAt: new Date().toISOString(),
  };
  const conversations = [
    entry,
    ...store.conversations.filter((c) => c.room !== room),
  ].slice(0, MAX_CONVERSATIONS);
  const next: AgentChatStore = { activeRoom: room, conversations };
  saveAgentChatStore(userId, next);
  return next;
}

export function removeAgentChatConversation(
  userId: string,
  room: string,
): AgentChatStore {
  const store = loadAgentChatStore(userId);
  const conversations = store.conversations.filter((c) => c.room !== room);
  const activeRoom = store.activeRoom === room ? null : store.activeRoom;
  const next: AgentChatStore = { activeRoom, conversations };
  saveAgentChatStore(userId, next);
  return next;
}
