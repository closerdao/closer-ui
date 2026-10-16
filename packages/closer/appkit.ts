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

export const appKit =
  typeof window !== 'undefined'
    ? createAppKit({
        adapters: [new Ethers5Adapter()],
        networks,
        projectId,
        metadata,
        allowUnsupportedChain: true,
        features: {
          email: false,
          socials: false,
        },
      })
    : null;

// Attach the handler immediately; the lazy runtime observes the same promise.
export const appKitReady = appKit?.ready() ?? Promise.resolve();
void appKitReady.catch(() => {});

export { celo as celoMainnet, celoSepolia };
