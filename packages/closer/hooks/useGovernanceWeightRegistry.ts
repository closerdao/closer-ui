import { useCallback, useRef, useState } from 'react';

import { utils } from 'ethers';

import { blockchainConfig } from '../config_blockchain';
import {
  GovernanceTokenKey,
  GovernanceTokenSource,
  GovernanceWeightHolder,
  GovernanceWeightRegistry,
} from '../types/governanceWeight';
import {
  batchEthCall,
  erc20Interface,
  indexTokenHolders,
  rpcCall,
} from '../utils/governanceWeightRpc';

const {
  BLOCKCHAIN_DAO_TOKEN,
  BLOCKCHAIN_PRESENCE_TOKEN,
  BLOCKCHAIN_SWEAT_TOKEN,
  BLOCKCHAIN_DAO_DIAMOND_ADDRESS,
  BLOCKCHAIN_DIAMOND_ABI,
  BLOCKCHAIN_CITIZEN_NFT,
  BLOCKCHAIN_CITIZEN_NFT_ABI,
} = blockchainConfig as Record<string, any>;

const ALL_TOKEN_DEFS: { key: GovernanceTokenKey; label: string; token: any }[] =
  [
    { key: 'tdf', label: 'TDF', token: BLOCKCHAIN_DAO_TOKEN },
    { key: 'presence', label: 'Presence', token: BLOCKCHAIN_PRESENCE_TOKEN },
    { key: 'sweat', label: 'Sweat', token: BLOCKCHAIN_SWEAT_TOKEN },
  ];
const TOKEN_DEFS = ALL_TOKEN_DEFS.filter((def) => !!def.token?.address);

const diamondInterface = BLOCKCHAIN_DIAMOND_ABI
  ? new utils.Interface(BLOCKCHAIN_DIAMOND_ABI)
  : null;
const citizenInterface = BLOCKCHAIN_CITIZEN_NFT_ABI
  ? new utils.Interface(BLOCKCHAIN_CITIZEN_NFT_ABI)
  : null;

const decodeUint256 = (hex: string | undefined): bigint =>
  !hex || hex === '0x' ? 0n : BigInt(hex);

const normalizeToWad = (raw: bigint, decimals: number): bigint => {
  if (decimals === 18) return raw;
  return decimals < 18
    ? raw * 10n ** BigInt(18 - decimals)
    : raw / 10n ** BigInt(decimals - 18);
};

const INITIAL_STATE: GovernanceWeightRegistry = {
  status: 'idle',
  progressLabel: '',
  errorMessage: null,
  blockNumber: null,
  holders: [],
  tokenSources: null,
  membershipTotalSupply: null,
  diagnosticsLog: [],
  warnings: [],
};

export interface ReadGovernanceWeightRegistryOptions {
  rpcUrl: string;
  extraAddresses: string[];
  excludedAddresses: Set<string>;
  reverifyOnChain: boolean;
}

export const useGovernanceWeightRegistry = () => {
  const [registry, setRegistry] =
    useState<GovernanceWeightRegistry>(INITIAL_STATE);
  const logRef = useRef<string[]>([]);

  const log = useCallback((message: string) => {
    logRef.current = [...logRef.current, message];
    setRegistry((prev) => ({ ...prev, diagnosticsLog: logRef.current }));
  }, []);

  const setProgress = useCallback((progressLabel: string) => {
    setRegistry((prev) => ({ ...prev, progressLabel }));
  }, []);

  const read = useCallback(
    async ({
      rpcUrl,
      extraAddresses,
      excludedAddresses,
      reverifyOnChain,
    }: ReadGovernanceWeightRegistryOptions) => {
      logRef.current = [];
      setRegistry((prev) => ({
        ...INITIAL_STATE,
        status: 'loading',
        progressLabel: 'Probing contracts',
      }));

      try {
        const blockNumberHex = await rpcCall(
          rpcUrl,
          'eth_blockNumber',
          [],
          15000,
        );
        const blockNumber = blockNumberHex
          ? parseInt(blockNumberHex, 16)
          : null;
        log(`head ${blockNumber}`);

        const tokenSources: Record<string, GovernanceTokenSource> = {};
        for (const def of TOKEN_DEFS) {
          const address = def.token.address;
          const calls = [
            { to: address, data: erc20Interface.encodeFunctionData('name') },
            { to: address, data: erc20Interface.encodeFunctionData('symbol') },
            {
              to: address,
              data: erc20Interface.encodeFunctionData('decimals'),
            },
            {
              to: address,
              data: erc20Interface.encodeFunctionData('totalSupply'),
            },
          ];
          const [nameHex, symbolHex, decimalsHex, supplyHex] =
            await batchEthCall(rpcUrl, calls, { timeoutMs: 20000 });
          const code = await rpcCall(
            rpcUrl,
            'eth_getCode',
            [address, 'latest'],
            20000,
          );

          if (!code || code === '0x') {
            tokenSources[def.key] = {
              key: def.key,
              label: def.label,
              address,
              name: null,
              symbol: null,
              decimals: 18,
              totalSupply: null,
              hasContractCode: false,
              isIndexed: null,
              holderCount: 0,
              votingCount: 0,
              error: 'no contract code',
            };
            log(`${def.label}: no contract at ${address}`);
            continue;
          }

          const decodeString = (hex: string | undefined): string | null => {
            if (!hex || hex === '0x') return null;
            try {
              return erc20Interface.decodeFunctionResult(
                'name',
                hex,
              )[0] as string;
            } catch {
              return null;
            }
          };
          const decimals =
            decimalsHex && decimalsHex !== '0x'
              ? Number(decodeUint256(decimalsHex))
              : 18;
          const totalSupply = supplyHex
            ? normalizeToWad(decodeUint256(supplyHex), decimals)
            : null;

          tokenSources[def.key] = {
            key: def.key,
            label: def.label,
            address,
            name: decodeString(nameHex),
            symbol: decodeString(symbolHex),
            decimals,
            totalSupply,
            hasContractCode: true,
            isIndexed: null,
            holderCount: 0,
            votingCount: 0,
            error: null,
          };
          log(
            `${def.label}: ${
              tokenSources[def.key].symbol
            } decimals ${decimals} supply ${
              totalSupply != null ? totalSupply.toString() : '?'
            }`,
          );
        }
        setRegistry((prev) => ({
          ...prev,
          blockNumber,
          tokenSources: tokenSources as any,
        }));

        const balancesByToken: Record<string, Map<string, bigint>> = {};
        const holderMetaByAddress = new Map<
          string,
          { isContract: boolean; name: string | null; tag: string | null }
        >();

        for (const def of TOKEN_DEFS) {
          const source = tokenSources[def.key];
          if (source.error) continue;
          setProgress(`Reading holder register — ${def.label}`);
          let indexed: Awaited<ReturnType<typeof indexTokenHolders>> = null;
          try {
            indexed = await indexTokenHolders(source.address, (count) =>
              setProgress(
                `Reading holder register — ${def.label} — ${count} holders`,
              ),
            );
          } catch (error) {
            log(
              `${def.label} index error: ${
                error instanceof Error ? error.message : String(error)
              }`,
            );
          }
          tokenSources[def.key] = {
            ...source,
            isIndexed: !!indexed,
            holderCount: indexed ? indexed.size : 0,
          };
          const balances = new Map<string, bigint>();
          if (indexed) {
            for (const [address, holder] of indexed) {
              balances.set(address, holder.value);
              const existing = holderMetaByAddress.get(address);
              if (!existing || (!existing.name && holder.name)) {
                holderMetaByAddress.set(address, {
                  isContract: holder.isContract,
                  name: holder.name,
                  tag: holder.tag,
                });
              }
            }
          }
          balancesByToken[def.key] = balances;
          log(
            `${def.label}: ${
              indexed
                ? `${indexed.size} holders indexed`
                : 'no index, will read on chain'
            }`,
          );
        }
        setRegistry((prev) => ({
          ...prev,
          tokenSources: { ...tokenSources } as any,
        }));

        const candidateAddresses = new Set<string>(extraAddresses);
        for (const balances of Object.values(balancesByToken)) {
          for (const address of balances.keys())
            candidateAddresses.add(address);
        }
        for (const address of excludedAddresses)
          candidateAddresses.add(address);
        const candidates = [...candidateAddresses];
        log(`union: ${candidates.length} addresses`);

        if (!candidates.length) {
          setRegistry((prev) => ({
            ...prev,
            status: 'ready',
            progressLabel: '',
            holders: [],
          }));
          return;
        }

        const tokensNeedingChainReads = TOKEN_DEFS.filter((def) => {
          const source = tokenSources[def.key];
          return !source.error && (!source.isIndexed || reverifyOnChain);
        });
        if (tokensNeedingChainReads.length) {
          const calls = candidates.flatMap((address) =>
            tokensNeedingChainReads.map((def) => ({
              to: tokenSources[def.key].address,
              data: erc20Interface.encodeFunctionData('balanceOf', [address]),
            })),
          );
          log(`balanceOf calls: ${calls.length}`);
          const results = await batchEthCall(rpcUrl, calls, {
            onProgress: (done, total) =>
              setProgress(`Reading balances from chain — ${done} of ${total}`),
          });
          let cursor = 0;
          for (const address of candidates) {
            for (const def of tokensNeedingChainReads) {
              const hex = results[cursor++];
              const decimals = tokenSources[def.key].decimals;
              const raw = hex ? decodeUint256(hex) : 0n;
              if (!balancesByToken[def.key])
                balancesByToken[def.key] = new Map();
              balancesByToken[def.key].set(
                address,
                normalizeToWad(raw, decimals),
              );
            }
          }
        }

        const stakedByAddress = new Map<string, bigint>();
        if (diamondInterface && BLOCKCHAIN_DAO_DIAMOND_ADDRESS) {
          const calls = candidates.map((address) => ({
            to: BLOCKCHAIN_DAO_DIAMOND_ADDRESS,
            data: diamondInterface.encodeFunctionData('stakedBalanceOf', [
              address,
            ]),
          }));
          log(`stakedBalanceOf calls: ${calls.length}`);
          try {
            const results = await batchEthCall(rpcUrl, calls, {
              onProgress: (done, total) =>
                setProgress(
                  `Reading staked TDF from the DAO contract — ${done} of ${total}`,
                ),
            });
            candidates.forEach((address, i) =>
              stakedByAddress.set(address, decodeUint256(results[i])),
            );
          } catch (error) {
            log(
              `stakedBalanceOf batch error: ${
                error instanceof Error ? error.message : String(error)
              }`,
            );
          }
        }

        const memberByAddress = new Map<string, boolean>();
        let membershipTotalSupply: number | null = null;
        if (citizenInterface && BLOCKCHAIN_CITIZEN_NFT?.address) {
          try {
            const supplyHex = await rpcCall(
              rpcUrl,
              'eth_call',
              [
                {
                  to: BLOCKCHAIN_CITIZEN_NFT.address,
                  data: citizenInterface.encodeFunctionData('totalSupply'),
                },
                'latest',
              ],
              15000,
            );
            membershipTotalSupply = supplyHex
              ? Number(decodeUint256(supplyHex))
              : null;
          } catch (error) {
            log(
              `membership totalSupply error: ${
                error instanceof Error ? error.message : String(error)
              }`,
            );
          }

          const calls = candidates.map((address) => ({
            to: BLOCKCHAIN_CITIZEN_NFT.address,
            data: citizenInterface.encodeFunctionData('balanceOf', [address]),
          }));
          log(`membership balanceOf calls: ${calls.length}`);
          try {
            const results = await batchEthCall(rpcUrl, calls, {
              onProgress: (done, total) =>
                setProgress(
                  `Checking membership NFT holders — ${done} of ${total}`,
                ),
            });
            candidates.forEach((address, i) =>
              memberByAddress.set(address, decodeUint256(results[i]) > 0n),
            );
          } catch (error) {
            log(
              `membership balanceOf batch error: ${
                error instanceof Error ? error.message : String(error)
              }`,
            );
          }
        }

        const holders: GovernanceWeightHolder[] = candidates.map((address) => {
          const meta = holderMetaByAddress.get(address);
          return {
            address,
            isContract: !!meta?.isContract,
            name: meta?.name ?? null,
            tag: meta?.tag ?? null,
            tdf: balancesByToken.tdf?.get(address) ?? 0n,
            presence: balancesByToken.presence?.get(address) ?? 0n,
            sweat: balancesByToken.sweat?.get(address) ?? 0n,
            staked: stakedByAddress.get(address) ?? 0n,
            isMember: memberByAddress.get(address) ?? false,
          };
        });

        const warnings: string[] = [];
        for (const def of TOKEN_DEFS) {
          const source = tokenSources[def.key];
          if (source.error) {
            warnings.push(`${def.label} has no contract code at that address.`);
          } else if (source.totalSupply === 0n) {
            warnings.push(
              `${
                source.symbol || def.label
              } has a total supply of zero — nothing has been minted, so its term contributes nothing to any weight regardless of the multiplier.`,
            );
          } else if (source.isIndexed === false) {
            warnings.push(
              `${
                source.symbol || def.label
              } isn't in the explorer index; its balances were read directly from the chain.`,
            );
          }
        }

        setRegistry((prev) => ({
          ...prev,
          status: 'ready',
          progressLabel: '',
          blockNumber,
          holders,
          tokenSources: { ...tokenSources } as any,
          membershipTotalSupply,
          warnings,
        }));
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        log(`FAILED: ${message}`);
        setRegistry((prev) => ({
          ...prev,
          status: 'error',
          progressLabel: '',
          errorMessage: message,
        }));
      }
    },
    [log, setProgress],
  );

  return { registry, read };
};
