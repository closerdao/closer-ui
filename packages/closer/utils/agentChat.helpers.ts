import type {
  AgentChatMessage,
  AgentChatResponse,
  ChatTurn,
} from '../types/agentChat';
import api from './api';
import { setActiveRoom } from './agentChat.storage';

export function setStoredAgentChatRoom(
  userId: string,
  room: string | null,
): void {
  setActiveRoom(userId, room);
}

export function createAgentRoomId(userId: string): string {
  return `agent:${userId}:${crypto.randomUUID()}`;
}

export function messageToTurn(
  message: AgentChatMessage,
  role: 'user' | 'assistant',
): ChatTurn {
  return {
    id: message._id,
    role,
    content: message.content,
    created: message.created,
    meta: message.meta,
  };
}

export async function sendAgentMessage(
  content: string,
  room?: string,
): Promise<AgentChatResponse> {
  const body: { content: string; room?: string } = { content };
  if (room) {
    body.room = room;
  }
  const { data } = await api.post<AgentChatResponse>('/agent/chat', body);
  return data;
}
