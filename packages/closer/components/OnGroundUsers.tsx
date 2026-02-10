import Link from 'next/link';

import { useEffect, useRef, useState } from 'react';

import { MapPin } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { usePlatform } from '../contexts/platform';
import api, { formatSearch } from '../utils/api';
import ProfilePhoto from './ProfilePhoto';

interface OnGroundUser {
  _id: string;
  screenname: string;
  slug: string;
  photo?: string;
}

interface OnGroundUsersProps {
  bookingConfig?: { enabled?: boolean } | null;
}

const OnGroundUsers = ({ bookingConfig }: OnGroundUsersProps) => {
  const t = useTranslations();
  const { platform }: { platform?: any } = usePlatform();
  const [users, setUsers] = useState<OnGroundUser[]>([]);
  const [total, setTotal] = useState(0);
  const hasLoadedRef = useRef(false);

  const bookingEnabled =
    bookingConfig?.enabled === true &&
    process.env.NEXT_PUBLIC_FEATURE_BOOKING === 'true';

  useEffect(() => {
    if (!bookingEnabled || !platform?.booking || hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    const load = async () => {
      try {
        const now = new Date();
        const filter = {
          where: {
            status: { $in: ['paid', 'checked-in'] },
            start: { $lte: now },
            end: { $gte: now },
          },
          limit: 500,
        };

        const result = await platform.booking.get(filter);
        const bookings = result?.results?.toJS?.() ?? result?.results ?? [];

        const userIds = new Set<string>();
        bookings.forEach((b: any) => {
          const createdBy = b?.createdBy;
          const paidBy = b?.paidBy;
          if (createdBy) userIds.add(createdBy);
          if (paidBy) userIds.add(paidBy);
        });

        const count = userIds.size;
        setTotal(count);

        if (count === 0) {
          setUsers([]);
          return;
        }

        const { data } = await api.get('/user', {
          params: {
            where: formatSearch({ _id: { $in: Array.from(userIds) } }),
            limit: 10,
          },
        });
        setUsers(data?.results ?? []);
      } catch {
        setUsers([]);
        setTotal(0);
      }
    };

    load();
  }, [bookingEnabled, platform]);

  if (!bookingEnabled || total === 0) return null;

  return (
    <div className="border-t border-line/20 p-3 flex-shrink-0">
      <Link
        href="/members"
        className="flex items-center gap-2 min-h-[44px] rounded-lg hover:bg-neutral-light transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="flex -space-x-1.5">
            {users.slice(0, 5).map((u) => (
              <div
                key={u._id}
                className="w-6 h-6 rounded-full overflow-hidden border-2 border-white bg-neutral-light"
              >
                <ProfilePhoto user={u} size="6" stack={false} />
              </div>
            ))}
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-medium text-foreground">
              {total} {t('community_on_ground_count_suffix')}
            </span>
            <span className="text-[10px] text-gray-500">
              {t('community_on_ground')}
            </span>
          </div>
        </div>
        <MapPin className="w-4 h-4 text-green-600 ml-auto flex-shrink-0" />
      </Link>
    </div>
  );
};

export default OnGroundUsers;
