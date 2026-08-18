import { useCallback, useEffect, useMemo, useRef } from 'react';

import type { IframeEcosystemHandler } from '@lifi/widget-light';
import {
  useAppKitAccount,
  useAppKitNetwork,
  useAppKitProvider,
} from '@reown/appkit/react';

const CELO_MAINNET_CHAIN_ID = 42220;

type Eip1193Request = {
  method: string;
  params?: unknown;
};

export type Eip1193Provider = {
  request: (request: Eip1193Request) => Promise<unknown>;
};

const rpcError = (code: number, message: string) => {
  const error = new Error(message) as Error & { code: number };
  error.code = code;
  return error;
};

export const transactionMatchesAccount = (params: unknown, account: string) => {
  if (!Array.isArray(params)) return false;
  const transaction = params[0] as { from?: unknown } | undefined;
  if (!transaction || typeof transaction !== 'object') return false;
  if (!transaction.from) return true;
  return String(transaction.from).toLowerCase() === account.toLowerCase();
};

export const useReownLiFiEvmHandler = (): IframeEcosystemHandler => {
  const { address, isConnected } = useAppKitAccount();
  const { chainId } = useAppKitNetwork();
  const { walletProvider } = useAppKitProvider('eip155');

  const stateRef = useRef({
    address,
    isConnected,
    chainId,
    walletProvider: walletProvider as Eip1193Provider | undefined,
  });
  stateRef.current = {
    address,
    isConnected,
    chainId,
    walletProvider: walletProvider as Eip1193Provider | undefined,
  };

  const emitRef = useRef<((event: string, data: unknown) => void) | null>(null);

  useEffect(() => {
    emitRef.current?.('accountsChanged', address ? [address] : []);
  }, [address]);

  useEffect(() => {
    if (!isConnected || !chainId) {
      emitRef.current?.('disconnect', {});
      return;
    }

    const numericChainId = Number(chainId);
    const hexChainId = `0x${numericChainId.toString(16)}`;
    emitRef.current?.('chainChanged', hexChainId);
    emitRef.current?.('connect', { chainId: hexChainId });
  }, [chainId, isConnected]);

  const getInitState = useCallback(() => {
    const current = stateRef.current;
    return {
      chainType: 'EVM' as const,
      state: {
        accounts: current.address ? [current.address] : [],
        chainId: current.chainId
          ? Number(current.chainId)
          : CELO_MAINNET_CHAIN_ID,
      },
    };
  }, []);

  const handleRequest = useCallback(
    async (_id: string, method: string, params?: unknown) => {
      const current = stateRef.current;
      const numericChainId = current.chainId
        ? Number(current.chainId)
        : CELO_MAINNET_CHAIN_ID;

      if (method === 'eth_accounts') {
        return current.address ? [current.address] : [];
      }
      if (method === 'eth_requestAccounts') {
        if (!current.address) {
          throw rpcError(
            4100,
            'Connect your wallet in the host application first.',
          );
        }
        return [current.address];
      }
      if (method === 'eth_chainId') {
        return `0x${numericChainId.toString(16)}`;
      }
      if (method === 'net_version') {
        return numericChainId.toString();
      }

      if (!current.walletProvider || !current.address) {
        throw rpcError(4100, 'Wallet is not connected.');
      }

      if (
        method === 'eth_sendTransaction' &&
        !transactionMatchesAccount(params, current.address)
      ) {
        throw rpcError(
          4100,
          'The transaction sender does not match the connected account.',
        );
      }

      if (method === 'wallet_getCapabilities') {
        try {
          return await current.walletProvider.request({ method, params });
        } catch {
          return {};
        }
      }

      return current.walletProvider.request({ method, params });
    },
    [],
  );

  const subscribe = useCallback(
    (emit: (event: string, data: unknown) => void) => {
      emitRef.current = emit;
      return () => {
        emitRef.current = null;
      };
    },
    [],
  );

  return useMemo(
    () => ({
      chainType: 'EVM' as const,
      getInitState,
      handleRequest,
      subscribe,
    }),
    [getInitState, handleRequest, subscribe],
  );
};
