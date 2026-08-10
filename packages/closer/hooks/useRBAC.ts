import { useCallback, useEffect, useMemo, useState } from 'react';

import rbacDefaultConfig from '../constants/rbac';
import { useAuth } from '../contexts/auth';
import { useConfig } from '../hooks/useConfig';
import api from '../utils/api';

const deepMerge = (target: any, source: any): any => {
  const output = { ...target };
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {
      if (isObject(source[key]) && !Array.isArray(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  return output;
};

const isObject = (item: any): boolean => {
  return item && typeof item === 'object' && !Array.isArray(item);
};

let liveRbacInflight: Promise<Record<string, unknown> | null> | null = null;

function fetchLiveRbacOnce(): Promise<Record<string, unknown> | null> {
  if (typeof window === 'undefined') {
    return Promise.resolve(null);
  }
  if (!liveRbacInflight) {
    liveRbacInflight = api
      .get('/config/rbac')
      .then((res) => {
        const v = res.data?.results?.value;
        return v && typeof v === 'object' ? (v as Record<string, unknown>) : null;
      })
      .catch(() => null);
  }
  return liveRbacInflight;
}

export const useRBAC = () => {
  const { user } = useAuth();
  const contextConfig = useConfig();
  const snapshotRbac =
    contextConfig?.rbacConfig ?? contextConfig?.rbac ?? null;

  const [liveRbacOverlay, setLiveRbacOverlay] = useState<
    Record<string, unknown> | null
  >(null);
  const [rbacLiveRevision, setRbacLiveRevision] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetchLiveRbacOnce().then((live) => {
      if (!cancelled && live) {
        setLiveRbacOverlay(live);
      }
      if (!cancelled) {
        setRbacLiveRevision((n) => n + 1);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const config = useMemo(() => {
    let merged = deepMerge({}, rbacDefaultConfig);
    if (snapshotRbac && typeof snapshotRbac === 'object') {
      merged = deepMerge(merged, snapshotRbac);
    }
    if (liveRbacOverlay && typeof liveRbacOverlay === 'object') {
      merged = deepMerge(merged, liveRbacOverlay);
    }
    return merged;
  }, [snapshotRbac, liveRbacOverlay]);

  const hasAccess = useCallback(
    (page: string): boolean => {
      if (!user || !user.roles || user.roles.length === 0) {
        return config.default && config.default[page] === true;
      }

      const hasRoleAccess = user.roles.some((role) => {
        return config[role] && config[role][page] === true;
      });

      if (!hasRoleAccess) {
        return config.default && config.default[page] === true;
      }

      return hasRoleAccess;
    },
    [config, user],
  );

  return {
    hasAccess,
    rbacLiveRevision,
  };
};

export default useRBAC;
