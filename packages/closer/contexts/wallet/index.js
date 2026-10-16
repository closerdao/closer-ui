import { Component, useCallback, useEffect, useState } from 'react';

import { trackEvent } from '../../utils/posthog';
import { WalletFlowError } from './connection';
import {
  WalletDispatchContext,
  WalletStateContext,
  defaultWalletDispatch,
  defaultWalletState,
} from './hooks';

export const WalletState = WalletStateContext;
export const WalletDispatch = WalletDispatchContext;

class RuntimeBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export const WalletProvider = ({ children }) => {
  const enabled = process.env.NEXT_PUBLIC_FEATURE_WEB3_WALLET === 'true';
  const [Runtime, setRuntime] = useState(null);
  const [value, setValue] = useState(() => ({
    state: {
      ...defaultWalletState,
      initializationStatus: enabled ? 'loading' : 'disabled',
      isWalletInitializing: enabled,
    },
    dispatch: defaultWalletDispatch,
  }));
  const publish = useCallback(
    (state, dispatch) => setValue({ state, dispatch }),
    [],
  );
  const onError = useCallback(() => {
    trackEvent('wallet_initialization_error', {
      stage: 'initialization',
      sdkVersion: '1.8.24',
    });
    setValue((previous) => ({
      ...previous,
      state: {
        ...previous.state,
        initializationStatus: 'error',
        isWalletInitializing: false,
        error: new WalletFlowError('initialization_failed'),
      },
    }));
  }, []);

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    const timer = setTimeout(() => {
      if (active)
        setValue((previous) =>
          previous.state.initializationStatus === 'loading'
            ? {
                ...previous,
                state: { ...previous.state, initializationSlow: true },
              }
            : previous,
        );
    }, 30000);
    import('./WalletProviderWithReown')
      .then(async (module) => {
        await module.walletRuntimeReady;
        if (active) setRuntime(() => module.WalletProviderWithReown);
      })
      .catch(() => {
        if (active) onError();
      });
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [enabled, onError]);

  return (
    <WalletStateContext.Provider value={value.state}>
      <WalletDispatchContext.Provider value={value.dispatch}>
        <RuntimeBoundary onError={onError}>
          {Runtime ? <Runtime publish={publish} /> : null}
        </RuntimeBoundary>
        {children}
      </WalletDispatchContext.Provider>
    </WalletStateContext.Provider>
  );
};
