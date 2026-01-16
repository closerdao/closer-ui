import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http, cookieStorage, createStorage, createConfig } from 'wagmi';
import { injected, coinbaseWallet } from 'wagmi/connectors';
import { celo, celoAlfajores } from 'wagmi/chains';

const isMainnet = process.env.NEXT_PUBLIC_NETWORK === 'celo';
const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID;
const appName = process.env.NEXT_PUBLIC_PLATFORM_NAME || 'Closer';

function createWagmiConfig() {
  if (projectId) {
    return getDefaultConfig({
      appName,
      projectId,
      chains: isMainnet ? [celo] : [celoAlfajores],
      transports: isMainnet
        ? { [celo.id]: http('https://forno.celo.org') }
        : { [celoAlfajores.id]: http('https://alfajores-forno.celo-testnet.org') },
      ssr: true,
      storage: createStorage({ storage: cookieStorage }),
    });
  }

  if (isMainnet) {
    return createConfig({
      chains: [celo],
      transports: { [celo.id]: http('https://forno.celo.org') },
      connectors: [injected(), coinbaseWallet({ appName })],
      ssr: true,
      storage: createStorage({ storage: cookieStorage }),
    });
  }

  return createConfig({
    chains: [celoAlfajores],
    transports: { [celoAlfajores.id]: http('https://alfajores-forno.celo-testnet.org') },
    connectors: [injected(), coinbaseWallet({ appName })],
    ssr: true,
    storage: createStorage({ storage: cookieStorage }),
  });
}

export const wagmiConfig = createWagmiConfig();

export const targetChainId = isMainnet ? celo.id : celoAlfajores.id;
export const targetChain = isMainnet ? celo : celoAlfajores;
