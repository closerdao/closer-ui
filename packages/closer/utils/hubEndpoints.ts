import type { AgentChatResponse } from '../types/agentChat';
import api from './api';
import { isTrpcEnabled, throwApiError, trpc } from './trpc';

const GROUP = '9.5a';

export const postAgentChat = async (body: {
  content: string;
  room?: string;
}): Promise<AgentChatResponse> => {
  if (!isTrpcEnabled(GROUP)) {
    const { data } = await api.post<AgentChatResponse>('/agent/chat', body);
    return data;
  }
  const result = await trpc.agent.chat.mutate(body).catch(throwApiError);
  return result as AgentChatResponse;
};

export const postReportIssue = async (body: {
  message: string;
  userEmail: string | null | undefined;
}): Promise<void> => {
  if (!isTrpcEnabled(GROUP)) {
    await api.post('/report-issue', body);
    return;
  }
  await trpc.support.reportIssue.mutate(body).catch(throwApiError);
};

export const triggerDeploy = async (): Promise<void> => {
  if (!isTrpcEnabled(GROUP)) {
    await api.post('/deploy', {});
    return;
  }
  await trpc.deploy.trigger.mutate({}).catch(throwApiError);
};
