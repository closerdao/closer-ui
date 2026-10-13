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

// Legacy `POST /auth/email/update`: mails a verify link to the new address.
export const updateEmail = async (
  email: string,
): Promise<{ status: string }> => {
  if (!isTrpcEnabled()) {
    const { data } = await api.post('/auth/email/update', { email });
    return data;
  }
  return trpc.user.updateEmail.mutate({ email }).catch(throwApiError);
};

// Legacy `POST /auth/phone/update`: texts a verify link to the new number.
export const updatePhone = async (
  phone: string,
): Promise<{ status: string }> => {
  if (!isTrpcEnabled()) {
    const { data } = await api.post('/auth/phone/update', { phone });
    return data;
  }
  return trpc.user.updatePhone.mutate({ phone }).catch(throwApiError);
};

// Legacy `DELETE /account`: the caller's user and everything they created.
export const deleteAccount = async (): Promise<{ message: string }> => {
  if (!isTrpcEnabled()) {
    const { data } = await api.delete('/account');
    return data;
  }
  return trpc.user.deleteAccount.mutate().catch(throwApiError);
};
