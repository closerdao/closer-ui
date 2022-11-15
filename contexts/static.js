import React, { createContext, useContext, useEffect, useState } from 'react';

import dayjs from 'dayjs';

import config from '../config';
import PageNotAllowed from '../pages/401';
import api, { formatSearch } from '../utils/api';

const StaticContext = createContext({});

export const StaticProvider = ({ children }) => {
  const [cache, setCache] = useState({});
  const [lastFetch, setLastFetch] = useState(null);
  const [staticLoadError, setError] = useState(null);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    getStaticCache();
    const refreshInterval = setInterval(getStaticCache, 60000);
    return () => clearInterval(refreshInterval);
  }, []);

  const getStaticCache = async () => {
    if (lastFetch < Date.now() - config.CACHE_DURATION) {
      return await getStaticContent();
    }
    return cache;
  };

  const getStaticContent = async (signup_token, password, onSuccess) => {
    try {
      setCache({});

      return newCache;
    } catch (err) {
      const error = err.response?.data?.error || err.message;
      console.log('Error loading cache:', error);
      setError(error);
    }
  };

  return (
    <StaticContext.Provider
      value={{
        cache,
        getStaticCache,
        staticLoadError,
      }}
    >
      {children}
    </StaticContext.Provider>
  );
};

export const useStatic = () => useContext(StaticContext);
