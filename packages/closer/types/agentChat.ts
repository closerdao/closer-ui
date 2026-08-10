export type AgentChatMessageMeta = {
  role?: 'user' | 'assistant';
  agentChat?: boolean;
  intent?: string;
  domains?: string[];
  knowledgeSlugs?: string[];
  classificationProvider?: string;
};

export type AgentChatMessage = {
  _id: string;
  room: string;
  content: string;
  meta?: AgentChatMessageMeta;
  created?: string;
};

export type AgentKnowledgeEntry = {
  slug: string;
  title: string;
  value: string;
  summary: string;
};

export type AgentChatClassification = {
  intent: string;
  domains: string[];
  provider: string;
};

export type AgentChatResponse = {
  room: string;
  message: AgentChatMessage;
  assistantMessage: AgentChatMessage;
  classification?: AgentChatClassification;
  knowledge?: AgentKnowledgeEntry[];
};

export type ChatTurn = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created?: string;
  meta?: AgentChatMessageMeta;
  knowledge?: AgentKnowledgeEntry[];
  classification?: AgentChatClassification;
};

export type AgentChatState = {
  room: string | null;
  turns: ChatTurn[];
  sending: boolean;
  error: string | null;
};

export type AgentChatConversation = {
  room: string;
  title: string;
  turns: ChatTurn[];
  updatedAt: string;
};

export type AgentChatStore = {
  activeRoom: string | null;
  conversations: AgentChatConversation[];
};
