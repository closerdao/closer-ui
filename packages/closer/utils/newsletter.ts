import api from './api';
import { applyInteractionIsHumanFromResponse } from './interactionSession';
import { isTrpcEnabled, throwApiError, trpc } from './trpc';

type SubscribeInput = Parameters<typeof trpc.newsletter.subscribe.mutate>[0];

// Legacy `POST /subscribe`; a form's `screenname` goes through as to legacy, which ignored it, and the API strips it.
export const subscribe = async (
  input: SubscribeInput & { screenname?: string },
): Promise<{ status: string; isHuman?: true }> => {
  if (!isTrpcEnabled()) {
    const { data } = await api.post('/subscribe', input);
    return data;
  }
  const result = await trpc.newsletter.subscribe
    .mutate(input)
    .catch(throwApiError);
  // The axios response interceptor does this for legacy `/subscribe`.
  applyInteractionIsHumanFromResponse(result);
  return result;
};
