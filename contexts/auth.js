import Router, { useRouter } from 'next/router';

import React, { createContext, useContext, useEffect, useState } from 'react';

import Cookies from 'js-cookie';

import config from '../config';
import PageNotAllowed from '../pages/401';
import api from '../utils/api';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [error, setErrorState] = useState(null);
  const [isLoading, setLoading] = useState(true);
  let errorTimeout = null;
  const setError = (msg) => {
    clearTimeout(errorTimeout);
    setErrorState(msg);
    errorTimeout = setTimeout(() => setErrorState(null), 5000);
  };

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
    loadUserFromCookies();
  }, []);

  const login = async (email, password) => {
    try {
      const {
        data: { access_token: token, results: user },
      } = await api.post('/login', {
        email,
        password
      });
      if (token) {
        Cookies.set('token', token, { expires: 60 });
        if (user) {
          setUser(user);
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message);
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
        setUser(userData);
      }
      return userData;
    } catch (err) {
      throw new Error(err.response?.data?.error || err.message);
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

  const logout = (email, password) => {
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
