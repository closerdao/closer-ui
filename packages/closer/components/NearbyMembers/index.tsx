import Link from 'next/link';

import { useCallback, useEffect, useState } from 'react';

import { MapPin } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { useAuth } from '../../contexts/auth';
import api from '../../utils/api';
import {
  captureBrowserUserLocation,
  hasUserLocation,
} from '../../utils/userLocation';
import ProfilePhoto from '../ProfilePhoto';
import { Button, Spinner } from '../ui';

interface NearbyUser {
  _id: string;
  screenname: string;
  slug: string;
  photo?: string;
  locationName?: string | null;
  distanceKm?: number | null;
}

interface NearbyMembersProps {
  limit?: number;
}

type NearbyStatus =
  | 'loading'
  | 'needs-location'
  | 'empty'
  | 'ready'
  | 'unavailable';

const NearbyMembers = ({ limit = 8 }: NearbyMembersProps) => {
  const t = useTranslations();
  const { isAuthenticated, user, refetchUser } = useAuth();
  const [users, setUsers] = useState<NearbyUser[]>([]);
  const [status, setStatus] = useState<NearbyStatus>('loading');
  const [isSavingLocation, setIsSavingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const userHasLocation = hasUserLocation(user?.location);

  const loadNearby = useCallback(
    async (options?: { assumeLocation?: boolean }) => {
      if (!isAuthenticated || !user?._id) return;

      if (!options?.assumeLocation && !userHasLocation) {
        setUsers([]);
        setStatus('needs-location');
        return;
      }

      try {
        setStatus('loading');
        const { data } = await api.get('/users/nearby', {
          params: { limit },
          cache: false,
        } as any);
        const results = data?.results ?? [];
        setUsers(results);
        setStatus(results.length > 0 ? 'ready' : 'empty');
      } catch {
        setUsers([]);
        setStatus('unavailable');
      }
    },
    [isAuthenticated, limit, user?._id, userHasLocation],
  );

  useEffect(() => {
    if (!isAuthenticated || !user?._id) return;
    loadNearby();
  }, [isAuthenticated, user?._id, userHasLocation, loadNearby]);

  const shareLocation = async () => {
    if (!user?._id) return;
    try {
      setIsSavingLocation(true);
      setLocationError(null);
      const location = await captureBrowserUserLocation();
      await api.patch('/mine/user', { location });
      await refetchUser();
      await loadNearby({ assumeLocation: true });
    } catch {
      setLocationError(t('community_near_you_location_error'));
      if (!userHasLocation) {
        setStatus('needs-location');
      }
    } finally {
      setIsSavingLocation(false);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <section className="min-w-0">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <h2 className="font-bold text-lg">{t('community_near_you')}</h2>
      </div>

      {status === 'loading' && (
        <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
          <Spinner /> {t('generic_loading')}
        </div>
      )}

      {status === 'needs-location' && (
        <div className="mt-4 flex flex-col gap-3 rounded-md bg-neutral-light p-4">
          <p className="text-sm text-gray-600">
            {t('community_near_you_share_prompt')}
          </p>
          {locationError && (
            <p className="text-sm text-error">{locationError}</p>
          )}
          <Button
            onClick={shareLocation}
            isEnabled={!isSavingLocation}
            isLoading={isSavingLocation}
            size="small"
            isFullWidth={false}
            className="self-start"
          >
            <span className="inline-flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {t('community_near_you_share_cta')}
            </span>
          </Button>
        </div>
      )}

      {status === 'empty' && (
        <div className="mt-4 flex flex-col gap-3 rounded-md bg-neutral-light p-4">
          <p className="text-sm text-gray-600">
            {t('community_near_you_empty')}
          </p>
          {locationError && (
            <p className="text-sm text-error">{locationError}</p>
          )}
          <button>
            type="button"
            onClick={shareLocation}
            disabled={isSavingLocation}
            className="self-start text-sm text-accent font-semibold hover:underline disabled:opacity-60"
          >
            {t('community_near_you_update_location')}
          </button>
        </div>
      )}

      {status === 'unavailable' && (
        <div className="mt-4 flex flex-col gap-3 rounded-md bg-neutral-light p-4">
          <p className="text-sm text-gray-600">
            {t('community_near_you_unavailable')}
          </p>
          {locationError && (
            <p className="text-sm text-error">{locationError}</p>
          )}
          <button>
            type="button"
            onClick={shareLocation}
            disabled={isSavingLocation}
            className="self-start text-sm text-accent font-semibold hover:underline disabled:opacity-60"
          >
            {hasUserLocation(user?.location)
              ? t('community_near_you_update_location')
              : t('community_near_you_share_cta')}
          </button>
        </div>
      )}

      {status === 'ready' && (
        <div className="mt-4 -mx-1 px-1 flex gap-6 overflow-x-auto pb-2">
          {users.map((nearbyUser) => (
            <Link
              key={nearbyUser._id}
              href={`/members/${nearbyUser.slug}`}
              className="flex flex-col items-center gap-2 min-w-[92px] max-w-[110px] text-center group"
            >
              <ProfilePhoto user={nearbyUser} size="16" stack={false} />
              <div className="min-w-0 w-full">
                <p className="text-sm font-semibold truncate group-hover:text-accent">
                  {nearbyUser.screenname}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {[
                    nearbyUser.locationName,
                    nearbyUser.distanceKm === null ||
                    nearbyUser.distanceKm === undefined
                      ? null
                      : nearbyUser.distanceKm === 0
                      ? t('community_distance_close')
                      : `${nearbyUser.distanceKm} km`,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
};

export default NearbyMembers;
