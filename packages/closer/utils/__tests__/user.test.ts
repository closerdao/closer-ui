import { TRPCClientError } from '@trpc/client';

import api from '../api';
import { isTrpcEnabled, trpc } from '../trpc';
import {
  deleteAccount,
  linkWallet,
  submitKyc,
  touchActivity,
  unlinkWallet,
  updateEmail,
  updatePhone,
} from '../user';

jest.mock('../api', () => ({
  __esModule: true,
  default: { post: jest.fn(), delete: jest.fn() },
}));

jest.mock('../trpc', () => ({
  ...jest.requireActual('../trpc'),
  isTrpcEnabled: jest.fn(),
  trpc: {
    user: {
      touchActivity: { mutate: jest.fn() },
      linkWallet: { mutate: jest.fn() },
      unlinkWallet: { mutate: jest.fn() },
      submitKyc: { mutate: jest.fn() },
      updateEmail: { mutate: jest.fn() },
      updatePhone: { mutate: jest.fn() },
      deleteAccount: { mutate: jest.fn() },
    },
  },
}));

const mockedApi = api as unknown as { post: jest.Mock; delete: jest.Mock };
const mockedEnabled = isTrpcEnabled as jest.Mock;
const user = trpc.user as unknown as Record<
  | 'touchActivity'
  | 'linkWallet'
  | 'unlinkWallet'
  | 'submitKyc'
  | 'updateEmail'
  | 'updatePhone'
  | 'deleteAccount',
  { mutate: jest.Mock }
>;

const ada = { _id: 'u1', email: 'ada@example.com', walletAddress: '0xabc' };

const trpcError = (code: string, httpStatus: number, message: string) =>
  new TRPCClientError(message, {
    result: {
      error: {
        message,
        code: -32600,
        data: { code, httpStatus, zodError: null },
      },
    },
  });

beforeEach(() => {
  jest.clearAllMocks();
});

describe('touchActivity', () => {
  it('posts to legacy /update-activity with the flag off', async () => {
    mockedEnabled.mockReturnValue(false);
    mockedApi.post.mockResolvedValue({ data: { status: 'Activity updated' } });

    await expect(touchActivity()).resolves.toBeUndefined();
    expect(mockedApi.post).toHaveBeenCalledWith('/update-activity');
    expect(user.touchActivity.mutate).not.toHaveBeenCalled();
  });

  it('calls user.touchActivity with the flag on', async () => {
    mockedEnabled.mockReturnValue(true);
    user.touchActivity.mutate.mockResolvedValue({
      status: 'Activity updated',
      lastactive: '2026-10-13T00:00:00.000Z',
    });

    await expect(touchActivity()).resolves.toBeUndefined();
    expect(user.touchActivity.mutate).toHaveBeenCalled();
    expect(mockedApi.post).not.toHaveBeenCalled();
  });
});

describe('linkWallet', () => {
  const signature = {
    walletAddress: '0xabc',
    signedMessage: '0xsig',
    message: 'Signing in with code n1',
  };

  it('posts to legacy /auth/web3/connect with the flag off and returns results', async () => {
    mockedEnabled.mockReturnValue(false);
    mockedApi.post.mockResolvedValue({ data: { results: ada } });

    await expect(linkWallet(signature)).resolves.toBe(ada);
    expect(mockedApi.post).toHaveBeenCalledWith(
      '/auth/web3/connect',
      signature,
    );
    expect(user.linkWallet.mutate).not.toHaveBeenCalled();
  });

  it('calls user.linkWallet with the flag on and returns the user', async () => {
    mockedEnabled.mockReturnValue(true);
    user.linkWallet.mutate.mockResolvedValue(ada);

    await expect(linkWallet(signature)).resolves.toBe(ada);
    expect(user.linkWallet.mutate).toHaveBeenCalledWith(signature);
    expect(mockedApi.post).not.toHaveBeenCalled();
  });
});

describe('unlinkWallet', () => {
  it('posts to legacy /auth/web3/unlink with the flag off, no body without an email', async () => {
    mockedEnabled.mockReturnValue(false);
    mockedApi.post.mockResolvedValue({ data: { results: ada } });

    await expect(unlinkWallet()).resolves.toBe(ada);
    expect(mockedApi.post).toHaveBeenCalledWith('/auth/web3/unlink', undefined);
    await unlinkWallet({ email: 'ada@example.com' });
    expect(mockedApi.post).toHaveBeenLastCalledWith('/auth/web3/unlink', {
      email: 'ada@example.com',
    });
    expect(user.unlinkWallet.mutate).not.toHaveBeenCalled();
  });

  it('calls user.unlinkWallet with the flag on and returns the user', async () => {
    mockedEnabled.mockReturnValue(true);
    user.unlinkWallet.mutate.mockResolvedValue(ada);

    await expect(unlinkWallet({ email: 'ada@example.com' })).resolves.toBe(ada);
    expect(user.unlinkWallet.mutate).toHaveBeenCalledWith({
      email: 'ada@example.com',
    });
    expect(mockedApi.post).not.toHaveBeenCalled();
  });

  it('rejects a call without an email in legacy error shape', async () => {
    mockedEnabled.mockReturnValue(true);
    user.unlinkWallet.mutate.mockRejectedValue(
      trpcError('NOT_FOUND', 404, 'User not found'),
    );

    await expect(unlinkWallet()).rejects.toMatchObject({
      message: 'User not found',
      response: { status: 404, data: { error: 'User not found' } },
    });
    expect(user.unlinkWallet.mutate).toHaveBeenCalledWith({});
  });
});

describe('submitKyc', () => {
  const kyc = {
    legalName: 'Ada Lovelace',
    TIN: undefined,
    address1: '1 Main St',
    address2: '',
    postalCode: '1000',
    city: 'Lisbon',
    state: '',
    country: 'PT',
  };

  it('posts to legacy /auth/kyc with the flag off and returns results', async () => {
    mockedEnabled.mockReturnValue(false);
    mockedApi.post.mockResolvedValue({ data: { results: ada } });

    await expect(submitKyc(kyc)).resolves.toBe(ada);
    expect(mockedApi.post).toHaveBeenCalledWith('/auth/kyc', kyc);
    expect(user.submitKyc.mutate).not.toHaveBeenCalled();
  });

  it('calls user.submitKyc with the flag on and returns the user', async () => {
    mockedEnabled.mockReturnValue(true);
    user.submitKyc.mutate.mockResolvedValue(ada);

    await expect(submitKyc(kyc)).resolves.toBe(ada);
    expect(user.submitKyc.mutate).toHaveBeenCalledWith(kyc);
    expect(mockedApi.post).not.toHaveBeenCalled();
  });

  it('rejects a refused declaration in legacy error shape', async () => {
    mockedEnabled.mockReturnValue(true);
    user.submitKyc.mutate.mockRejectedValue(
      trpcError('BAD_REQUEST', 400, 'Country not supported'),
    );

    await expect(submitKyc({ ...kyc, country: 'US' })).rejects.toMatchObject({
      response: { status: 400, data: { error: 'Country not supported' } },
    });
  });
});

describe('updateEmail', () => {
  it('posts to legacy /auth/email/update with the flag off', async () => {
    mockedEnabled.mockReturnValue(false);
    mockedApi.post.mockResolvedValue({
      data: { status: 'Email verification sent!' },
    });

    await expect(updateEmail('new@example.com')).resolves.toEqual({
      status: 'Email verification sent!',
    });
    expect(mockedApi.post).toHaveBeenCalledWith('/auth/email/update', {
      email: 'new@example.com',
    });
    expect(user.updateEmail.mutate).not.toHaveBeenCalled();
  });

  it('calls user.updateEmail with the flag on', async () => {
    mockedEnabled.mockReturnValue(true);
    user.updateEmail.mutate.mockResolvedValue({
      status: 'Email verification sent!',
    });

    await updateEmail('new@example.com');
    expect(user.updateEmail.mutate).toHaveBeenCalledWith({
      email: 'new@example.com',
    });
    expect(mockedApi.post).not.toHaveBeenCalled();
  });

  it('rejects a taken email in legacy error shape', async () => {
    mockedEnabled.mockReturnValue(true);
    user.updateEmail.mutate.mockRejectedValue(
      trpcError('BAD_REQUEST', 400, 'Email already exists.'),
    );

    await expect(updateEmail('new@example.com')).rejects.toMatchObject({
      response: { status: 400, data: { error: 'Email already exists.' } },
    });
  });
});

describe('updatePhone', () => {
  it('posts to legacy /auth/phone/update with the flag off', async () => {
    mockedEnabled.mockReturnValue(false);
    mockedApi.post.mockResolvedValue({
      data: { status: 'Text verification sent!' },
    });

    await expect(updatePhone('+351 900 000 000')).resolves.toEqual({
      status: 'Text verification sent!',
    });
    expect(mockedApi.post).toHaveBeenCalledWith('/auth/phone/update', {
      phone: '+351 900 000 000',
    });
    expect(user.updatePhone.mutate).not.toHaveBeenCalled();
  });

  it('calls user.updatePhone with the flag on', async () => {
    mockedEnabled.mockReturnValue(true);
    user.updatePhone.mutate.mockResolvedValue({
      status: 'Text verification sent!',
    });

    await updatePhone('+351 900 000 000');
    expect(user.updatePhone.mutate).toHaveBeenCalledWith({
      phone: '+351 900 000 000',
    });
    expect(mockedApi.post).not.toHaveBeenCalled();
  });

  it('rejects a failed text as legacy 503', async () => {
    mockedEnabled.mockReturnValue(true);
    const message =
      'Could not send the verification text. Please try again later.';
    user.updatePhone.mutate.mockRejectedValue(
      trpcError('SERVICE_UNAVAILABLE', 503, message),
    );

    await expect(updatePhone('+351 900 000 000')).rejects.toMatchObject({
      response: { status: 503, data: { error: message } },
    });
  });
});

describe('deleteAccount', () => {
  const body = {
    message:
      'Your account and all associated data have been permanently deleted.',
  };

  it('sends legacy DELETE /account with the flag off', async () => {
    mockedEnabled.mockReturnValue(false);
    mockedApi.delete.mockResolvedValue({ data: body });

    await expect(deleteAccount()).resolves.toEqual(body);
    expect(mockedApi.delete).toHaveBeenCalledWith('/account');
    expect(user.deleteAccount.mutate).not.toHaveBeenCalled();
  });

  it('calls user.deleteAccount with the flag on', async () => {
    mockedEnabled.mockReturnValue(true);
    user.deleteAccount.mutate.mockResolvedValue(body);

    await expect(deleteAccount()).resolves.toEqual(body);
    expect(user.deleteAccount.mutate).toHaveBeenCalled();
    expect(mockedApi.delete).not.toHaveBeenCalled();
  });
});
