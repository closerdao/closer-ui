import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import {
  CSSProperties,
  FormEvent,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import GoogleButton from '../../components/GoogleButton';
import TurnstileWidget from '../../components/TurnstileWidget';
import WalletConnectionStatus from '../../components/WalletConnectionStatus';
import { Card, ErrorMessage, Heading, Input } from '../../components/ui';
import Button from '../../components/ui/Button';

import { Sparkle } from 'lucide-react';
import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';
import { event as gaEvent } from 'nextjs-google-analytics';

import { useAuth } from '../../contexts/auth';
import { useNewsletter } from '../../contexts/newsletter';
import { WalletDispatch, WalletState } from '../../contexts/wallet';
import { walletLogin, walletNonce } from '../../utils/auth';
import { getRedirectUrl } from '../../utils/auth.helpers';
import { parseMessageFromError } from '../../utils/common';
import {
  createTurnstileHandlers,
  isTurnstileSubmitEnabled,
} from '../../utils/turnstile.helpers';

const SPARKLE_ANIMATION = 'sparkle-fade-move 2.2s ease-in-out infinite';

const SparkleTwinkle = ({
  className,
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) => (
  <span
    className={`pointer-events-none ${className ?? ''}`}
    style={{ animation: SPARKLE_ANIMATION, ...style }}
    aria-hidden
  >
    <Sparkle className="w-full h-full" strokeWidth={1.5} />
  </span>
);

const Login = () => {
  const t = useTranslations();
  const isWeb3WalletEnabled =
    process.env.NEXT_PUBLIC_FEATURE_WEB3_WALLET === 'true';
  const { signMessage, connectWallet, getConnectedAccount } =
    useContext(WalletDispatch);
  const walletState = useContext(WalletState);
  const { initializationStatus, isWalletConnecting } = walletState;
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  // Safely use newsletter context
  let setHideFooterNewsletter: ((hide: boolean) => void) | undefined;
  try {
    const newsletterContext = useNewsletter();
    setHideFooterNewsletter = newsletterContext.setHideFooterNewsletter;
  } catch (error) {
    // Context not available during SSR, that's okay
    setHideFooterNewsletter = undefined;
  }

  const router = useRouter();
  const {
    isAuthenticated,
    user,
    login,
    setAuthentification,
    error,
    setError,
    isLoading,
    hasSignedUp,
    isGoogleLoading,
    authGoogle,
  } = useAuth();
  const { back, source, start, end, adults, useTokens, eventId, volunteerId } =
    router.query || {};

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isWeb3Loading, setWeb3Loading] = useState(false);
  const [web3Error, setWeb3Error] = useState<string | null>(null);
  const walletFlowInProgressRef = useRef(false);

  const mounted = useRef(false);
  const currentUserId = useRef(user?._id);
  currentUserId.current = user?._id;
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated || hasSignedUp) return;
    const redirectUrl = getRedirectUrl({
      back,
      source,
      start,
      end,
      adults,
      useTokens,
      eventId,
      volunteerId,
      hasSubscription: Boolean(user?.subscription?.plan),
    });
    void router.push(redirectUrl);
  }, [
    isAuthenticated,
    hasSignedUp,
    back,
    source,
    start,
    end,
    adults,
    useTokens,
    eventId,
    volunteerId,
    user,
    router,
  ]);

  const redirectToSettings = () => {
    if (source) {
      router.push(
        `${decodeURIComponent(back as string)}&source=${source}` || '/settings',
      );
      return;
    }
    router.push(back ? `${decodeURIComponent(back as string)}` : '/settings');
  };

  useEffect(() => {
    if (isAuthenticated && hasSignedUp) {
      redirectToSettings();
    }
  }, [isAuthenticated, hasSignedUp, back]);

  useEffect(() => {
    const localEmail = localStorage.getItem('email');
    if (localEmail) {
      setEmail(localEmail);
    }
  }, []);

  useEffect(() => {
    if (setHideFooterNewsletter) {
      setHideFooterNewsletter(true);
      return () => {
        if (setHideFooterNewsletter) {
          setHideFooterNewsletter(false);
        }
      };
    }
  }, [setHideFooterNewsletter]);

  const signInWithWallet = async (walletAddress: string) => {
    const initialUserId = currentUserId.current;
    const isCurrent = () =>
      mounted.current &&
      currentUserId.current === initialUserId &&
      getConnectedAccount()?.toLowerCase() === walletAddress.toLowerCase();
    setWeb3Error(null);
    setWeb3Loading(true);
    try {
      const { nonce } = await walletNonce(walletAddress);
      if (!isCurrent()) return;
      const message = `Signing in with code ${nonce}`;
      const signedMessage = await signMessage(message, walletAddress);
      if (signedMessage && isCurrent()) {
        const data = await walletLogin({
          signedMessage,
          walletAddress,
          message,
        });
        const accessToken = data?.access_token;
        const refreshToken = data?.refresh_token;
        const user = data?.results;
        if (isCurrent()) setAuthentification(user, accessToken, refreshToken);
      } else {
        setWeb3Error(t('wallet_signature_failed'));
      }
    } catch (e: any) {
      setWeb3Error(parseMessageFromError(e));
    } finally {
      setWeb3Loading(false);
    }
  };

  const clearSessionExpiredFromUrl = () => {
    if (router.query.session_expired) {
      const q = { ...router.query };
      delete q.session_expired;
      setError(null);
      router.replace({ pathname: '/login', query: q }, undefined, {
        shallow: true,
      });
    }
  };

  const walletConnectAndSignInFlow = async (event: FormEvent) => {
    event.preventDefault();
    if (walletFlowInProgressRef.current || isWeb3Loading) {
      return;
    }
    clearSessionExpiredFromUrl();
    walletFlowInProgressRef.current = true;
    setWeb3Error(null);
    try {
      const connectedAccount = await connectWallet(); // Get account directly from connectWallet
      if (connectedAccount && mounted.current) {
        // The account from WalletState might not be updated yet, so use connectedAccount
        await signInWithWallet(connectedAccount);
      }
    } catch (error) {
      setWeb3Error(parseMessageFromError(error));
    } finally {
      walletFlowInProgressRef.current = false;
    }
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    clearSessionExpiredFromUrl();
    await login({ email, password, turnstileToken });
  };

  const authUserWithGoogle = async () => {
    const authRes = await authGoogle({ turnstileToken });
    if (authRes.result === 'signup') {
      gaEvent('sign_up', {
        category: 'signing',
        // label: 'success',
      });
    }
  };

  return (
    <>
      <Head>
        <title>{t('login_title')}</title>
      </Head>
      {/* Matches the signup panel — see the note there on `accent-alt-light`. */}
      <main className="flex flex-col items-center w-full min-w-0 px-0 rounded-2xl bg-accent-alt-light min-h-[80vh]">
        <section className="w-full max-w-md flex flex-col gap-6 py-10 sm:py-16 px-4 sm:px-6">
          <Heading
            level={1}
            className="uppercase text-4xl sm:text-5xl font-extrabold"
          >
            {t('login_title')}
          </Heading>
          {!back && (
            <p className="text-sm text-gray-500 -mt-2">
              {t('login_description')}
            </p>
          )}

          {back && (
            <p className="text-sm text-gray-600">
              {t('log_in_redirect_message')}{' '}
              <strong className="text-gray-900">
                {typeof back === 'string' &&
                  back.substring(back[0] === '/' ? 1 : 0).substring(0, 40)}
              </strong>
              {typeof back === 'string' && back.length > 40 && '...'}{' '}
              {t('log_in_redirect_message_page')}
            </p>
          )}

          <Card className="w-full bg-background p-5 sm:p-7">
            {(router.query.session_expired
              ? t('auth_session_expired')
              : error) && (
              <ErrorMessage
                error={
                  router.query.session_expired
                    ? t('auth_session_expired')
                    : error!
                }
              />
            )}
            <div className="flex flex-col gap-4">
              <form onSubmit={onSubmit} className="w-full flex flex-col gap-4">
                <Input
                  label={t('login_email')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('login_email_placeholder')}
                />
                <Input
                  label={t('login_password')}
                  value={password}
                  type="password"
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('login_password_placeholder')}
                />

                <TurnstileWidget
                  action="login"
                  {...createTurnstileHandlers(setTurnstileToken)}
                />

                <div className="flex flex-col justify-between items-center gap-3 sm:flex-row">
                  <div className="flex flex-col gap-3 w-full sm:flex-row py-2">
                    <Button
                      isEnabled={
                        !isWeb3Loading &&
                        !isLoading &&
                        isTurnstileSubmitEnabled(turnstileToken)
                      }
                      isLoading={isLoading}
                      className="justify-center normal-case"
                    >
                      {t('login_submit')}
                    </Button>
                  </div>
                </div>
              </form>

              {isWeb3WalletEnabled && (
                <>
                  <div className="relative py-1">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="bg-background px-2 text-gray-500">
                        {t('or')}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {web3Error && <ErrorMessage error={web3Error} />}
                    <div className="group/wallet relative">
                      <Button
                        isEnabled={
                          initializationStatus === 'ready' &&
                          !isWalletConnecting &&
                          !isWeb3Loading &&
                          !isLoading
                        }
                        isLoading={isWeb3Loading}
                        variant="secondary"
                        className="w-full justify-center normal-case"
                        onClick={walletConnectAndSignInFlow}
                      >
                        {t('blockchain_sign_in_with_wallet')}
                      </Button>
                      {initializationStatus === 'ready' && (
                        <>
                          <style>{`
                            @keyframes sparkle-fade-move {
                              0%, 100% { opacity: 0.15; transform: translate(0, 0); }
                              50% { opacity: 1; transform: translate(0, -5px); }
                            }
                          `}</style>
                          <SparkleTwinkle
                            className="absolute top-1.5 left-6 w-3 h-3 text-accent transition-transform duration-150 group-hover/wallet:scale-105"
                            style={{ animationDelay: '0ms' }}
                          />
                          <SparkleTwinkle
                            className="absolute top-2 right-10 w-2.5 h-2.5 text-amber-400 transition-transform duration-150 group-hover/wallet:scale-105"
                            style={{ animationDelay: '400ms' }}
                          />
                          <SparkleTwinkle
                            className="absolute bottom-1.5 left-12 w-2 h-2 text-accent transition-transform duration-150 group-hover/wallet:scale-105"
                            style={{ animationDelay: '800ms' }}
                          />
                          <SparkleTwinkle
                            className="absolute top-1 right-16 w-2.5 h-2.5 text-amber-400 transition-transform duration-150 group-hover/wallet:scale-105"
                            style={{ animationDelay: '1200ms' }}
                          />
                          <SparkleTwinkle
                            className="absolute bottom-2 right-6 w-2 h-2 text-accent transition-transform duration-150 group-hover/wallet:scale-105"
                            style={{ animationDelay: '1600ms' }}
                          />
                        </>
                      )}
                    </div>
                    <WalletConnectionStatus />
                    <p className="text-xs text-gray-500 text-center">
                      {t('wallet_mobile_login_hint')}
                    </p>
                  </div>
                </>
              )}

              {process.env.NEXT_PUBLIC_FIREBASE_CONFIG && (
                <GoogleButton
                  isLoading={isGoogleLoading}
                  isEnabled={isTurnstileSubmitEnabled(turnstileToken)}
                  onClick={authUserWithGoogle}
                />
              )}
            </div>
          </Card>
          <div className="text-center text-sm text-gray-600 flex flex-col gap-1">
            <span>
              {t('login_no_account')}{' '}
              <Link
                className="text-accent underline font-medium hover:no-underline"
                href={`/signup${
                  back ? `?back=${encodeURIComponent(back as string)}` : ''
                }`}
              >
                {t('signup_form_create')}
              </Link>
            </span>
            <Link
              href="/login/forgot-password"
              as="/login/forgot-password"
              className="text-accent underline font-medium hover:no-underline"
            >
              {t('login_link_forgotten_password')}
            </Link>
          </div>
        </section>
      </main>
    </>
  );
};

Login.getInitialProps = async (context: NextPageContext) => {
  try {
    return {};
  } catch (err: unknown) {
    return {};
  }
};

export default Login;
