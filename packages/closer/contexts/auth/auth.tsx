import { useRouter } from 'next/router';

import {
  FC,
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import axios from 'axios';
import { useTranslations } from 'next-intl';

import { REFERRAL_ID_LOCAL_STORAGE_KEY } from '../../constants';
import { signInWithGooglePopup, signOutFirebase } from '../../firebaseLazy';
import api, {
  refreshTokensProactively,
  setOnSessionInvalid,
} from '../../utils/api';
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from '../../utils/authStorage';
import { parseMessageFromError } from '../../utils/common';
import { AuthenticationContext, User } from './types';

export const AuthContext = createContext<AuthenticationContext | null>(null);

export const AuthProvider: FC<PropsWithChildren> = ({ children }) => {
  const t = useTranslations();

  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [error, setErrorState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [hasSignedUp, setHasSignedUp] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  let errorTimeout: any;

  const setError = useCallback((msg: string | null) => {
    clearTimeout(errorTimeout);
    setErrorState(msg);
    errorTimeout = setTimeout(() => setErrorState(null), 7000);
  }, []);

  async function loadUserFromCookies() {
    try {
      const accessToken = getAccessToken();
      const refreshToken = getRefreshToken();
      if (accessToken || refreshToken) {
        const {
          data: { results: user },
        } = await api.get('/mine/user');
        if (user) {
          setUser(user);
        }
      } else {
        logOutGoogle();
      }
    } catch (err) {
      const message = parseMessageFromError(err);
      logOutGoogle();
      console.error('No auth cookie found:', message);
    } finally {
      setIsLoading(false);
    }
  }
  useEffect(() => {
    loadUserFromCookies();
  }, []);

  useEffect(() => {
    setOnSessionInvalid(() => {
      setUser(null);
      setError(t('auth_session_expired'));
      if (router.pathname !== '/login') {
        router.push('/login?session_expired=1');
      } else if (!router.query.session_expired) {
        router.replace('/login?session_expired=1', undefined, {
          shallow: true,
        });
      }
    });

    return () => {
      setOnSessionInvalid(null);
    };
  }, [router, t, setError]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const PROACTIVE_CHECK_INTERVAL_MS = 5 * 60 * 1000;
    const id = setInterval(async () => {
      const result = await refreshTokensProactively();
      if (result?.results) {
        setUser(result.results as User);
      }
    }, PROACTIVE_CHECK_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  const login = async ({
    email,
    password,
    isGoogle,
    idToken,
    turnstileToken,
  }: {
    email: string;
    password?: string;
    isGoogle?: boolean;
    idToken?: string | undefined;
    turnstileToken?: string | null;
  }) => {
    try {
      setIsLoading(true);

      let accessToken: string | undefined;
      let refreshToken: string | undefined;
      let user: User | undefined;
      if (isGoogle && idToken) {
        const { data } = await api.post('/login', {
          email,
          isGoogle,
          idToken,
          turnstileToken,
        });
        accessToken = data?.access_token ?? data?.token;
        refreshToken = data?.refresh_token ?? data?.refreshToken;
        user = data?.results;
      }
      if (!isGoogle) {
        const { data } = await api.post('/login', {
          email,
          password,
          turnstileToken,
        });
        accessToken = data?.access_token ?? data?.token;
        refreshToken = data?.refresh_token ?? data?.refreshToken;
        user = data?.results;
      }

      if (accessToken && user) {
        setAuthentification(user, accessToken, refreshToken);
        setUser(user);
        setError('');
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) {
          setError(t('auth_error_401_message'));
          return;
        }
        setError(err.response?.data?.error || err.message);
      } else {
        setError((err as Error).message);
      }
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const setAuthentification = (
    user: User | null | undefined,
    accessToken: string,
    refreshToken?: string,
  ) => {
    if (accessToken) {
      setTokens(accessToken, refreshToken);
      if (user) {
        setUser(user);
      }
    }
  };

  const signup = async (
    data: any,
    options?: { turnstileToken?: string | null },
  ) => {
    try {
      setHasSignedUp(false);
      const { data: resData } = await api.post('/signup', {
        ...data,
        turnstileToken: options?.turnstileToken,
      });
      const accessToken = resData?.access_token ?? resData?.token;
      const refreshToken = resData?.refresh_token ?? resData?.refreshToken;
      const userData = resData?.results;
      if (accessToken && userData) {
        setAuthentification(userData, accessToken, refreshToken);
        setUser(userData);
      }
      setError('');

      if (userData && userData._id) {
        setHasSignedUp(true);

        if (
          process.env.NEXT_PUBLIC_FEATURE_SIGNUP_SUBSCRIBE === 'true' &&
          data.email &&
          data.emailConsent !== false
        ) {
          try {
            const referrer =
              typeof window !== 'undefined'
                ? window.localStorage?.getItem('referrer')
                : null;
            const tags = [
              'signup',
              typeof window !== 'undefined' ? window.location?.pathname : null,
              referrer ? `ref:${referrer}` : null,
            ].filter(Boolean);
            await api.post('/subscribe', {
              email: data.email,
              screenname: data.screenname || '',
              tags,
              turnstileToken: options?.turnstileToken,
            });
          } catch (subscribeErr) {
            console.error(
              'Failed to subscribe email during signup:',
              subscribeErr,
            );
          }
        }

        return { result: 'signup' };
      } else {
        console.log('Invalid response', userData);
        return { result: null };
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || err.message);
      } else {
        setError((err as Error).message);
      }
      console.error(err);
      return { result: null };
    }
  };

  const completeRegistration = async (
    signup_token: string,
    data: unknown,
    onSuccess: () => void,
  ) => {
    try {
      const postData = Object.assign({ signup_token }, data);
      const { data: resData } = await api.post('/signup', postData);
      const accessToken = resData?.access_token ?? resData?.token;
      const refreshToken = resData?.refresh_token ?? resData?.refreshToken;
      const userData = resData?.results;
      if (accessToken) {
        setAuthentification(userData, accessToken, refreshToken);
        if (userData) setUser(userData);
        if (onSuccess) onSuccess();
      }
      return userData;
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || err.message);
      } else {
        setError((err as Error).message);
      }
    }
  };

  const updatePassword = async (
    reset_token: string,
    password: string,
    onSuccess: (status: string) => void,
  ) => {
    try {
      const {
        data: { status },
      } = await api.post('/set-password', { reset_token, password });
      onSuccess(status);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || err.message);
      } else {
        setError((err as Error).message);
      }
    }
  };

  const logOutGoogle = async () => {
    try {
      await signOutFirebase();
    } catch (error) {
      console.error('Error with Google sign out: ', error);
    }
  };

  const logout = async () => {
    clearTokens();
    setUser(null);

    await logOutGoogle();
    router.push('/');
  };

  const refetchUser = async () => {
    try {
      const {
        data: { results: user },
      } = await api.get('/mine/user');
      if (user) {
        setUser(user);
      }
    } catch (err) {
      const message = parseMessageFromError(err);
      setError(message);
    }
  };

  const authGoogle = async () => {
    try {
      setIsGoogleLoading(true);
      setError('');

      const googleRes = await signInWithGooglePopup();

      const res = await api.post('/check-user-exists', {
        email: googleRes.email,
      });
      const doesUserExist = res.data.doesUserExist;

      if (doesUserExist) {
        await login({
          email: googleRes.email as string,
          idToken: googleRes.idToken,
          isGoogle: true,
        });
        return { result: 'login' };
      }
      if (!doesUserExist) {
        const referredBy = localStorage.getItem(REFERRAL_ID_LOCAL_STORAGE_KEY);
        if (!googleRes.email) {
          setError('Please enter a valid email.');
          return { result: null };
        }
        try {
          const signupRes = await signup({
            isGoogle: true,
            idToken: googleRes.idToken,
            email: googleRes.email,
            screenname: googleRes.displayName,
            ...(referredBy && { referredBy }),
          });
          return signupRes;
        } catch (err: unknown) {
          setError(parseMessageFromError(err));
        } finally {
          setIsLoading(false);
        }
      }
      return { result: null };
    } catch (error) {
      console.error('Error signing in with Google', error);
      return { result: null };
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!user,
        user,
        login,
        setAuthentification,
        isLoading,
        logout,
        error,
        signup,
        completeRegistration,
        updatePassword,
        setUser,
        setError,
        loadUserFromCookies,
        refetchUser,
        hasSignedUp,
        isGoogleLoading,
        authGoogle,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
