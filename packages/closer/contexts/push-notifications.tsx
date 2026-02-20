import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

import { getConfig, getConfigValueBySlug } from '../utils/configCache';
import api from '../utils/api';
import { useAuth } from './auth';
import { usePlatform } from './platform';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const PROMPTED_KEY = 'push_notification_prompted';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

interface PushNotificationContextType {
  isSupported: boolean;
  isCommunityEnabled: boolean;
  permission: NotificationPermission | 'unsupported';
  isSubscribed: boolean;
  wasPrompted: boolean;
  subscribe: () => Promise<void>;
  unsubscribe: () => Promise<void>;
  dismissPrompt: () => void;
}

const PushNotificationContext = createContext<PushNotificationContextType | undefined>(undefined);

export const usePushNotifications = () => {
  const context = useContext(PushNotificationContext);
  if (context === undefined) {
    throw new Error('usePushNotifications must be used within a PushNotificationProvider');
  }
  return context;
};

interface PushNotificationProviderProps {
  children: ReactNode;
}

export const PushNotificationProvider: React.FC<PushNotificationProviderProps> = ({ children }) => {
  const { user, refetchUser } = useAuth();
  const { platform } = usePlatform() as any;

  const [isSupported, setIsSupported] = useState(false);
  const [isCommunityEnabled, setIsCommunityEnabled] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('unsupported');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [wasPrompted, setWasPrompted] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const supported =
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window &&
      Boolean(VAPID_PUBLIC_KEY);

    setIsSupported(supported);

    if (supported) {
      setPermission(Notification.permission);
    }

    setWasPrompted(localStorage.getItem(PROMPTED_KEY) === 'true');
  }, []);

  useEffect(() => {
    let cancelled = false;
    getConfig(api)
      .then((configs) => {
        if (cancelled) return;
        const communityConfig = getConfigValueBySlug(configs, 'community');
        setIsCommunityEnabled(communityConfig?.enabled === true);
      })
      .catch(() => {
        if (!cancelled) setIsCommunityEnabled(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Sync subscription state from user object
  useEffect(() => {
    if (user) {
      setIsSubscribed(Boolean(user.settings?.push_notifications_enabled));
    } else {
      setIsSubscribed(false);
    }
  }, [user]);

  // Also check the actual browser subscription state on mount
  useEffect(() => {
    if (!isSupported || !user) return;

    let cancelled = false;
    (async () => {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (cancelled) return;
        if (registration) {
          const subscription = await registration.pushManager.getSubscription();
          if (cancelled) return;
          if (!subscription && user.settings?.push_notifications_enabled) {
            await platform.user.patch(user._id, {
              settings: { push_notifications_enabled: false, push_subscription: null },
            });
            if (!cancelled) await refetchUser();
          }
        }
      } catch {
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isSupported, user?._id]);

  const subscribe = useCallback(async () => {
    if (!isSupported || !user) return;

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result !== 'granted') return;

      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
      });

      const subscriptionJson = subscription.toJSON();

      await platform.user.patch(user._id, {
        settings: {
          push_notifications_enabled: true,
          push_subscription: {
            endpoint: subscriptionJson.endpoint,
            keys: subscriptionJson.keys,
          },
        },
      });

      await refetchUser();
      setIsSubscribed(true);

      // Mark as prompted
      localStorage.setItem(PROMPTED_KEY, 'true');
      setWasPrompted(true);
    } catch (err) {
      console.error('Failed to subscribe to push notifications:', err);
    }
  }, [isSupported, user, platform, refetchUser]);

  const unsubscribe = useCallback(async () => {
    if (!user) return;

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
        }
      }

      await platform.user.patch(user._id, {
        settings: {
          push_notifications_enabled: false,
          push_subscription: null,
        },
      });

      await refetchUser();
      setIsSubscribed(false);
    } catch (err) {
      console.error('Failed to unsubscribe from push notifications:', err);
    }
  }, [user, platform, refetchUser]);

  const dismissPrompt = useCallback(() => {
    localStorage.setItem(PROMPTED_KEY, 'true');
    setWasPrompted(true);
  }, []);

  return (
    <PushNotificationContext.Provider
      value={{
        isSupported,
        isCommunityEnabled,
        permission,
        isSubscribed,
        wasPrompted,
        subscribe,
        unsubscribe,
        dismissPrompt,
      }}
    >
      {children}
    </PushNotificationContext.Provider>
  );
};
