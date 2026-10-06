import { TRPCClientError, createTRPCClient, httpBatchLink } from '@trpc/client';

import type { AppRouter, FlattenedZodError } from '../api/router';
import { refreshTokensProactively } from './api';
import { getAccessToken } from './authStorage';

export const isTrpcEnabled = (): boolean =>
  Boolean(process.env.NEXT_PUBLIC_TRPC_URL);

export const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: process.env.NEXT_PUBLIC_TRPC_URL ?? '',
      async headers() {
        // The legacy client refreshes on a 401; tRPC has no such retry, so refresh before sending.
        await refreshTokensProactively();
        const token = getAccessToken();
        return token ? { Authorization: `Bearer ${token}` } : {};
      },
    }),
  ],
});

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
  if (!data) return new Error('Network Error');
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
