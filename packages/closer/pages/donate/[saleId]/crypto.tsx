import Head from 'next/head';
import { useRouter } from 'next/router';

import { useContext, useEffect, useState } from 'react';

import { useTranslations } from 'next-intl';

import Wallet from '../../../components/Wallet';
import { BackButton, Button, ErrorMessage, Heading, Spinner } from '../../../components/ui';
import { DEFAULT_CURRENCY } from '../../../constants';
import { useAuth } from '../../../contexts/auth';
import { WalletDispatch, WalletState } from '../../../contexts/wallet';
import { useConfig } from '../../../hooks/useConfig';
import api from '../../../utils/api';
import { getCachedConfig } from '../../../utils/cachedConfig.helpers';
import { parseMessageFromError } from '../../../utils/common';
import { logMetricIfAuthenticated } from '../../../utils/metrics';
import {
  resolveDonationStablecoinAddress,
  transferDonationStablecoin,
} from '../../../utils/donationStablecoinTransfer';
import { readDonationSession, type StoredDonationCrypto } from '../../../utils/donationSessionStorage';
import { priceFormat } from '../../../utils/helpers';

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    return;
  }
}

function DonateCryptoPage() {
  const t = useTranslations();
  const router = useRouter();
  const { saleId } = router.query;
  const id = typeof saleId === 'string' ? saleId : '';
  const { isAuthenticated, isLoading: isAuthLoading, user } = useAuth();
  const config = useConfig();
  const generalConfig = getCachedConfig('general');
  const platformName = generalConfig?.platformName || config.platformName;

  const {
    library,
    account,
    isWalletConnected,
    isCorrectNetwork,
  } = useContext(WalletState);
  const { connectWallet, switchNetwork, updateWalletBalance } = useContext(WalletDispatch);

  const [session, setSession] = useState<StoredDonationCrypto | null | 'loading' | 'missing'>('loading');
  const [ctaLoading, setCtaLoading] = useState(false);
  const [cryptoError, setCryptoError] = useState<string | null>(null);

  const isWalletEnabled =
    process.env.NEXT_PUBLIC_FEATURE_WEB3_WALLET === 'true';

  useEffect(() => {
    if (!router.isReady || isAuthLoading) return;
    if (!isAuthenticated) {
      router.push(`/login?back=${encodeURIComponent(router.asPath)}`);
      return;
    }
    if (!id) {
      setSession('missing');
      return;
    }
    const stored = readDonationSession(id);
    if (!stored || stored.kind !== 'crypto') {
      setSession('missing');
      return;
    }
    setSession(stored);
  }, [router, router.isReady, router.asPath, id, isAuthenticated, isAuthLoading]);

  const cryptoPayload =
    session && typeof session === 'object' && session.kind === 'crypto' ? session : null;
  const amount = cryptoPayload?.amount ?? 0;
  const cryptoBlock = cryptoPayload?.result;
  const cryptoReady =
    Boolean(cryptoBlock?.treasuryAddress && String(cryptoBlock.treasuryAddress).trim());
  const tokenAddress = cryptoBlock
    ? resolveDonationStablecoinAddress(cryptoBlock.stablecoin, config)
    : null;

  const canPayWithWallet =
    isWalletEnabled &&
    cryptoReady &&
    Boolean(tokenAddress) &&
    Boolean(library) &&
    Boolean(account) &&
    isWalletConnected &&
    isCorrectNetwork;

  const handlePayWithWallet = async () => {
    if (!cryptoBlock || !tokenAddress || !library) return;
    setCryptoError(null);
    setCtaLoading(true);
    try {
      const { txHash } = await transferDonationStablecoin({
        library,
        tokenAddress,
        to: cryptoBlock.treasuryAddress,
        humanAmount: cryptoBlock.expectedAmount,
      });
      await api.post(`/sale/${cryptoBlock.saleId}/confirm-crypto`, {
        txHash,
      });
      if (typeof updateWalletBalance === 'function') {
        updateWalletBalance();
      }
      void logMetricIfAuthenticated(user, {
        event: 'donation-payment-success',
        value: 'donation',
        point: amount,
      });
      router.push(`/sale/${encodeURIComponent(cryptoBlock.saleId)}`);
    } catch (err: unknown) {
      void logMetricIfAuthenticated(user, {
        event: 'donation-payment-error',
        value: 'donation',
        point: amount,
      });
      setCryptoError(parseMessageFromError(err));
    } finally {
      setCtaLoading(false);
    }
  };

  const handleWalletCta = async () => {
    setCryptoError(null);
    setCtaLoading(true);
    try {
      if (!isWalletConnected) {
        await connectWallet();
        return;
      }
      if (!isCorrectNetwork) {
        await switchNetwork();
      }
    } catch (err: unknown) {
      setCryptoError(parseMessageFromError(err));
    } finally {
      setCtaLoading(false);
    }
  };

  if (!router.isReady || isAuthLoading || session === 'loading') {
    return (
      <div className="w-full max-w-screen-sm mx-auto p-8 flex justify-center">
        <Spinner />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (session === 'missing' || !cryptoBlock) {
    return (
      <div className="w-full max-w-screen-sm mx-auto p-8 flex flex-col gap-4">
        <Head>
          <title>{`${t('donate_page_title')} - ${platformName}`}</title>
        </Head>
        <ErrorMessage error={t('donate_session_missing')} />
        <Button onClick={() => router.push('/donate')}>{t('donate_change_donation')}</Button>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{`${t('donate_crypto_head_title')} - ${platformName}`}</title>
      </Head>

      <div className="w-full max-w-screen-sm mx-auto p-8 flex flex-col gap-6">
        <BackButton
          handleClick={() => router.push(`/donate?amount=${amount}&method=crypto`)}
        >
          {t('buttons_back')}
        </BackButton>

        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          {t('donate_step_label', { current: 2, total: 2 })}
        </p>
        <Heading level={1} className="mb-0">
          {t('donate_crypto_head_title')}
        </Heading>
        <p className="text-sm text-gray-700">
          {t('donate_crypto_send_exact', {
            amount: priceFormat(cryptoBlock.expectedAmount, DEFAULT_CURRENCY),
            token: cryptoBlock.stablecoin,
          })}
        </p>

        {!cryptoReady ? (
          <ErrorMessage error={t('donate_crypto_config_error')} />
        ) : !isWalletEnabled ? (
          <ErrorMessage error={t('donate_crypto_wallet_disabled')} />
        ) : !tokenAddress ? (
          <ErrorMessage error={t('donate_crypto_unsupported_token', { token: cryptoBlock.stablecoin })} />
        ) : (
          <>
            <div className="border border-gray-100 rounded-xl px-4 py-3 bg-white">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                {t('donate_crypto_recipient')}
              </span>
              <div className="flex flex-wrap items-center justify-between gap-2 mt-1">
                <span className="text-sm font-mono text-gray-900 break-all">
                  {cryptoBlock.treasuryAddress}
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(cryptoBlock.treasuryAddress)}
                  className="text-xs text-accent font-medium shrink-0"
                >
                  {t('donate_copy')}
                </button>
              </div>
            </div>

            <p className="text-sm text-gray-600">{t('donate_crypto_wallet_hint')}</p>

            <div className="my-2">
              <Wallet />
            </div>

            {cryptoError && <ErrorMessage error={cryptoError} />}

            {!canPayWithWallet ? (
              <Button onClick={handleWalletCta} isLoading={ctaLoading} isEnabled={!ctaLoading}>
                {!isWalletConnected
                  ? t('donate_crypto_connect_wallet')
                  : !isCorrectNetwork
                    ? t('donate_crypto_switch_network')
                    : t('donate_crypto_prepare_wallet')}
              </Button>
            ) : (
              <Button onClick={handlePayWithWallet} isLoading={ctaLoading} isEnabled={!ctaLoading}>
                {ctaLoading ? t('checkout_processing_payment') : t('donate_crypto_pay_wallet')}
              </Button>
            )}
          </>
        )}
      </div>
    </>
  );
}

export default DonateCryptoPage;
