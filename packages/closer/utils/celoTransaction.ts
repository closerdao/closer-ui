import {
  type Address,
  type Hex,
  createPublicClient,
  createWalletClient,
  custom,
  http,
} from 'viem';
import { celo } from 'viem/chains';

import type { Eip1193Provider } from '../hooks/useReownLiFiEvmHandler';

const GAS_LIMIT_MARGIN_BPS = 2_000n;
const GAS_COST_MARGIN_BPS = 2_000n;
const BASIS_POINTS = 10_000n;

export type CeloGasPayment = 'CELO' | 'EURm';

type SendCeloTransactionInput = {
  account: string;
  data: string;
  feeCurrencyAddress?: string;
  rpcUrl: string;
  to: string;
  walletProvider: Eip1193Provider;
};

export class EurmFeeCurrencyUnsupportedError extends Error {
  code = 'EURM_FEE_UNSUPPORTED' as const;
  cause: unknown;

  constructor(cause: unknown) {
    super('The connected wallet does not support paying Celo gas in EURm.');
    this.name = 'EurmFeeCurrencyUnsupportedError';
    this.cause = cause;
  }
}

const withMargin = (value: bigint, marginBps: bigint) =>
  value + (value * marginBps) / BASIS_POINTS;

// Viem's Celo fee implementation accepts the transaction request at runtime,
// but the public estimateFeesPerGas type does not expose that parameter yet.
const estimateFeesInCurrency = (
  publicClient: { estimateFeesPerGas: unknown },
  feeCurrency: Address,
) =>
  (
    publicClient.estimateFeesPerGas as unknown as (parameters: {
      request: { feeCurrency: Address };
    }) => Promise<{
      maxFeePerGas: bigint;
      maxPriorityFeePerGas: bigint;
    }>
  )({ request: { feeCurrency } });

export const shouldUseEurmForGas = (
  nativeBalance: bigint,
  gas: bigint,
  maxFeePerGas: bigint,
) => nativeBalance < withMargin(gas * maxFeePerGas, GAS_COST_MARGIN_BPS);

const isUnsupportedFeeCurrencyError = (error: unknown) => {
  const candidate = error as { code?: unknown; message?: unknown } | undefined;
  const code = Number(candidate?.code);
  if (code === 4001) return false;
  if (code === -32601 || code === -32602 || code === 4200) return true;

  const message = String(candidate?.message || '').toLowerCase();
  return (
    message.includes('feecurrency') ||
    message.includes('fee currency') ||
    message.includes('cip-64') ||
    message.includes('unsupported transaction type')
  );
};

export const sendCeloTransaction = async ({
  account,
  data,
  feeCurrencyAddress,
  rpcUrl,
  to,
  walletProvider,
}: SendCeloTransactionInput) => {
  const accountAddress = account as Address;
  const toAddress = to as Address;
  const transactionData = data as Hex;
  const publicClient = createPublicClient({
    chain: celo,
    transport: http(rpcUrl),
  });
  const walletClient = createWalletClient({
    account: accountAddress,
    chain: celo,
    transport: custom(walletProvider as any),
  });

  const baseRequest = {
    account: accountAddress,
    data: transactionData,
    to: toAddress,
  };
  const configuredFeeCurrency = feeCurrencyAddress as Address | undefined;
  const gasEstimationRequest = configuredFeeCurrency
    ? { ...baseRequest, feeCurrency: configuredFeeCurrency }
    : baseRequest;
  const [nativeBalance, nativeGas, nativeFees] = await Promise.all([
    publicClient.getBalance({ address: accountAddress }),
    publicClient.estimateGas(gasEstimationRequest),
    publicClient.estimateFeesPerGas(),
  ]);

  const nativeMaxFeePerGas = nativeFees.maxFeePerGas ?? 0n;
  const useEurm =
    Boolean(feeCurrencyAddress) &&
    shouldUseEurmForGas(nativeBalance, nativeGas, nativeMaxFeePerGas);

  let hash: Hex;
  let gasPayment: CeloGasPayment = 'CELO';

  if (useEurm) {
    const feeCurrency = configuredFeeCurrency!;
    const feeRequest = { ...baseRequest, feeCurrency };

    try {
      const feeValues = await estimateFeesInCurrency(publicClient, feeCurrency);
      hash = await walletClient.sendTransaction({
        ...feeRequest,
        gas: withMargin(nativeGas, GAS_LIMIT_MARGIN_BPS),
        maxFeePerGas: feeValues.maxFeePerGas,
        maxPriorityFeePerGas: feeValues.maxPriorityFeePerGas,
      });
      gasPayment = 'EURm';
    } catch (error) {
      if (isUnsupportedFeeCurrencyError(error)) {
        throw new EurmFeeCurrencyUnsupportedError(error);
      }
      throw error;
    }
  } else {
    hash = await walletClient.sendTransaction({
      ...baseRequest,
      gas: withMargin(nativeGas, GAS_LIMIT_MARGIN_BPS),
      maxFeePerGas: nativeFees.maxFeePerGas,
      maxPriorityFeePerGas: nativeFees.maxPriorityFeePerGas,
    });
  }

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  return { gasPayment, hash, receipt };
};
