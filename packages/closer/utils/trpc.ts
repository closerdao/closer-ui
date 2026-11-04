import {
  type TRPCClientError,
  type TRPCLink,
  createTRPCClient,
  httpBatchLink,
} from '@trpc/client';
import { observable } from '@trpc/server/observable';

import type { AppRouter } from '../api/router';
import { doRefresh, notifySessionInvalid } from './api';
import { getAccessToken } from './authStorage';
import {
  ensureInteractionSession,
  getStoredInteractionSessionKey,
  refreshInteractionSession,
} from './interactionSession';

export {
  isTrpcEnabled,
  throwApiError,
  throwApiErrorWithLegacy404,
  toApiError,
} from './trpcBase';

// The axios 401 interceptor: an anonymous caller retries once on a fresh interaction session; then one refresh through the shared promise and cross-tab lock, one retry.
const refreshOnUnauthorized: TRPCLink<AppRouter> =
  () =>
  ({ op, next }) =>
    observable((observer) => {
      let interactionRetried = false;
      let subscription: { unsubscribe: () => void };
      const refreshTokens = (error: TRPCClientError<AppRouter>) =>
        doRefresh().then(
          () => {
            subscription = next(op).subscribe(observer);
          },
          (refreshError: { silentAuthRedirect?: boolean }) => {
            if (!refreshError?.silentAuthRedirect) notifySessionInvalid();
            observer.error(error);
          },
        );
      const attempt = () => {
        subscription = next(op).subscribe({
          next: (value) => observer.next(value),
          complete: () => observer.complete(),
          error: (error) => {
            if (error.data?.code !== 'UNAUTHORIZED') {
              observer.error(error);
              return;
            }
            if (
              !interactionRetried &&
              typeof window !== 'undefined' &&
              !getAccessToken()
            ) {
              interactionRetried = true;
              refreshInteractionSession().then(() =>
                getStoredInteractionSessionKey()
                  ? attempt()
                  : refreshTokens(error),
              );
              return;
            }
            refreshTokens(error);
          },
        });
      };
      attempt();
      return () => subscription.unsubscribe();
    });

const createClient = (readToken: () => string | undefined) =>
  createTRPCClient<AppRouter>({
    links: [
      refreshOnUnauthorized,
      httpBatchLink({
        url: process.env.NEXT_PUBLIC_TRPC_URL ?? '',
        // As the axios request interceptor: a browser gets its interaction session first, then sends it beside the token.
        async headers() {
          await ensureInteractionSession();
          const token = readToken();
          const sessionKey = getStoredInteractionSessionKey();
          return {
            ...(token && { Authorization: `Bearer ${token}` }),
            ...(sessionKey && { 'X-Interaction-Session': sessionKey }),
          };
        },
      }),
    ],
  });

export const trpc = createClient(getAccessToken);

// A server render's own client, so a batch never carries another request's token.
export const trpcFor = (token?: string) => createClient(() => token);
