import { Ethers5Adapter } from '@reown/appkit-adapter-ethers5';
import { celo, celoSepolia } from '@reown/appkit/networks';
import { createAppKit } from '@reown/appkit/react';

import { getSiteUrl } from './utils/siteUrl';

const networks: [typeof celo, typeof celoSepolia] = [celo, celoSepolia];

const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || '';

const siteUrl = getSiteUrl();

const metadata = {
  name: 'Closer',
  description: 'Closer - Regenerative Communities',
  url: typeof window !== 'undefined' ? window.location.origin : siteUrl,
  icons: siteUrl ? [`${siteUrl}/favicon.ico`] : [],
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

export { celo as celoMainnet, celoSepolia };
