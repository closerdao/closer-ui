import type { User } from '../contexts/auth/types';
import api from './api';
import { applyInteractionIsHumanFromResponse } from './interactionSession';
import { isTrpcEnabled, throwApiError, toApiError, trpc } from './trpc';

type LoginInput = Parameters<typeof trpc.auth.login.mutate>[0];
export type WalletSignature = Parameters<
  typeof trpc.auth.walletLogin.mutate
>[0];

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

// Legacy `POST /check-user-exists`.
export const userExists = async (
  email: string | null | undefined,
): Promise<{ doesUserExist: boolean }> => {
  if (!isTrpcEnabled()) {
    const { data } = await api.post('/check-user-exists', { email });
    return data;
  }
  return trpc.auth.userExists
    .mutate({ email: email ?? undefined })
    .catch(throwApiError);
};

// Legacy `POST /auth/web3/pre-sign`: the nonce to sign as `Signing in with code <nonce>`.
export const walletNonce = async (
  walletAddress: string,
): Promise<{ nonce: string }> => {
  if (!isTrpcEnabled()) {
    const { data } = await api.post('/auth/web3/pre-sign', { walletAddress });
    return data;
  }
  return trpc.auth.walletNonce.mutate({ walletAddress }).catch(throwApiError);
};

// Legacy `POST /auth/web3/login`; needs a nonce from walletNonce on the same API.
export const walletLogin = async (
  input: WalletSignature,
): Promise<Omit<LoginResult, 'isHuman' | 'warning'>> => {
  if (!isTrpcEnabled()) {
    const { data } = await api.post('/auth/web3/login', input);
    return data;
  }
  const { user, ...session } = await trpc.auth.walletLogin
    .mutate(input)
    .catch(throwApiError);
  return { ...session, results: user as unknown as User };
};
