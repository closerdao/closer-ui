import Link from 'next/link';

import { useEffect, useState } from 'react';

import { useTranslations } from 'next-intl';

import { useAuth } from '../../contexts/auth';
import api from '../../utils/api';
import ProfilePhoto from '../ProfilePhoto';

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

// The "near you" strip on /community: the members geographically closest to
// the logged-in viewer, via GET /users/nearby (distance is rounded server-side
// to 5 km — render 0 as "< 5 km", and null (no location on file) as nothing).
const NearbyMembers = ({ limit = 8 }: NearbyMembersProps) => {
  const t = useTranslations();
  const { isAuthenticated } = useAuth();
  const [users, setUsers] = useState<NearbyUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;

    const load = async () => {
      try {
        setIsLoading(true);
        const { data } = await api.get('/users/nearby', {
          params: { limit },
        });
        if (!cancelled) setUsers(data?.results ?? []);
      } catch {
        // No location on file or endpoint unavailable — the widget just hides.
        if (!cancelled) setUsers([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, limit]);

  if (!isAuthenticated || users.length === 0) return null;

  return (
    <section>
      <div className="flex items-baseline justify-between">
        <h2 className="font-bold text-lg">{t('community_near_you')}</h2>
      </div>
      <div className="mt-4 flex gap-6 overflow-x-auto pb-2">
        {users.map((user) => (
          <Link
            key={user._id}
            href={`/members/${user.slug}`}
            className="flex flex-col items-center gap-2 min-w-[92px] max-w-[110px] text-center group"
          >
            <ProfilePhoto user={user} size="16" stack={false} />
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate group-hover:text-accent">
                {user.screenname}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {[
                  user.locationName,
                  user.distanceKm === null || user.distanceKm === undefined
                    ? null
                    : user.distanceKm === 0
                    ? t('community_distance_close')
                    : `${user.distanceKm} km`,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default NearbyMembers;
