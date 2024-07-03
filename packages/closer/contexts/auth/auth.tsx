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
import Cookies from 'js-cookie';

import api from '../../utils/api';
import { parseMessageFromError } from '../../utils/common';
import { __ } from '../../utils/helpers';
import { AuthenticationContext, User } from './types';

export const AuthContext = createContext<AuthenticationContext | null>(null);

export const AuthProvider: FC<PropsWithChildren> = ({ children }) => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [error, setErrorState] = useState<string | null>(null);
  const [isLoading, setLoading] = useState<boolean>(true);
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
      setLoading(false);
    } catch (err) {
      const message = parseMessageFromError(err);
      setError(message);
    }
  }
  useEffect(() => {
    loadUserFromCookies();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const {
        data: { access_token: token, results: user },
      } = await api.post('/login', {
        email,
        password,
      });
      if (token && user) {
        setAuthentification(user, token);
        setUser(user);
        setError('');
      }
    } catch (err) {
      if ((err as AxiosError).response?.status === 401) {
        setError(__('auth_error_401_message'));
        return;
      }
      setError(
        (err as AxiosError).response?.data?.error || (err as Error).message,
      );
      console.error(err);
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

  const signup = async (data: unknown): Promise<User | undefined> => {
    try {
      const {
        data: { access_token: token, results: userData },
      } = await api.post('/signup', data);
      if (token && userData) {
        setAuthentification(userData, token);
        setUser(userData);
      }
      setError('');
      return userData;
    } catch (err) {
      setError(
        (err as AxiosError).response?.data?.error || (err as Error).message,
      );
      console.error(err);
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

  const logout = () => {
    Cookies.remove('access_token');
    setUser(null);
    delete api.defaults.headers.Authorization;
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
