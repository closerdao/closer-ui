import { TRPCClientError, createTRPCClient, httpLink } from '@trpc/client';

import type { AppRouter, FlattenedZodError } from '../api/router';

export const isTrpcEnabled = (): boolean =>
  Boolean(process.env.NEXT_PUBLIC_TRPC_URL);

// No headers, no refresh link and no interaction-session wait: for the session calls those depend on.
export const plainTrpc = () =>
  createTRPCClient<AppRouter>({
    links: [httpLink({ url: process.env.NEXT_PUBLIC_TRPC_URL ?? '' })],
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
