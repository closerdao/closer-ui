import axios from 'axios';

import type { User } from '../contexts/auth/types';
import { isTrpcEnabled, plainTrpc, throwApiError } from './trpcBase';

// api.js imports this module, so it reaches the API without api.js or the trpc client's refresh link.

const baseURL = process.env.NEXT_PUBLIC_API_URL;

const LOGOUT_TIMEOUT_MS = 5000;

export type RefreshedSession = {
  results?: User;
  access_token?: string;
  refresh_token?: string;
};

// Legacy `POST /auth/refresh`: the next token pair and the user it belongs to.
export const refreshSession = async (
  refreshToken: string,
): Promise<RefreshedSession | undefined> => {
  if (!isTrpcEnabled()) {
    const res = await axios.post(
      `${baseURL}/auth/refresh`,
      { refresh_token: refreshToken },
      { headers: { 'Content-Type': 'application/json' } },
    );
    return res?.data;
  }
  const { user, ...tokens } = await plainTrpc()
    .auth.refresh.mutate({ refresh_token: refreshToken })
    .catch(throwApiError);
  return { ...tokens, results: user as unknown as User };
};

// Legacy `POST /auth/logout`: revokes the refresh token's session.
export const revokeSession = async (
  refreshToken: string,
  accessToken: string | undefined,
): Promise<void> => {
  if (!isTrpcEnabled()) {
    await axios.post(
      `${baseURL}/auth/logout`,
      { refresh_token: refreshToken },
      {
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        timeout: LOGOUT_TIMEOUT_MS,
      },
    );
    return;
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), LOGOUT_TIMEOUT_MS);
  try {
    await plainTrpc().auth.logout.mutate(
      { refresh_token: refreshToken },
      { signal: controller.signal },
    );
  } finally {
    clearTimeout(timer);
  }
};
