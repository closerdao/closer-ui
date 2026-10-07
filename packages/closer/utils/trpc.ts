import {
  TRPCClientError,
  type TRPCLink,
  createTRPCClient,
  httpBatchLink,
} from '@trpc/client';
import { observable } from '@trpc/server/observable';

import type { AppRouter, FlattenedZodError } from '../api/router';
import { doRefresh, notifySessionInvalid } from './api';
import { getAccessToken } from './authStorage';
import {
  ensureInteractionSession,
  getStoredInteractionSessionKey,
  refreshInteractionSession,
} from './interactionSession';

export const isTrpcEnabled = (): boolean =>
  Boolean(process.env.NEXT_PUBLIC_TRPC_URL);

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

type Issue = { path: (string | number)[]; message: string };

// Zod's error message is its issue list as JSON; the flattened zodError loses the nested path.
const parseIssues = (message: string, zodError: FlattenedZodError): Issue[] => {
  try {
    const issues = JSON.parse(message);
    if (Array.isArray(issues)) return issues;
  } catch {}
  return Object.entries(zodError.fieldErrors).map(([field, messages]) => ({
    path: [field],
    message: messages?.[0] ?? '',
  }));
};

// Same text as closer-api safeWrite: `Invalid value for "price" (expected a number, ...)`.
const validationMessage = (message: string, zodError: FlattenedZodError) => {
  const byField = new Map<string, string>();
  for (const { path, message: issue } of parseIssues(message, zodError)) {
    const field = String(
      path[0] === 'data' && path.length > 1 ? path[1] : path[0],
    );
    if (!byField.has(field)) byField.set(field, issue);
  }
  if (byField.size === 0) return zodError.formErrors.join(', ') || message;
  const detail = [...byField]
    .map(([field, issue]) => `"${field}" (${issue})`)
    .join(', ');
  return `Invalid ${byField.size === 1 ? 'value' : 'values'} for ${detail}`;
};

type ErrorData = { httpStatus?: number; zodError?: FlattenedZodError | null };

// Reshapes a tRPC failure into the axios error parseMessageFromError reads (`response.data.error`).
export const toApiError = (error: unknown): unknown => {
  if (!(error instanceof TRPCClientError)) return error;
  const data = error.data as ErrorData | undefined;
  if (!data) {
    // fetch rejects with a TypeError only when no response came back; a non-JSON body (proxy 502) is an HTTP error.
    return new Error(
      (error.cause as Error | undefined)?.name === 'TypeError'
        ? 'Network Error'
        : 'Something went wrong',
    );
  }
  const message = data.zodError
    ? validationMessage(error.message, data.zodError)
    : error.message;
  return Object.assign(new Error(message), {
    response: { status: data.httpStatus, data: { error: message } },
  });
};

export const throwApiError = (error: unknown): never => {
  throw toApiError(error);
};

// Legacy's 404 body is `{ results: null }` with no error text, as axios rejected it.
export const throwApiErrorWithLegacy404 = (error: unknown): never => {
  if (
    error instanceof TRPCClientError &&
    (error.data as { code?: string } | undefined)?.code === 'NOT_FOUND'
  ) {
    throw Object.assign(new Error('Request failed with status code 404'), {
      response: { status: 404, data: { results: null } },
    });
  }
  return throwApiError(error);
};
