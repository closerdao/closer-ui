import type { User } from '../contexts/auth/types';
import api from './api';
import { applyInteractionIsHumanFromResponse } from './interactionSession';
import { isTrpcEnabled, toApiError, trpc } from './trpc';

type LoginInput = Parameters<typeof trpc.auth.login.mutate>[0];

export type LoginResult = {
  results: User;
  access_token: string;
  refresh_token: string;
  isHuman?: true;
  warning?: string;
};

// Legacy answered these with 401, which the login form replaces with its own message.
const LEGACY_401_LOGIN_ERRORS = ['User not found.', 'Invalid password.'];

const toLoginError = (error: unknown) => {
  const apiError = toApiError(error) as Error & {
    response?: { status?: number };
  };
  if (apiError.response && LEGACY_401_LOGIN_ERRORS.includes(apiError.message)) {
    apiError.response.status = 401;
  }
  return apiError;
};

// Legacy `POST /login`: an email (or slug) and password, or a Google ID token.
export const login = async (input: LoginInput): Promise<LoginResult> => {
  if (!isTrpcEnabled()) {
    const { data } = await api.post('/login', input);
    return data;
  }
  const { user, ...session } = await trpc.auth.login
    .mutate(input)
    .catch((error) => {
      throw toLoginError(error);
    });
  // The axios response interceptor does this for legacy `/login`.
  applyInteractionIsHumanFromResponse(session);
  return { ...session, results: user as unknown as User };
};
