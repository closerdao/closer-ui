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

import { AxiosError } from 'axios';
import {
  GoogleAuthProvider,
  getAuth,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import Cookies from 'js-cookie';
import { useTranslations } from 'next-intl';

import { REFERRAL_ID_LOCAL_STORAGE_KEY } from '../../constants';
import api from '../../utils/api';
import { parseMessageFromError } from '../../utils/common';
import { auth } from './../../firebaseConfig';
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
      const token = Cookies.get('access_token');
      if (token) {
        api.defaults.headers.Authorization = `Bearer ${token}`;
        const {
          data: { results: user },
        } = await api.get('/mine/user');
        if (user) {
          setUser(user);
        }
      }
      if (!token) {
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

  const login = async ({
    email,
    password,
    isGoogle,
    idToken,
  }: {
    email: string;
    password?: string;
    isGoogle?: boolean;
    idToken?: string | undefined;
  }) => {
    try {
      setIsLoading(true);

      let token;
      let user;
      if (isGoogle && idToken) {
        ({
          data: { access_token: token, results: user },
        } = await api.post('/login', {
          email,
          isGoogle,
          idToken,
        }));
      }
      if (!isGoogle) {
        ({
          data: { access_token: token, results: user },
        } = await api.post('/login', {
          email,
          password,
        }));
      }

      if (token && user) {
        setAuthentification(user, token);
        setUser(user);
        setError('');
      }
    } catch (err) {
      if ((err as AxiosError).response?.status === 401) {
        setError(t('auth_error_401_message'));
        return;
      }
      setError(
        (err as AxiosError).response?.data?.error || (err as Error).message,
      );
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const setAuthentification = async (user: User, token: string) => {
    if (token) {
      api.defaults.headers.Authorization = `Bearer ${token}`;
      Cookies.set('access_token', token, {
        expires: 60,
        sameSite: 'strict',
        secure: true,
      });
      if (user) {
        setUser(user);
      }
    }
  };

  const signup = async (data: any) => {
    try {
      setHasSignedUp(false);
      const {
        data: { access_token: token, results: userData },
      } = await api.post('/signup', data);
      if (token && userData) {
        setAuthentification(userData, token);
        setUser(userData);
      }
      setError('');

      if (userData && userData._id) {
        setHasSignedUp(true);
        return { result: 'signup' };
      } else {
        console.log('Invalid response', userData);
        return { result: null };
      }
    } catch (err) {
      setError(
        (err as AxiosError).response?.data?.error || (err as Error).message,
      );
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
      const {
        data: { access_token: token, results: userData },
      } = await api.post('/signup', postData);
      if (token) {
        setAuthentification(userData, token);
        if (userData) setUser(userData);
        if (onSuccess) onSuccess();
      }
      return userData;
    } catch (err) {
      setError(
        (err as AxiosError).response?.data?.error || (err as Error).message,
      );
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
      setError(
        (err as AxiosError).response?.data?.error || (err as Error).message,
      );
    }
  };

  const logOutGoogle = async () => {
    try {
      const auth = getAuth();
      await signOut(auth);
    } catch (error) {
      console.error('Error with Google sign out: ', error);
    }
  };

  const logout = async () => {
    Cookies.remove('access_token');
    setUser(null);
    delete api.defaults.headers.Authorization;

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
      const provider = new GoogleAuthProvider();

      const googleRes = await signInWithPopup(auth, provider);
      const idToken = await googleRes.user.getIdToken();

      const res = await api.post('/check-user-exists', {
        email: googleRes.user.email,
      });
      const doesUserExist = res.data.doesUserExist;

      if (doesUserExist) {
        await login({
          email: googleRes.user.email as string,
          idToken,
          isGoogle: true,
        });
        return { result: 'login' };
      }
      if (!doesUserExist) {
        const referredBy = localStorage.getItem(REFERRAL_ID_LOCAL_STORAGE_KEY);
        if (!googleRes.user.email) {
          setError('Please enter a valid email.');
          return { result: null };
        }
        try {
          const signupRes = await signup({
            isGoogle: true,
            idToken,
            email: googleRes.user.email,
            screenname: googleRes.user.displayName,
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
