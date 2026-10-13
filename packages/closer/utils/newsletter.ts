import api from './api';
import { applyInteractionIsHumanFromResponse } from './interactionSession';
import { isTrpcEnabled, throwApiError, trpc } from './trpc';

type SubscribeInput = Parameters<typeof trpc.newsletter.subscribe.mutate>[0];

// Legacy `POST /subscribe`; the forms also send a `screenname`, which legacy ignored.
export const subscribe = async (
  input: SubscribeInput & { screenname?: string },
): Promise<{ status: string; isHuman?: true }> => {
  if (!isTrpcEnabled()) {
    const { data } = await api.post('/subscribe', input);
    return data;
  }
  const { email, tags, turnstileToken } = input;
  const result = await trpc.newsletter.subscribe
    .mutate({ email, tags, turnstileToken })
    .catch(throwApiError);
  // The axios response interceptor does this for legacy `/subscribe`.
  applyInteractionIsHumanFromResponse(result);
  return result;
};
