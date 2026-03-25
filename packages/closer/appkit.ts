import { createAppKit } from '@reown/appkit/react';
import { Ethers5Adapter } from '@reown/appkit-adapter-ethers5';
import { celo, celoSepolia, celoAlfajores } from '@reown/appkit/networks';

const networks: [typeof celo, typeof celoSepolia, typeof celoAlfajores] = [celo, celoSepolia, celoAlfajores]

const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || '';

const metadata = {
  name: 'Closer',
  description: 'Closer - Regenerative Communities',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://closer.earth',
  icons: ['https://closer.earth/favicon.ico'],
};

declare global {
  interface Window {
    __closerAppKitInitialized?: boolean;
  }
}

if (typeof window !== 'undefined') {
  if (!window.__closerAppKitInitialized) {
    createAppKit({
      adapters: [new Ethers5Adapter()],
      networks,
      projectId,
      metadata,
      allowUnsupportedChain: true,
      features: {
        email: false,
        socials: false,
      },
    });
    window.__closerAppKitInitialized = true;
  }
}

export { 
  celo as celoMainnet, 
  celoAlfajores as alfajores, 
  celoSepolia 
};
