import { createWalletConnection } from './connection';

const address = '0x1111111111111111111111111111111111111111';
const otherAddress = '0x2222222222222222222222222222222222222222';
const deferred = <T>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
};
const tick = async () => {
  for (let i = 0; i < 8; i++) await Promise.resolve();
};

/** Which wallet auth calls went out: the challenge, then the profile link. */
const expectAuthCalls = (api: any, nonce: number, link: number) => {
  expect(api.walletNonce).toHaveBeenCalledTimes(nonce);
  expect(api.linkWallet).toHaveBeenCalledTimes(link);
};

function setup(connected = true, linked = false) {
  let user: any = {
    _id: 'member',
    ...(linked ? { walletAddress: address } : {}),
  };
  let wallet: any = {
    isConnected: connected,
    account: connected ? address : undefined,
    provider: connected
      ? { request: jest.fn(async () => 'signature') }
      : undefined,
    chainId: 42220,
  };
  const listeners = new Set<() => void>();
  const failures = new Set<() => void>();
  const open = jest.fn(async () => {});
  const onStage = jest.fn();
  const onError = jest.fn();
  const api = {
    walletNonce: jest.fn(async (): Promise<any> => ({ nonce: 'nonce' })),
    linkWallet: jest.fn(async (): Promise<any> => ({
      _id: 'member',
      walletAddress: address,
    })),
    fetchMe: jest.fn(async (): Promise<any> => ({
      _id: 'member',
      walletAddress: address,
    })),
  };
  const flow = createWalletConnection({
    getWallet: () => wallet,
    getUser: () => user,
    open,
    api,
    setUser: (updated) => {
      user = updated;
    },
    onStage,
    onError,
    subscribe: (changed, failed) => {
      listeners.add(changed);
      failures.add(failed);
      return () => {
        listeners.delete(changed);
        failures.delete(failed);
      };
    },
  });
  return {
    flow,
    api,
    open,
    onStage,
    onError,
    get wallet() {
      return wallet;
    },
    get user() {
      return user;
    },
    listeners,
    update: (next: any) => {
      wallet = next;
      listeners.forEach((listener) => listener());
    },
    setUser: (next: any) => {
      user = next;
    },
    fail: () => failures.forEach((listener) => listener()),
  };
}

test('two callers share the entire existing-wallet linking operation', async () => {
  const test = setup();
  const response = deferred<any>();
  test.api.linkWallet.mockReturnValueOnce(response.promise);
  const first = test.flow.connectWallet();
  const second = test.flow.connectWallet();
  expect(first).toBe(second);
  await tick();
  expect(test.flow.connectWallet()).toBe(first);
  expect(test.wallet.provider.request).toHaveBeenCalledTimes(1);
  expectAuthCalls(test.api, 1, 1);
  response.resolve({ _id: 'member', walletAddress: address });
  await expect(first).resolves.toBe(address);
  expect(test.user.walletAddress).toBe(address);
  expect(test.onStage).toHaveBeenLastCalledWith('idle');
  await expect(test.flow.connectWallet()).resolves.toBe(address);
  expectAuthCalls(test.api, 1, 1);
});

test('waits for the selected provider as well as the account, then signs on the first attempt', async () => {
  const test = setup(false);
  const result = test.flow.connectWallet();
  await tick();
  expect(test.open).toHaveBeenCalledTimes(1);
  test.update({ isConnected: true, account: address });
  await tick();
  expectAuthCalls(test.api, 0, 0);
  const provider = { request: jest.fn(async () => 'signature') };
  test.update({ isConnected: true, account: address, provider });
  await expect(result).resolves.toBe(address);
  expect(provider.request).toHaveBeenCalledWith({
    method: 'personal_sign',
    params: ['Signing in with code nonce', address],
  });
  expect(test.listeners.size).toBe(0);
});

test('stopping and retrying cannot let old cleanup clear the new attempt', async () => {
  const test = setup(false);
  const old = test.flow.connectWallet();
  await tick();
  test.flow.cancelWalletConnection();
  const next = test.flow.connectWallet();
  await expect(old).resolves.toBeNull();
  expect(test.flow.connectWallet()).toBe(next);
  test.flow.cancelWalletConnection();
  await expect(next).resolves.toBeNull();
  test.update({
    isConnected: true,
    account: address,
    provider: { request: jest.fn() },
  });
  await tick();
  expectAuthCalls(test.api, 0, 0);
  expect(test.listeners.size).toBe(0);
});

test('SDK failure releases the pending operation for retry', async () => {
  const test = setup(false);
  const result = test.flow.connectWallet();
  await tick();
  test.fail();
  await expect(result).resolves.toBeNull();
  expect(test.onError).toHaveBeenLastCalledWith(
    expect.objectContaining({ code: 'connection_failed' }),
  );
  const next = test.flow.connectWallet();
  expect(next).not.toBe(result);
  test.flow.cancelWalletConnection();
  await next;
});

test('does not sign or link a different account after the challenge response', async () => {
  const test = setup();
  const nonce = deferred<any>();
  test.api.walletNonce.mockReturnValueOnce(nonce.promise);
  const result = test.flow.connectWallet();
  await tick();
  const provider = test.wallet.provider;
  test.update({ ...test.wallet, account: otherAddress });
  nonce.resolve({ nonce: 'nonce' });
  await expect(result).resolves.toBeNull();
  expect(provider.request).not.toHaveBeenCalled();
  expectAuthCalls(test.api, 1, 0);
});

test('account changes while signing prevent submitting the profile link', async () => {
  const test = setup();
  const signature = deferred<string>();
  test.wallet.provider.request.mockReturnValueOnce(signature.promise);
  const result = test.flow.connectWallet();
  await tick();
  test.setUser({ _id: 'someone-else' });
  signature.resolve('signature');
  await expect(result).resolves.toBeNull();
  expectAuthCalls(test.api, 1, 0);
});

test('failed linking returns failure instead of the connected address', async () => {
  const test = setup();
  test.api.linkWallet.mockRejectedValue(new Error('connection lost'));
  test.api.fetchMe.mockResolvedValue({ _id: 'member' });
  await expect(test.flow.connectWallet()).resolves.toBeNull();
  expect(test.onError).toHaveBeenLastCalledWith(
    expect.objectContaining({ code: 'link_failed' }),
  );
  expectAuthCalls(test.api, 1, 1);
});

test('a saved profile wallet changed during approval is never overwritten', async () => {
  const test = setup();
  const signature = deferred<string>();
  test.wallet.provider.request.mockReturnValueOnce(signature.promise);
  const result = test.flow.connectWallet();
  await tick();
  test.setUser({ _id: 'member', walletAddress: otherAddress });
  signature.resolve('signature');
  await expect(result).resolves.toBeNull();
  expectAuthCalls(test.api, 1, 0);
  expect(test.user.walletAddress).toBe(otherAddress);
});

test('reconciles a committed link with a lost response without resubmitting', async () => {
  const test = setup();
  test.api.linkWallet.mockRejectedValue(new Error('connection lost'));
  await expect(test.flow.connectWallet()).resolves.toBe(address);
  expectAuthCalls(test.api, 1, 1);
});

test('a refreshed unlinked profile cannot be reported as a successful link', async () => {
  const test = setup();
  test.api.fetchMe.mockResolvedValue({ _id: 'member' });
  await expect(test.flow.connectWallet()).resolves.toBeNull();
  expect(test.user.walletAddress).toBeUndefined();
});

test('mismatch never overwrites the saved wallet', async () => {
  const test = setup(true, true);
  test.update({ ...test.wallet, account: otherAddress });
  await expect(test.flow.connectWallet()).resolves.toBeNull();
  expectAuthCalls(test.api, 0, 0);
  expect(test.user.walletAddress).toBe(address);
});

test('anonymous connection only returns an account, and signMessage reads its current provider', async () => {
  const test = setup(false);
  test.setUser(null);
  const result = test.flow.connectWallet();
  await tick();
  const provider = { request: jest.fn(async () => 'signature') };
  test.update({ isConnected: true, account: address, provider });
  await expect(result).resolves.toBe(address);
  expectAuthCalls(test.api, 0, 0);
  expect(provider.request).not.toHaveBeenCalled();
  await expect(test.flow.signMessage('login nonce', address)).resolves.toBe(
    'signature',
  );
});

test('unmount during a signature prevents a late profile mutation', async () => {
  const test = setup();
  const signature = deferred<string>();
  test.wallet.provider.request.mockReturnValueOnce(signature.promise);
  const result = test.flow.connectWallet();
  await tick();
  test.flow.dispose();
  signature.resolve('signature');
  await expect(result).resolves.toBeNull();
  expectAuthCalls(test.api, 1, 0);
});
