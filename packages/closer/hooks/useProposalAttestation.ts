import { useCallback, useEffect, useRef, useState } from 'react';

import { ProposalOnChainAttestation } from '../types';
import {
  DecodedProposalResult,
  decodeProposalResult,
  getChainRpcUrl,
  isAttestationForProposal,
} from '../utils/proposalAttestation';

/**
 * Reads a published attestation back off the chain.
 *
 * Deliberately talks to a public Celo RPC and not to our API: a verification
 * that goes through the same server whose honesty is being checked verifies
 * nothing. The transaction's calldata is the whole answer, so one
 * `eth_getTransactionByHash` is all this needs.
 */

export type ProposalAttestationRead =
  | { state: 'idle' }
  | { state: 'loading' }
  /** The chain has our attestation and it belongs to this proposal. */
  | { state: 'ready'; decoded: DecodedProposalResult; blockNumber: number | null }
  /** The node has no such transaction yet - normal while it is still pending. */
  | { state: 'not-found' }
  /**
   * A transaction exists, but its calldata is not one of our result payloads or
   * carries a different proposal. Never shown as a mismatch: it is not this
   * proposal's attestation at all.
   */
  | { state: 'unrelated' }
  | { state: 'error'; message: string };

const RPC_TIMEOUT_MS = 12000;

const fetchTransaction = async (
  rpcUrl: string,
  txHash: string,
  signal: AbortSignal,
): Promise<{ input?: string; blockNumber?: string | null } | null> => {
  const response = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_getTransactionByHash',
      params: [txHash],
    }),
    signal,
  });

  if (!response.ok) {
    throw new Error(`RPC answered ${response.status}`);
  }

  const payload = await response.json();

  if (payload?.error) {
    throw new Error(payload.error?.message || 'RPC refused the request');
  }

  return payload?.result ?? null;
};

export const useProposalAttestation = (
  onChain: ProposalOnChainAttestation | null | undefined,
  proposalId: string | undefined,
  enabled: boolean,
): ProposalAttestationRead & { retry: () => void } => {
  const [read, setRead] = useState<ProposalAttestationRead>({ state: 'idle' });
  const [attempt, setAttempt] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const retry = useCallback(() => setAttempt((value) => value + 1), []);

  useEffect(() => {
    if (!enabled || !onChain?.txHash) {
      setRead({ state: 'idle' });
      return;
    }

    const rpcUrl = getChainRpcUrl(onChain.chainId);

    if (!rpcUrl) {
      setRead({
        state: 'error',
        message: `No public node is configured for chain ${onChain.chainId}.`,
      });
      return;
    }

    const controller = new AbortController();
    abortRef.current?.abort();
    abortRef.current = controller;

    const timeout = setTimeout(() => controller.abort(), RPC_TIMEOUT_MS);

    setRead({ state: 'loading' });

    fetchTransaction(rpcUrl, onChain.txHash, controller.signal)
      .then((transaction) => {
        if (controller.signal.aborted) {
          return;
        }

        if (!transaction) {
          setRead({ state: 'not-found' });
          return;
        }

        const decoded = decodeProposalResult(transaction.input);

        if (!isAttestationForProposal(decoded, proposalId)) {
          setRead({ state: 'unrelated' });
          return;
        }

        setRead({
          state: 'ready',
          decoded: decoded as DecodedProposalResult,
          blockNumber: transaction.blockNumber
            ? Number(BigInt(transaction.blockNumber))
            : null,
        });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }

        setRead({
          state: 'error',
          message:
            error instanceof Error ? error.message : 'Could not reach the node.',
        });
      })
      .finally(() => clearTimeout(timeout));

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [enabled, onChain?.txHash, onChain?.chainId, proposalId, attempt]);

  return { ...read, retry };
};
