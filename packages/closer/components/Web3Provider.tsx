import { ReactNode, useState } from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';
import { wagmiConfig } from '../contexts/wallet';
import { WalletProvider } from '../contexts/wallet';

interface Web3ProviderProps {
  children: ReactNode;
}

const Web3Provider = ({ children }: Web3ProviderProps) => {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: '#7b3fe4',
            borderRadius: 'medium',
          })}
        >
          <WalletProvider>{children}</WalletProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};

export default Web3Provider;
