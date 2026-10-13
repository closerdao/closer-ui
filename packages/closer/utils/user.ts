import type { User } from '../contexts/auth/types';
import api from './api';
import type { WalletSignature } from './auth';
import { isTrpcEnabled, throwApiError, trpc } from './trpc';

type UnlinkWalletInput = Parameters<typeof trpc.user.unlinkWallet.mutate>[0];
type KycInput = Parameters<typeof trpc.user.submitKyc.mutate>[0];

// Legacy `POST /update-activity`.
export const touchActivity = async (): Promise<void> => {
  if (!isTrpcEnabled()) {
    await api.post('/update-activity');
    return;
  }
  await trpc.user.touchActivity.mutate().catch(throwApiError);
};

// Legacy `POST /auth/web3/connect`: links the wallet that signed the caller's walletNonce.
export const linkWallet = async (input: WalletSignature): Promise<User> => {
  if (!isTrpcEnabled()) {
    const { data } = await api.post('/auth/web3/connect', input);
    return data.results;
  }
  const user = await trpc.user.linkWallet.mutate(input).catch(throwApiError);
  return user as unknown as User;
};

// Legacy `POST /auth/web3/unlink`: an admin removes the wallet of the user with `email`.
export const unlinkWallet = async (
  input?: UnlinkWalletInput,
): Promise<User> => {
  if (!isTrpcEnabled()) {
    const { data } = await api.post('/auth/web3/unlink', input);
    return data.results;
  }
  const user = await trpc.user.unlinkWallet
    .mutate(input ?? {})
    .catch(throwApiError);
  return user as unknown as User;
};

// Legacy `POST /auth/kyc`.
export const submitKyc = async (input: KycInput): Promise<User> => {
  if (!isTrpcEnabled()) {
    const { data } = await api.post('/auth/kyc', input);
    return data.results;
  }
  const user = await trpc.user.submitKyc.mutate(input).catch(throwApiError);
  return user as unknown as User;
};
