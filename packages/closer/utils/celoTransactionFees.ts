import { BigNumber, constants } from 'ethers';

import { blockchainConfig } from '../config_blockchain';

type FeeConfig = {
  BLOCKCHAIN_NETWORK_ID?: number;
  BLOCKCHAIN_RPC_URL?: string;
};

type FeeOverrides = {
  maxPriorityFeePerGas?: BigNumber;
  maxFeePerGas?: BigNumber;
};

// Native CELO gas only. Fetch on each submission so approvals and later
// staking batches do not reuse a quote from before a wallet confirmation.
export async function getCeloTransactionFees(
  config: FeeConfig = blockchainConfig,
): Promise<FeeOverrides> {
  if (
    ![42220, 11142220].includes(Number(config?.BLOCKCHAIN_NETWORK_ID)) ||
    !config?.BLOCKCHAIN_RPC_URL
  ) {
    return {};
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const rpc = async (method: string, params: unknown[]) => {
      const response = await fetch(config.BLOCKCHAIN_RPC_URL!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error('Fee RPC request failed');
      const body = await response.json();
      if (body.error) throw new Error('Fee RPC returned an error');
      return body.result;
    };

    const [priorityFee, block] = await Promise.all([
      rpc('eth_maxPriorityFeePerGas', []),
      rpc('eth_getBlockByNumber', ['latest', false]),
    ]);
    const values = [priorityFee, block?.baseFeePerGas];
    if (
      values.some(
        (value) => typeof value !== 'string' || !/^0x[0-9a-f]+$/i.test(value),
      )
    ) {
      return {};
    }

    const maxPriorityFeePerGas = BigNumber.from(priorityFee);
    const baseFeePerGas = BigNumber.from(block.baseFeePerGas);
    const maxFeePerGas = baseFeePerGas.mul(2).add(maxPriorityFeePerGas);
    if (
      maxPriorityFeePerGas.isZero() ||
      baseFeePerGas.isZero() ||
      maxFeePerGas.gt(constants.MaxUint256)
    ) {
      return {};
    }
    return { maxPriorityFeePerGas, maxFeePerGas };
  } catch {
    // Fee estimation is optional; the wallet can still estimate and submit.
    return {};
  } finally {
    clearTimeout(timeout);
    controller.abort();
  }
}
