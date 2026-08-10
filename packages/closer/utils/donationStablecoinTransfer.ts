import { BigNumber, Contract, providers, utils } from 'ethers';

const ERC20_TRANSFER_ABI = ['function transfer(address to, uint256 amount) returns (bool)'];

export function resolveDonationStablecoinAddress(
  stablecoinLabel: string,
  config: {
    CEUR_TOKEN_ADDRESS?: string;
    BLOCKCHAIN_CEUR_TOKEN?: { address?: string; symbol?: string };
  } | null | undefined,
): string | null {
  const raw = String(stablecoinLabel || '').trim().toLowerCase();
  if (!raw) return null;
  const ceurAddr = config?.CEUR_TOKEN_ADDRESS || config?.BLOCKCHAIN_CEUR_TOKEN?.address;
  const ceurSymbol = String(config?.BLOCKCHAIN_CEUR_TOKEN?.symbol || 'cEUR')
    .trim()
    .toLowerCase();
  if (
    ceurAddr &&
    (raw === ceurSymbol ||
      raw === 'ceur' ||
      raw === 'ceur (celo)' ||
      raw.includes('ceur') ||
      raw === 'eur' ||
      raw === 'c-eur')
  ) {
    return ceurAddr;
  }
  return null;
}

function humanAmountToWei18(humanAmount: number): BigNumber {
  if (!Number.isFinite(humanAmount) || humanAmount < 0) {
    throw new Error('Invalid amount');
  }
  const s = humanAmount.toLocaleString('en-US', {
    maximumFractionDigits: 18,
    useGrouping: false,
  });
  return utils.parseUnits(s, 18);
}

export async function transferDonationStablecoin(params: {
  library: providers.Web3Provider;
  tokenAddress: string;
  to: string;
  humanAmount: number;
}): Promise<{ txHash: string }> {
  const signer = params.library.getSigner();
  const erc20 = new Contract(params.tokenAddress, ERC20_TRANSFER_ABI, signer);
  const amountWei = humanAmountToWei18(params.humanAmount);
  const tx = await erc20.transfer(params.to, amountWei);
  const receipt = await tx.wait();
  if (receipt.status !== 1) {
    throw new Error('Transaction reverted');
  }
  return { txHash: receipt.transactionHash };
}
