import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  appendBookingCoGuest,
  getBookingCoGuestIds,
} from '../../utils/bookingCoGuests.helpers';
import { parseMessageFromError } from '../../utils/common';
import type { SearchUserHit } from '../../utils/searchUser';
import { addStayGuest, removeStayGuest } from '../../utils/stays.api';
import { fetchUsersByIds } from '../../utils/village.utils';
import BookingCoGuests, { type BookingCoGuestUser } from './BookingCoGuests';

interface Props {
  stayId: string;
  createdBy?: string | null;
  paidBy?: string | null;
  /** Raw booking.guests — ids only; profiles are resolved here. */
  guestIds: string[];
  adults?: number;
  canEdit: boolean;
  /** Fires with the ids the server now holds, so the page can keep its own
   * copy of the stay in sync without refetching. */
  onGuestsChange?: (guestIds: string[]) => void;
}

/**
 * Co-guest list plus the member search that writes it. booking.guests is not
 * patchable, so every change goes through POST/DELETE /stays/:id/guests.
 */
const StayCoGuests = ({
  stayId,
  createdBy,
  paidBy,
  guestIds,
  adults,
  canEdit,
  onGuestsChange,
}: Props) => {
  const [guests, setGuests] = useState<BookingCoGuestUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const currentIdsRef = useRef<string[]>([]);
  const guestsRef = useRef<BookingCoGuestUser[]>([]);
  const saveChainRef = useRef(Promise.resolve());
  const saveVersionRef = useRef(0);
  const seededKeyRef = useRef<string | null>(null);

  const coGuestIds = useMemo(
    () => getBookingCoGuestIds({ createdBy, guests: guestIds }),
    [createdBy, guestIds],
  );
  const seedKey = `${stayId}:${coGuestIds.join(',')}`;

  // Only reseed when the ids actually change: pages that hold a stale copy of
  // the stay would otherwise undo an optimistic add on the next render.
  useEffect(() => {
    if (seededKeyRef.current === seedKey) return;
    seededKeyRef.current = seedKey;
    currentIdsRef.current = coGuestIds;
    if (coGuestIds.length === 0) {
      guestsRef.current = [];
      setGuests([]);
      return;
    }
    let cancelled = false;
    fetchUsersByIds(coGuestIds).then((users) => {
      if (cancelled) return;
      const nextGuests = users.map((user) => ({
        _id: user._id,
        screenname: user.screenname,
        photo: user.photo,
      }));
      guestsRef.current = nextGuests;
      setGuests(nextGuests);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seedKey]);

  const runSave = useCallback(
    (nextIds: string[], request: () => Promise<unknown>) => {
      const previousIds = [...currentIdsRef.current];
      const previousGuests = guestsRef.current;
      currentIdsRef.current = nextIds;
      seededKeyRef.current = `${stayId}:${nextIds.join(',')}`;
      setIsSaving(true);
      setError(null);
      onGuestsChange?.(nextIds);
      const version = ++saveVersionRef.current;

      saveChainRef.current = saveChainRef.current
        .catch(() => undefined)
        .then(async () => {
          try {
            await request();
          } catch (err) {
            if (version !== saveVersionRef.current) return;
            currentIdsRef.current = previousIds;
            guestsRef.current = previousGuests;
            seededKeyRef.current = `${stayId}:${previousIds.join(',')}`;
            setGuests(previousGuests);
            onGuestsChange?.(previousIds);
            setError(parseMessageFromError(err));
          } finally {
            if (version === saveVersionRef.current) {
              setIsSaving(false);
            }
          }
        });
    },
    [onGuestsChange, stayId],
  );

  const handleAdd = (hit: SearchUserHit) => {
    const next = appendBookingCoGuest(
      currentIdsRef.current,
      hit._id,
      createdBy,
      adults,
    );
    if (!next) {
      return false;
    }
    runSave(next, () => addStayGuest(stayId, hit._id));
    const nextGuests = guestsRef.current.some((guest) => guest._id === hit._id)
      ? guestsRef.current
      : [
          ...guestsRef.current,
          { _id: hit._id, screenname: hit.screenname, photo: hit.photo },
        ];
    guestsRef.current = nextGuests;
    setGuests(nextGuests);
    return true;
  };

  const handleRemove = (userId: string) => {
    runSave(
      currentIdsRef.current.filter((id) => id !== userId),
      () => removeStayGuest(stayId, userId),
    );
    const nextGuests = guestsRef.current.filter((guest) => guest._id !== userId);
    guestsRef.current = nextGuests;
    setGuests(nextGuests);
  };

  return (
    <BookingCoGuests
      guests={guests}
      canEdit={canEdit}
      excludeUserIds={[createdBy, paidBy].filter((id): id is string =>
        Boolean(id),
      )}
      adults={adults}
      isSaving={isSaving}
      error={error}
      onAdd={handleAdd}
      onRemove={handleRemove}
    />
  );
};

export default StayCoGuests;
