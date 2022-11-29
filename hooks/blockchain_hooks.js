import { useEffect, useState } from 'react';

import { useWeb3React } from '@web3-react/core';

export function useEagerConnect(connector) {
  const { activate, active } = useWeb3React();

  const [tried, setTried] = useState(false);

  useEffect(() => {
    connector.isAuthorized().then((isAuthorized) => {
      if (isAuthorized) {
        activate(connector, undefined, true).catch(() => {
          setTried(true);
        });
      } else {
        setTried(true);
      }
    });
  }, []); // intentionally only running on mount (make sure it's only mounted once :))

  // if the connection worked, wait until we get confirmation of that to flip the flag
  useEffect(() => {
    if (!tried && active) {
      setTried(true);
    }
  }, [tried, active]);

  return tried;
}

export function useInactiveListener(suppress = false, connector) {
  const { active, error, activate } = useWeb3React();

  useEffect(() => {
    const { ethereum } = window;
    if (ethereum && ethereum.on && !active && !error && !suppress) {
      const handleConnect = () => {
        console.log('Handling "connect" event');
        activate(connector);
      };
      const handleChainChanged = (chainId) => {
        console.log('Handling "chainChanged" event with payload', chainId);
        activate(connector);
      };
      const handleAccountsChanged = (accounts) => {
        console.log('Handling "accountsChanged" event with payload', accounts);
        if (accounts.length > 0) {
          activate(connector);
        }
      };
      const handleNetworkChanged = (networkId) => {
        console.log('Handling "networkChanged" event with payload', networkId);
        activate(connector);
      };

      ethereum.on('connect', handleConnect);
      ethereum.on('chainChanged', handleChainChanged);
      ethereum.on('accountsChanged', handleAccountsChanged);
      ethereum.on('networkChanged', handleNetworkChanged);

      return () => {
        if (ethereum.removeListener) {
          ethereum.removeListener('connect', handleConnect);
          ethereum.removeListener('chainChanged', handleChainChanged);
          ethereum.removeListener('accountsChanged', handleAccountsChanged);
          ethereum.removeListener('networkChanged', handleNetworkChanged);
        }
      };
    }
  }, [active, error, suppress, activate]);
}
