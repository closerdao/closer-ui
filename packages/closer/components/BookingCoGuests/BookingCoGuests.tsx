import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Trash2, UserPlus } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { getMaxBookingCoGuests } from '../../utils/bookingCoGuests.helpers';
import type { SearchUserHit } from '../../utils/searchUser';
import { fetchUsersBySearchQuery } from '../../utils/searchUser';
import UserInfoButton from '../UserInfoButton';
import { ErrorMessage } from '../ui';

export type BookingCoGuestUser = {
  _id: string;
  screenname: string;
  photo?: string;
};

interface Props {
  guests: BookingCoGuestUser[];
  canEdit: boolean;
  excludeUserIds: string[];
  adults?: number;
  isSaving?: boolean;
  error?: string | null;
  onAdd: (user: SearchUserHit) => void;
  onRemove: (userId: string) => void;
}

const BookingCoGuests = ({
  guests,
  canEdit,
  excludeUserIds,
  adults,
  isSaving = false,
  error,
  onAdd,
  onRemove,
}: Props) => {
  const t = useTranslations();
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<SearchUserHit[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const excludedSet = useMemo(
    () => new Set([...excludeUserIds, ...guests.map((guest) => guest._id)]),
    [excludeUserIds, guests],
  );
  const maxCoGuests = getMaxBookingCoGuests(adults);
  const canAddMore = guests.length < maxCoGuests;

  const fetchUsers = useCallback(
    async (query: string) => {
      if (query.trim().length < 2) {
        setResults([]);
        return;
      }
      setIsLoading(true);
      try {
        const hits = await fetchUsersBySearchQuery(query);
        setResults(hits.filter((hit) => !excludedSet.has(hit._id)));
      } catch {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    },
    [excludedSet],
  );

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setIsOpen(true);
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => void fetchUsers(value), 300);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  if (!canEdit && guests.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      {guests.map((guest) => (
        <div key={guest._id} className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <UserInfoButton
              variant="preview"
              userInfo={{
                name: guest.screenname,
                photo: guest.photo || '',
              }}
              createdBy={guest._id}
            />
          </div>
          {canEdit && (
            <button
              type="button"
              onClick={() => onRemove(guest._id)}
              className="p-2 text-failure hover:text-failure/80 disabled:opacity-50"
              title={t('booking_co_guests_remove')}
              disabled={isSaving}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      ))}

      {canEdit && canAddMore && (
        <div ref={containerRef} className="relative">
          <div className="flex items-center gap-2">
            <UserPlus className="h-4 w-4 shrink-0 text-disabled" />
            <input
              type="text"
              value={search}
              onChange={(event) => handleSearchChange(event.target.value)}
              onFocus={() => search.length >= 2 && setIsOpen(true)}
              placeholder={t('booking_co_guests_search_placeholder')}
              className="w-full rounded-lg border border-line bg-background px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-accent"
              autoComplete="off"
              disabled={isSaving}
            />
          </div>
          {isOpen && (search.length >= 2 || results.length > 0) && (
            <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-48 overflow-y-auto rounded-lg border border-line bg-background shadow-lg">
              {isLoading && (
                <div className="px-3 py-2 text-sm text-disabled">
                  {t('booking_co_guests_loading')}
                </div>
              )}
              {!isLoading && results.length === 0 && search.length >= 2 && (
                <div className="px-3 py-2 text-sm text-disabled">
                  {t('booking_co_guests_empty')}
                </div>
              )}
              {results.map((hit) => (
                <button
                  key={hit._id}
                  type="button"
                  disabled={isSaving}
                  onClick={() => {
                    if (isSaving) {
                      return;
                    }
                    onAdd(hit);
                    setSearch('');
                    setIsOpen(false);
                    setResults([]);
                  }}
                  className="flex w-full flex-col gap-0.5 px-3 py-2 text-left hover:bg-accent-light/70 disabled:opacity-50"
                >
                  <span className="text-sm font-medium text-foreground">
                    {hit.screenname}
                  </span>
                  <span className="truncate text-xs text-disabled">
                    {hit.email
                      ? hit.email
                      : hit.walletAddress
                        ? `${hit.walletAddress.slice(0, 6)}…${hit.walletAddress.slice(-4)}`
                        : t('booking_co_guests_no_contact')}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {canEdit && !canAddMore && maxCoGuests > 0 && (
        <p className="text-xs text-disabled">
          {t('booking_co_guests_max_reached')}
        </p>
      )}

      {error && <ErrorMessage error={error} />}
    </div>
  );
};

export default BookingCoGuests;
