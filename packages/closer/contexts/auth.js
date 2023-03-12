import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import Cookies from 'js-cookie';

import PageNotAllowed from '../pages/401';
import api from '../utils/api';
import { __ } from '../utils/helpers';

export const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [error, setErrorState] = useState(null);
  const [isLoading, setLoading] = useState(true);
  let errorTimeout = null;

  const setError = useCallback((msg) => {
    clearTimeout(errorTimeout);
    setErrorState(msg);
    errorTimeout = setTimeout(() => setErrorState(null), 5000);
  }, []);

  useEffect(() => {
    async function loadUserFromCookies() {
      try {
        const token = Cookies.get('token');
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
        setError(err.message);
      }
    }
    console.log('loading user from cookies', Cookies.get('token'));
    loadUserFromCookies();
  }, []);

  const login = async (email, password) => {
    try {
      const {
        data: { access_token: token, results: user },
      } = await api.post('/login', {
        email,
        password,
      });
      if (token) {
        Cookies.set('token', token, { expires: 60 });
        if (user) {
          setUser(user);
        }
      }
      setError('');
    } catch (err) {
      if (err.response?.status === 401) {
        setError(__('auth_error_401_message'));
        return;
      }
      setError(err.response?.data?.error || err.message);
      console.error(err);
    }
  };

  const setAuthentification = async (user, token) => {
    if (token) {
      Cookies.set('token', token, { expires: 60 });
      if (user) {
        setUser(user);
      }
    }
  };

  const signup = async (data) => {
    try {
      const {
        data: { access_token: token, results: userData },
      } = await api.post('/signup', data);
      if (token && userData) {
        Cookies.set('token', token, { expires: 60 });
        api.defaults.headers.Authorization = `Bearer ${token}`;
        setUser(userData);
      }
      setError('');
      return userData;
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      console.error(err);
    }
  };

  const completeRegistration = async (signup_token, data, onSuccess) => {
    try {
      const postData = Object.assign({ signup_token }, data);
      const {
        data: { access_token: token, results: userData },
      } = await api.post('/signup', postData);
      if (token) {
        Cookies.set('token', token, { expires: 60 });
        if (userData) setUser(userData);
        if (onSuccess) onSuccess();
      }
      return userData;
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  };

  const updatePassword = async (reset_token, password, onSuccess) => {
    try {
      const {
        data: { status },
      } = await api.post('/set-password', { reset_token, password });
      onSuccess(status);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  };

  const logout = () => {
    Cookies.remove('token');
    setUser(null);
    delete api.defaults.headers.Authorization;
    window.location.pathname = '/';
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export const ProtectRoute = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  if (isLoading || !isAuthenticated || !user) {
    return <PageNotAllowed />;
  }
  return children;
};
