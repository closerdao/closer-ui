import { type ChangeEvent, useEffect, useRef, useState } from 'react';

import { useAuth } from '../contexts/auth';
import { type User } from '../contexts/auth/types';
import { usePlatform } from '../contexts/platform';
import api from '../utils/api';
import { parseMessageFromError } from '../utils/common';
import { mergeUserSettings } from '../utils/userSettings.helpers';

export type UpdateUserFunction = (value: string | string[]) => Promise<void>;

const PREFERENCE_KEYS = [
  'diet',
  'sharedAccomodation',
  'superpower',
  'skills',
  'dream',
  'needs',
  'moreInfo',
];

const KYC_DATA_KEYS = [
  'legalName',
  'address1',
  'TIN',
  'country',
  'city',
  'postalCode',
];

/**
 * Shared state for the /settings/* pages. Each settings route renders a
 * different slice of the same user, so the saving logic lives here rather than
 * on any one page.
 */
export function useSettingsUser() {
  const { user: initialUser, isAuthenticated, refetchUser } = useAuth();
  const { platform } = usePlatform() as any;

  const [user, setUser] = useState<User | null>(initialUser);
  const [error, setError] = useState<string | null>(null);
  const [hasSaved, setHasSaved] = useState(false);

  const kycDataDebounceTimers = useRef<Record<string, NodeJS.Timeout>>({});

  useEffect(() => {
    if (initialUser) {
      setUser(initialUser);

      if (!initialUser.kycData && initialUser._id) {
        api
          .get('/mine/user')
          .then((response) => {
            const fullUser = response?.data?.results as User | undefined;
            if (fullUser) {
              setUser(fullUser);
            }
          })
          .catch(() => {});
      }
    }
  }, [initialUser]);

  // Cleanup debounce timers on unmount
  useEffect(() => {
    return () => {
      Object.values(kycDataDebounceTimers.current).forEach((timer) => {
        clearTimeout(timer);
      });
    };
  }, []);

  const saveUserData =
    (
      attribute:
        | keyof User['preferences']
        | keyof User
        | keyof User['settings']
        | keyof NonNullable<User['kycData']>,
    ): UpdateUserFunction =>
    async (value: string | string[] | ChangeEvent<HTMLInputElement>) => {
      let actualValue: string | string[];

      if (typeof value === 'object' && 'target' in value) {
        actualValue = (value as ChangeEvent<HTMLInputElement>).target.value;
      } else {
        actualValue = value as string | string[];
      }

      let payload: Partial<User> = {
        [attribute]: actualValue,
      };
      if (PREFERENCE_KEYS.includes(attribute)) {
        payload = {
          preferences: {
            ...user?.preferences,
            [attribute]: actualValue,
          },
        };
      } else if (KYC_DATA_KEYS.includes(attribute)) {
        const stringValue =
          typeof actualValue === 'string'
            ? actualValue
            : Array.isArray(actualValue)
            ? actualValue.join(',')
            : '';

        if (kycDataDebounceTimers.current[attribute]) {
          clearTimeout(kycDataDebounceTimers.current[attribute]);
        }

        kycDataDebounceTimers.current[attribute] = setTimeout(async () => {
          try {
            const currentUserResponse = await api.get('/mine/user');
            const currentUser = currentUserResponse?.data?.results as
              | User
              | undefined;
            const existingKycData =
              currentUser?.kycData || user?.kycData || initialUser?.kycData;

            const debouncedPayload = {
              kycData: {
                IP: existingKycData?.IP || '',
                dateRecorded: existingKycData?.dateRecorded || new Date(),
                legalName: existingKycData?.legalName || '',
                TIN: existingKycData?.TIN || '',
                address1: existingKycData?.address1 || '',
                postalCode: existingKycData?.postalCode || '',
                city: existingKycData?.city || '',
                state: existingKycData?.state || '',
                country: existingKycData?.country || '',
                [attribute]: stringValue,
              } as User['kycData'],
            };

            setHasSaved(false);
            await platform.user.patch(user?._id, debouncedPayload);
            await refetchUser();
            const updatedUserResponse = await api.get('/mine/user');
            const updatedUser = updatedUserResponse?.data?.results as
              | User
              | undefined;
            if (updatedUser) {
              setUser(updatedUser);
            }
            setError(null);
            setHasSaved(true);
          } catch (err) {
            const errorMessage = parseMessageFromError(err);
            setError(errorMessage);
            console.error('[useSettingsUser] error:', errorMessage, err);
          }
        }, 500);

        return;
      }

      try {
        setHasSaved(false);
        await platform.user.patch(user?._id, payload);
        await refetchUser();
        const updatedUserResponse = await api.get('/mine/user');
        const updatedUser = updatedUserResponse?.data?.results as
          | User
          | undefined;
        if (updatedUser) {
          setUser(updatedUser);
        }
        setError(null);
        setHasSaved(true);
        // Don't show global success message for auto-saving inputs
      } catch (err) {
        const errorMessage = parseMessageFromError(err);
        setError(errorMessage);
        console.error('[useSettingsUser] error:', errorMessage, err);
      }
    };

  /**
   * Patch a slice of `user.settings`, keeping the rest of the object intact,
   * and mirror it locally so the section re-renders without a round trip.
   */
  const saveUserSettings = async (values: Record<string, unknown>) => {
    const action = await platform.user.patch(user?._id, {
      settings: mergeUserSettings(user, values),
    });
    if (action?.error) {
      throw action.error;
    }
    await refetchUser();
    setUser((prev) =>
      prev
        ? {
            ...prev,
            settings: {
              ...prev.settings,
              ...values,
            },
          }
        : prev,
    );
    setError(null);
    setHasSaved(true);
  };

  /**
   * The "near you" strip is opt-in, and opting out has to take the location
   * with it — leaving the coordinates on file while the flag is off would keep
   * the member findable by anything else that reads them.
   */
  const saveNearbyMembersEnabled = async (event: any) => {
    const enabled = !!event.target.checked;
    try {
      setHasSaved(false);
      const payload: Record<string, unknown> = {
        settings: mergeUserSettings(user, {
          nearby_members_enabled: enabled,
        }),
      };
      if (!enabled) {
        payload.location = null;
      }
      const action = await platform.user.patch(user?._id, payload);
      if (action?.error) {
        throw action.error;
      }
      await refetchUser();
      const updatedUserResponse = await api.get('/mine/user');
      const updatedUser = updatedUserResponse?.data?.results as
        | User
        | undefined;
      if (updatedUser) {
        setUser(updatedUser);
      }
      setError(null);
      setHasSaved(true);
    } catch (err) {
      const errorMessage = parseMessageFromError(err);
      setError(errorMessage);
    }
  };

  const saveSettings = (field: string) => async (event: any) => {
    const value = !!event.target.checked;
    try {
      setHasSaved(false);
      await saveUserSettings({ [field]: value });
    } catch (err) {
      const errorMessage = parseMessageFromError(err);
      setError(errorMessage);
    }
  };

  return {
    user,
    setUser,
    initialUser,
    isAuthenticated,
    refetchUser,
    error,
    setError,
    hasSaved,
    setHasSaved,
    saveUserData,
    saveSettings,
    saveUserSettings,
    saveNearbyMembersEnabled,
  };
}
