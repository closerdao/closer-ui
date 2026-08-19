import { utils } from 'ethers';

// Reads used by the governance weight registry are all public, unauthenticated
// chain reads across potentially hundreds of holders — too many to issue one
// ethers Contract call each. This batches them into JSON-RPC array POSTs
// (a poor-man's multicall) against a Celo explorer's own indexer plus the RPC
// node directly, with a couple of public fallback endpoints if the primary
// one is unreachable.

export const CELO_EXPLORER_BASE_URL = 'https://celo.blockscout.com';

export const ERC20_VIEW_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address) view returns (uint256)',
];

export const erc20Interface = new utils.Interface(ERC20_VIEW_ABI);

const FALLBACK_RPC_ENDPOINTS = [
  'https://forno.celo.org',
  'https://rpc.ankr.com/celo',
  'https://celo-mainnet.public.blastapi.io',
];

interface JsonRpcCall {
  method: string;
  params: unknown[];
}

interface JsonRpcResponse {
  id: number;
  result?: string;
  error?: { message: string };
}

let nextRequestId = 1;

const fetchWithTimeout = async (
  url: string,
  init: Parameters<typeof fetch>[1],
  timeoutMs: number,
): Promise<Response> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
};

export const rpcBatchCall = async (
  rpcUrl: string,
  calls: JsonRpcCall[],
  timeoutMs = 30000,
): Promise<(JsonRpcResponse | undefined)[]> => {
  const body = calls.map((call) => ({
    jsonrpc: '2.0',
    id: nextRequestId++,
    method: call.method,
    params: call.params,
  }));
  const response = await fetchWithTimeout(
    rpcUrl,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body.length === 1 ? body[0] : body),
    },
    timeoutMs,
  );
  if (!response.ok) throw new Error(`RPC HTTP ${response.status}`);
  const json = await response.json();
  const responses: JsonRpcResponse[] = Array.isArray(json) ? json : [json];
  const byId = new Map(responses.map((item) => [item.id, item]));
  return body.map((item) => byId.get(item.id));
};

export const rpcCall = async (
  rpcUrl: string,
  method: string,
  params: unknown[],
  timeoutMs?: number,
): Promise<string | undefined> => {
  const [response] = await rpcBatchCall(
    rpcUrl,
    [{ method, params }],
    timeoutMs,
  );
  if (response?.error) throw new Error(response.error.message);
  return response?.result;
};

/** Reads a chunked batch of eth_call requests, in order, against a single RPC. */
export const batchEthCall = async (
  rpcUrl: string,
  calls: { to: string; data: string }[],
  options: {
    chunkSize?: number;
    timeoutMs?: number;
    onProgress?: (done: number, total: number) => void;
  } = {},
): Promise<(string | undefined)[]> => {
  const chunkSize = options.chunkSize ?? 90;
  const results: (string | undefined)[] = [];
  for (let i = 0; i < calls.length; i += chunkSize) {
    const chunk = calls.slice(i, i + chunkSize);
    const responses = await rpcBatchCall(
      rpcUrl,
      chunk.map((call) => ({
        method: 'eth_call',
        params: [{ to: call.to, data: call.data }, 'latest'],
      })),
      options.timeoutMs,
    );
    results.push(...responses.map((response) => response?.result));
    options.onProgress?.(Math.min(i + chunkSize, calls.length), calls.length);
  }
  return results;
};

export const candidateRpcEndpoints = (preferredRpcUrl: string): string[] => [
  preferredRpcUrl,
  ...FALLBACK_RPC_ENDPOINTS.filter((url) => url !== preferredRpcUrl),
];

export interface BlockscoutHolder {
  address: string;
  isContract: boolean;
  name: string | null;
  tag: string | null;
  value: bigint;
}

/**
 * Pages through every holder Blockscout has indexed for a token. Returns null
 * (rather than throwing) when the token isn't indexed there, so the caller can
 * fall back to reading balances directly from the chain instead.
 */
export const indexTokenHolders = async (
  tokenAddress: string,
  onProgress: (holderCount: number) => void,
): Promise<Map<string, BlockscoutHolder> | null> => {
  const holders = new Map<string, BlockscoutHolder>();
  let url:
    | string
    | null = `${CELO_EXPLORER_BASE_URL}/api/v2/tokens/${tokenAddress}/holders`;
  let page = 0;
  const maxPages = 60;

  while (url && page < maxPages) {
    const response: Response = await fetchWithTimeout(
      url,
      { headers: { accept: 'application/json' } },
      20000,
    );
    if (!response.ok) return null;
    const json = await response.json();
    for (const item of json.items || []) {
      const addressHash: string | undefined =
        item.address?.hash ??
        (typeof item.address_hash === 'string'
          ? item.address_hash
          : item.address_hash?.hash);
      if (!addressHash) continue;
      holders.set(addressHash.toLowerCase(), {
        address: addressHash.toLowerCase(),
        isContract: !!item.address?.is_contract,
        name: item.address?.name ?? null,
        tag: item.address?.metadata?.tags?.[0]?.name ?? null,
        value: BigInt(item.value || '0'),
      });
    }
    onProgress(holders.size);
    url = json.next_page_params
      ? `${CELO_EXPLORER_BASE_URL}/api/v2/tokens/${tokenAddress}/holders?` +
        new URLSearchParams(json.next_page_params).toString()
      : null;
    page++;
  }
  return holders;
};
