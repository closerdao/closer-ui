import { createAppKit } from '@reown/appkit/react';
import { Ethers5Adapter } from '@reown/appkit-adapter-ethers5';
import { defineChain } from '@reown/appkit/networks';

import { blockchainConfig } from './config_blockchain';

const {
  BLOCKCHAIN_NETWORK_ID,
} = blockchainConfig;

const celoMainnet = defineChain({
  id: 42220,
  caipNetworkId: 'eip155:42220',
  chainNamespace: 'eip155',
  name: 'Celo',
  nativeCurrency: {
    name: 'CELO',
    symbol: 'CELO',
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ['https://forno.celo.org'] },
  },
  blockExplorers: {
    default: { name: 'Celo Explorer', url: 'https://explorer.celo.org/mainnet' },
  },
});

const alfajores = defineChain({
  id: 44787,
  caipNetworkId: 'eip155:44787',
  chainNamespace: 'eip155',
  name: 'Celo Alfajores',
  nativeCurrency: {
    name: 'CELO',
    symbol: 'CELO',
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ['https://alfajores-forno.celo-testnet.org'] },
  },
  blockExplorers: {
    default: { name: 'Alfajores Explorer', url: 'https://alfajores-blockscout.celo-testnet.org' },
  },
});

const celoSepolia = defineChain({
  id: 11142220,
  caipNetworkId: 'eip155:11142220',
  chainNamespace: 'eip155',
  name: 'Celo Sepolia',
  nativeCurrency: {
    name: 'CELO',
    symbol: 'CELO',
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ['https://forno.celo-sepolia.celo-testnet.org'] },
  },
  blockExplorers: {
    default: { name: 'Celo Sepolia Explorer', url: 'https://celo-sepolia.blockscout.com' },
  },
});

const networks: [typeof celoMainnet, typeof alfajores, typeof celoSepolia] = [celoMainnet, alfajores, celoSepolia];

const getDefaultNetwork = () => {
  if (BLOCKCHAIN_NETWORK_ID === 42220) return celoMainnet;
  if (BLOCKCHAIN_NETWORK_ID === 11142220) return celoSepolia;
  return alfajores;
};

const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || '';

const metadata = {
  name: 'Closer',
  description: 'Closer - Regenerative Communities',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://closer.earth',
  icons: ['https://closer.earth/favicon.ico'],
};

if (typeof window !== 'undefined') {
  createAppKit({
    adapters: [new Ethers5Adapter()],
    networks,
    defaultNetwork: getDefaultNetwork(),
    projectId,
    metadata,
    features: {
      email: false,
      socials: false,
    },
  });
}

export { celoMainnet, alfajores, celoSepolia };
