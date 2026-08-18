import { useEffect, useMemo, useState } from 'react';

import {
  LiFiWidgetLight,
  type WidgetLanguageKey,
  type WidgetLightChainTokenSelected,
  type WidgetLightConfig,
  WidgetLightEvent,
  useWidgetLightEvents,
} from '@lifi/widget-light';
import { useTranslations } from 'next-intl';

import { useReownLiFiEvmHandler } from '../../hooks/useReownLiFiEvmHandler';
import Modal from '../Modal';
import { ErrorMessage, Heading } from '../ui';

const CELO_MAINNET_CHAIN_ID = 42220;
const EURM_ADDRESS = '0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73';
const SUPPORTED_WIDGET_LANGUAGES = new Set([
  'en',
  'es',
  'fr',
  'de',
  'it',
  'pt',
  'ja',
  'ko',
  'zh',
  'hi',
  'bn',
  'th',
  'vi',
  'tr',
  'uk',
  'id',
  'pl',
]);

interface Props {
  account: string;
  locale?: string;
  previewMode?: boolean;
  toAmount: string;
  onClose: () => void;
  onConnect: () => void;
  onRouteStarted: () => void;
  onRouteCompleted: () => void;
  onRouteFailed: () => void;
  onSourceSelected: (selection: WidgetLightChainTokenSelected) => void;
}

const MultiCurrencyPaymentModal = ({
  account,
  locale,
  previewMode = false,
  toAmount,
  onClose,
  onConnect,
  onRouteStarted,
  onRouteCompleted,
  onRouteFailed,
  onSourceSelected,
}: Props) => {
  const t = useTranslations();
  const events = useWidgetLightEvents();
  const evmHandler = useReownLiFiEvmHandler();
  const [routeError, setRouteError] = useState<string | null>(null);

  const language = locale?.split('-')[0] || 'en';
  const widgetLanguage = SUPPORTED_WIDGET_LANGUAGES.has(language)
    ? language
    : 'en';

  const config = useMemo<WidgetLightConfig>(
    () => ({
      integrator:
        process.env.NEXT_PUBLIC_LIFI_INTEGRATOR || 'closer-token-sale',
      variant: 'compact',
      appearance: 'light',
      toChain: CELO_MAINNET_CHAIN_ID,
      toToken: EURM_ADDRESS,
      toAmount,
      toAddress: {
        address: account,
        chainType: 'EVM',
        name: t('token_sale_multi_currency_connected_wallet'),
      },
      chains: {
        types: { allow: ['EVM'] },
        to: { allow: [CELO_MAINNET_CHAIN_ID] },
      },
      tokens: {
        to: {
          allow: [
            {
              chainId: CELO_MAINNET_CHAIN_ID,
              address: EURM_ADDRESS,
            },
          ],
        },
      },
      routePriority: 'RECOMMENDED',
      disabledUI: {
        toAddress: true,
        toToken: true,
      },
      hiddenUI: {
        appearance: true,
        reverseTokensButton: true,
        toAddress: true,
      },
      defaultUI: {
        transactionDetailsExpanded: true,
      },
      sdkConfig: {
        routeOptions: {
          allowSwitchChain: true,
        },
      },
      languages: {
        default: widgetLanguage as WidgetLanguageKey,
      },
      buildUrl: false,
      keyPrefix: 'closer-token-sale',
    }),
    [account, t, toAmount, widgetLanguage],
  );

  useEffect(() => {
    const handleStarted = () => {
      setRouteError(null);
      onRouteStarted();
    };
    const handleCompleted = () => {
      setRouteError(null);
      onRouteCompleted();
    };
    const handleFailed = () => {
      setRouteError(t('token_sale_multi_currency_route_failed'));
      onRouteFailed();
    };

    events.on(WidgetLightEvent.RouteExecutionStarted, handleStarted);
    events.on(WidgetLightEvent.RouteExecutionCompleted, handleCompleted);
    events.on(WidgetLightEvent.RouteExecutionFailed, handleFailed);
    events.on(WidgetLightEvent.SourceChainTokenSelected, onSourceSelected);

    return () => {
      events.off(WidgetLightEvent.RouteExecutionStarted, handleStarted);
      events.off(WidgetLightEvent.RouteExecutionCompleted, handleCompleted);
      events.off(WidgetLightEvent.RouteExecutionFailed, handleFailed);
      events.off(WidgetLightEvent.SourceChainTokenSelected, onSourceSelected);
    };
  }, [
    events,
    onRouteCompleted,
    onRouteFailed,
    onRouteStarted,
    onSourceSelected,
    t,
  ]);

  return (
    <Modal
      closeModal={() => onClose()}
      className="sm:max-w-[540px] md:w-[540px]"
    >
      <Heading level={2} className="mb-2 pr-8">
        {t(
          previewMode
            ? 'token_sale_multi_currency_preview_modal_title'
            : 'token_sale_multi_currency_modal_title',
        )}
      </Heading>
      <p className="mb-1 text-sm text-gray-700">
        {t(
          previewMode
            ? 'token_sale_multi_currency_preview_modal_description'
            : 'token_sale_multi_currency_modal_description',
          { toAmount },
        )}
      </p>
      <p className="mb-4 text-xs text-gray-500">
        {t('token_sale_multi_currency_unused_balance')}
      </p>
      {previewMode && (
        <div
          className="mb-4 rounded-lg border border-amber-400 bg-amber-50 p-3 text-sm font-medium text-amber-800"
          role="alert"
        >
          {t('token_sale_multi_currency_preview_warning')}
        </div>
      )}
      {routeError && (
        <div className="mb-4">
          <ErrorMessage error={routeError} />
        </div>
      )}
      <LiFiWidgetLight
        config={config}
        handlers={[evmHandler]}
        iframeOrigin="https://widget.li.fi"
        onConnect={onConnect}
        className="min-h-[620px] w-full"
        title={t('token_sale_multi_currency_widget_title')}
      />
      <p className="mt-4 text-center text-xs text-gray-500">
        {t(
          previewMode
            ? 'token_sale_multi_currency_preview_steps'
            : 'token_sale_multi_currency_steps',
        )}
      </p>
    </Modal>
  );
};

export default MultiCurrencyPaymentModal;
