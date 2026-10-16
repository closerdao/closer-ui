type Provider = {
  request: (request: { method: string; params?: unknown[] }) => Promise<any>;
};
type User = { _id: string; walletAddress?: string; [key: string]: any };
type Wallet = {
  account?: string;
  provider?: Provider;
  isConnected: boolean;
  chainId?: number | string;
};
type Stage = 'idle' | 'connecting' | 'linking';

export class WalletFlowError extends Error {
  constructor(public code: string) {
    super(code);
  }
}

const sameAddress = (a?: string, b?: string) =>
  Boolean(a && b && a.toLowerCase() === b.toLowerCase());

/** Closer's connection/authentication work. AppKit owns the wallet session. */
export function createWalletConnection({
  getWallet,
  getUser,
  open,
  subscribe,
  api,
  setUser,
  onStage,
  onError,
  track = () => {},
}: {
  getWallet: () => Wallet;
  getUser: () => User | null;
  open: () => Promise<unknown>;
  subscribe: (
    changed: () => void,
    failed: () => void,
    selected: (name?: string) => void,
  ) => () => void;
  /** The wallet auth calls; utils/auth and utils/users pick REST or tRPC. */
  api: {
    walletNonce: (walletAddress: string) => Promise<{ nonce?: string | null }>;
    linkWallet: (signature: {
      signedMessage: string;
      walletAddress: string;
      message: string;
    }) => Promise<User | undefined>;
    fetchMe: () => Promise<User | undefined>;
  };
  setUser: (user: User) => void;
  onStage: (stage: Stage) => void;
  onError: (error: WalletFlowError | null) => void;
  track?: (event: string, fields: Record<string, unknown>) => void;
}) {
  type Attempt = {
    promise: Promise<string | null>;
    stage: Stage;
    userId?: string;
    cancelled: boolean;
    stop?: () => void;
    id: string;
    started: number;
    outcome: string;
    walletName?: string;
  };
  let active: Attempt | null = null;
  let disposed = false;

  const assertIdentity = (wallet: Wallet, userId?: string) => {
    const current = getWallet();
    if (
      disposed ||
      !current.isConnected ||
      !sameAddress(current.account, wallet.account) ||
      current.provider !== wallet.provider ||
      getUser()?._id !== userId
    ) {
      throw new WalletFlowError('account_changed');
    }
  };

  const sign = async (message: string, wallet: Wallet, userId?: string) => {
    assertIdentity(wallet, userId);
    if (!wallet.provider) throw new WalletFlowError('not_ready');
    const signature = await wallet.provider.request({
      method: 'personal_sign',
      params: [message, wallet.account],
    });
    assertIdentity(wallet, userId);
    if (typeof signature !== 'string' || !signature)
      throw new WalletFlowError('signature_failed');
    return signature;
  };

  const waitForWallet = (attempt: Attempt): Promise<Wallet | null> =>
    new Promise((resolve, reject) => {
      let settled = false;
      let unsubscribe = () => {};
      const finish = (wallet: Wallet | null, error?: Error) => {
        if (settled) return;
        settled = true;
        unsubscribe();
        attempt.stop = undefined;
        if (error) reject(error);
        else resolve(wallet);
      };
      const check = () => {
        if (getUser()?._id !== attempt.userId)
          return finish(null, new WalletFlowError('account_changed'));
        const wallet = getWallet();
        if (wallet.isConnected && wallet.account && wallet.provider)
          finish(wallet);
      };
      attempt.stop = () => finish(null);
      unsubscribe = subscribe(
        check,
        () => finish(null, new WalletFlowError('connection_failed')),
        (name) => {
          attempt.walletName = name;
        },
      );
      // Some subscriptions emit immediately. Dispose those too if already settled.
      if (settled) unsubscribe();
      check();
      if (!settled)
        void open().catch(() =>
          finish(null, new WalletFlowError('connection_failed')),
        );
    });

  const link = async (wallet: Wallet, userId: string) => {
    const assertLinkIdentity = () => {
      assertIdentity(wallet, userId);
      const saved = getUser()?.walletAddress;
      if (saved && !sameAddress(saved, wallet.account))
        throw new WalletFlowError('account_mismatch');
    };
    assertLinkIdentity();
    const { nonce } = await api.walletNonce(wallet.account as string);
    assertLinkIdentity();
    if (nonce === undefined || nonce === null)
      throw new WalletFlowError('link_failed');
    const message = `Signing in with code ${nonce}`;
    const signedMessage = await sign(message, wallet, userId);
    assertLinkIdentity();
    let updated: User | undefined;
    try {
      updated = await api.linkWallet({
        signedMessage,
        walletAddress: wallet.account as string,
        message,
      });
    } catch {
      // The server may have committed the link despite a lost response.
      // Read its state; never automatically submit the mutation again.
    }
    assertLinkIdentity();
    try {
      const refreshed = await api.fetchMe();
      assertLinkIdentity();
      if (refreshed?._id === userId) updated = refreshed;
    } catch (error) {
      if (error instanceof WalletFlowError) throw error;
    }
    assertLinkIdentity();
    if (updated?._id === userId) setUser(updated);
    if (
      updated?._id !== userId ||
      !sameAddress(updated.walletAddress, wallet.account)
    )
      throw new WalletFlowError(
        updated?.walletAddress ? 'account_mismatch' : 'link_failed',
      );
  };

  const connectWallet = (): Promise<string | null> => {
    if (active) return active.promise;
    if (disposed) return Promise.resolve(null);
    const attempt: Attempt = {
      promise: undefined as any,
      stage: 'connecting',
      userId: getUser()?._id,
      cancelled: false,
      id: crypto.randomUUID(),
      started: Date.now(),
      outcome: 'failed',
    };
    active = attempt;
    onError(null);
    onStage('connecting');
    track('wallet_connection_started', { attemptId: attempt.id });
    attempt.promise = Promise.resolve()
      .then(async () => {
        if (attempt.cancelled || disposed) return null;
        const wallet = await waitForWallet(attempt);
        if (!wallet || attempt.cancelled || disposed) return null;
        assertIdentity(wallet, attempt.userId);
        const user = getUser();
        if (
          user?.walletAddress &&
          !sameAddress(user.walletAddress, wallet.account)
        )
          throw new WalletFlowError('account_mismatch');
        if (user && !user.walletAddress) {
          attempt.stage = 'linking';
          onStage('linking');
          await link(wallet, user._id);
        }
        assertIdentity(wallet, attempt.userId);
        attempt.outcome = 'success';
        return wallet.account!;
      })
      .catch((error) => {
        const failure =
          error instanceof WalletFlowError
            ? error
            : new WalletFlowError(
                Number(error?.code) === 4001
                  ? 'signature_rejected'
                  : attempt.stage === 'linking'
                    ? 'link_failed'
                    : 'connection_failed',
              );
        if (!disposed && active === attempt) onError(failure);
        track('wallet_connection_error', {
          attemptId: attempt.id,
          stage: attempt.stage,
          code: failure.code,
        });
        return null;
      })
      .finally(() => {
        attempt.stop?.();
        if (active === attempt) {
          active = null;
          if (!disposed) onStage('idle');
        }
        track('wallet_connection_finished', {
          attemptId: attempt.id,
          stage: attempt.stage,
          outcome: attempt.outcome,
          elapsedMs: Date.now() - attempt.started,
          walletName: attempt.walletName,
          chainId: getWallet().chainId,
          sdkVersion: '1.8.24',
        });
      });
    return attempt.promise;
  };

  return {
    connectWallet,
    getConnectedAccount() {
      const wallet = getWallet();
      return !disposed && wallet.isConnected && wallet.provider
        ? wallet.account || null
        : null;
    },
    cancelWalletConnection() {
      if (!active || active.stage !== 'connecting') return;
      const attempt = active;
      attempt.cancelled = true;
      attempt.outcome = 'cancelled';
      attempt.stop?.();
      active = null;
      if (!disposed) onStage('idle');
    },
    async signMessage(message: string, account: string) {
      try {
        const wallet = getWallet();
        if (!sameAddress(wallet.account, account))
          throw new WalletFlowError('account_changed');
        return await sign(message, wallet, getUser()?._id);
      } catch (error) {
        if (!disposed)
          onError(
            error instanceof WalletFlowError
              ? error
              : new WalletFlowError(
                  Number((error as any)?.code) === 4001
                    ? 'signature_rejected'
                    : 'signature_failed',
                ),
          );
        return null;
      }
    },
    dispose() {
      disposed = true;
      if (active) {
        active.cancelled = true;
        active.outcome = 'cancelled';
        active.stop?.();
      }
    },
  };
}
