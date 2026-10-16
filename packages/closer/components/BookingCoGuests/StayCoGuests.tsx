import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';

import { Link2, Unlink, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

import {
  appendBookingCoGuest,
  getBookingCoGuestIds,
  getMaxBookingCoGuests,
} from '../../utils/bookingCoGuests.helpers';
import { parseMessageFromError } from '../../utils/common';
import type { SearchUserHit } from '../../utils/searchUser';
import { addStayGuest, removeStayGuest } from '../../utils/stays.api';
import { fetchUsersByIds } from '../../utils/village.utils';
import UserAvatarPlaceholder from '../UserAvatarPlaceholder';
import UserInfoButton from '../UserInfoButton';
import { BookingSectionEyebrow } from '../booking/bookingSurface';
import { ErrorMessage } from '../ui';
import InfoTooltip from '../ui/InfoTooltip';
import BookingCoGuests, { type BookingCoGuestUser } from './BookingCoGuests';

interface Props {
  stayId: string;
  createdBy?: string | null;
  paidBy?: string | null;
  /** Raw booking.guests — ids only; profiles are resolved here. */
  guestIds: string[];
  adults?: number;
  canEdit: boolean;
  primaryGuest?: { name: string; photo?: string } | null;
  payer?: { name: string; photo?: string } | null;
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
  primaryGuest,
  payer,
  onGuestsChange,
}: Props) => {
  const t = useTranslations();
  const guestPanelId = useId();
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [guests, setGuests] = useState<BookingCoGuestUser[]>([]);
  // Empty slots are presentational; the API still stores only linked ids.
  const [guestSlots, setGuestSlots] = useState<Array<string | null>>(() =>
    getBookingCoGuestIds({ createdBy, guests: guestIds }),
  );
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
  const linkedIds = guestSlots.filter((id): id is string => Boolean(id));
  const maxCoGuests = getMaxBookingCoGuests(adults);
  const canAddGuest = canEdit && linkedIds.length < maxCoGuests;
  // Preserve historical linked guests even if the recorded adult count shrank.
  const lastLinkedSlot = guestSlots.reduce(
    (last, id, index) => (id ? index + 1 : last),
    0,
  );
  const rows = Array.from(
    { length: Math.max(maxCoGuests, lastLinkedSlot) },
    (_, index) => guestSlots[index] ?? null,
  );
  const actionClass =
    'inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent-light/70 hover:text-accent-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50';
  const rowClass =
    'grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] items-center gap-x-3 gap-y-2 py-2';
  const guestRowClass =
    '-mx-2 rounded-lg px-2 py-2 transition-colors duration-150 hover:bg-foreground/[0.03] focus-within:bg-foreground/[0.03] motion-reduce:transition-none';

  // Only reseed when the ids actually change: pages that hold a stale copy of
  // the stay would otherwise undo an optimistic add on the next render.
  useEffect(() => {
    if (seededKeyRef.current === seedKey) return;
    seededKeyRef.current = seedKey;
    currentIdsRef.current = coGuestIds;
    setGuestSlots(coGuestIds);
    setActiveSlot(null);
    if (coGuestIds.length === 0) {
      guestsRef.current = [];
      setGuests([]);
      return;
    }
    let cancelled = false;
    fetchUsersByIds(coGuestIds)
      .then((users) => {
        if (cancelled || seededKeyRef.current !== seedKey) return;
        const nextGuests = users.map((user) => ({
          _id: user._id,
          screenname: user.screenname,
          photo: user.photo,
        }));
        guestsRef.current = nextGuests;
        setGuests(nextGuests);
      })
      .catch(() => {
        // Keep the saved ids visible as linked, even if profiles cannot load.
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seedKey]);

  const runSave = useCallback(
    (nextSlots: Array<string | null>, request: () => Promise<unknown>) => {
      const nextIds = nextSlots.filter((id): id is string => Boolean(id));
      const previousIds = [...currentIdsRef.current];
      const previousGuests = guestsRef.current;
      const previousSlots = guestSlots;
      currentIdsRef.current = nextIds;
      setGuestSlots(nextSlots);
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
            setGuestSlots(previousSlots);
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
    [guestSlots, onGuestsChange, stayId],
  );

  const handleAdd = (hit: SearchUserHit) => {
    if (
      !canAddGuest ||
      isSaving ||
      activeSlot === null ||
      rows[activeSlot] !== null
    ) {
      return false;
    }
    const next = appendBookingCoGuest(
      currentIdsRef.current,
      hit._id,
      createdBy,
      adults,
    );
    if (!next) {
      return false;
    }
    const nextSlots = rows.map((id, index) =>
      index === activeSlot ? hit._id : id,
    );
    runSave(nextSlots, () => addStayGuest(stayId, hit._id));
    const nextGuests = guestsRef.current.some((guest) => guest._id === hit._id)
      ? guestsRef.current
      : [
          ...guestsRef.current,
          { _id: hit._id, screenname: hit.screenname, photo: hit.photo },
        ];
    guestsRef.current = nextGuests;
    setGuests(nextGuests);
    setActiveSlot(null);
    return true;
  };

  const handleRemove = (userId: string) => {
    if (!canEdit || isSaving) return;
    runSave(
      guestSlots.map((id) => (id === userId ? null : id)),
      () => removeStayGuest(stayId, userId),
    );
    const nextGuests = guestsRef.current.filter(
      (guest) => guest._id !== userId,
    );
    guestsRef.current = nextGuests;
    setGuests(nextGuests);
    setActiveSlot(null);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1">
        <BookingSectionEyebrow>
          {t('bookings_dates_step_guests_title')}
        </BookingSectionEyebrow>
        <InfoTooltip label={t('booking_co_guests_link_help_label')}>
          {t('booking_co_guests_link_help')}
        </InfoTooltip>
      </div>
      <dl className="space-y-1 text-sm">
        <div className={guestRowClass}>
          <dt className="sr-only">{t('booking_co_guests_primary_label')}</dt>
          <dd className="flex min-w-0 items-center gap-1">
            <div className="min-w-0">
              {createdBy ? (
                <UserInfoButton
                  variant="preview"
                  createdBy={createdBy}
                  userInfo={{
                    name:
                      primaryGuest?.name ||
                      t('booking_co_guests_linked_profile'),
                    photo: primaryGuest?.photo || '',
                  }}
                />
              ) : (
                <span className="text-muted-foreground">
                  {t('booking_co_guests_not_linked')}
                </span>
              )}
            </div>
            <span
              className="shrink-0 text-xs text-muted-foreground"
              aria-hidden="true"
            >
              ({t('booking_co_guests_primary_label')})
            </span>
          </dd>
        </div>
        {rows.map((userId, index) => {
          const guest = guests.find((profile) => profile._id === userId);
          const isLinking = canAddGuest && activeSlot === index && !userId;
          const rowLabel = t('booking_co_guests_numbered_label', {
            number: index + 2,
          });
          return (
            <div
              key={index}
              role="group"
              aria-label={rowLabel}
              className={`${guestRowClass} flex flex-wrap items-center gap-2`}
            >
              <dt
                className={
                  userId
                    ? 'sr-only'
                    : 'flex min-w-0 items-center gap-2 py-0.5 pr-1'
                }
              >
                {!userId && (
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral"
                    aria-hidden="true"
                  >
                    <UserAvatarPlaceholder size="md" />
                  </span>
                )}
                <span className="truncate text-sm font-medium text-foreground">
                  {rowLabel}
                </span>
              </dt>
              <dd
                className={`flex min-w-0 flex-wrap items-center justify-between gap-2 ${userId ? 'w-full' : ''}`}
              >
                {userId ? (
                  <>
                    <div className="min-w-0 flex-1">
                      <UserInfoButton
                        variant="preview"
                        createdBy={userId}
                        userInfo={{
                          name:
                            guest?.screenname ||
                            t('booking_co_guests_linked_profile'),
                          photo: guest?.photo || '',
                        }}
                      />
                    </div>
                    {canEdit && (
                      <button
                        type="button"
                        className={actionClass}
                        aria-label={t('booking_co_guests_unlink_label', {
                          guest: rowLabel,
                        })}
                        disabled={isSaving}
                        onClick={() => handleRemove(userId)}
                      >
                        <Unlink className="h-4 w-4" aria-hidden="true" />
                        {t('booking_co_guests_unlink_button')}
                      </button>
                    )}
                  </>
                ) : canAddGuest ? (
                  <button
                    type="button"
                    className={actionClass}
                    aria-expanded={isLinking}
                    aria-controls={isLinking ? guestPanelId : undefined}
                    aria-label={t(
                      isLinking
                        ? 'booking_co_guests_cancel_link_label'
                        : 'booking_co_guests_link_profile_label',
                      { guest: rowLabel },
                    )}
                    disabled={isSaving}
                    onClick={() => setActiveSlot(isLinking ? null : index)}
                  >
                    {isLinking ? (
                      <X className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Link2 className="h-4 w-4" aria-hidden="true" />
                    )}
                    {t(
                      isLinking
                        ? 'buttons_cancel'
                        : 'booking_co_guests_link_profile_button',
                    )}
                  </button>
                ) : (
                  <span className="text-muted-foreground">
                    {t('booking_co_guests_not_linked')}
                  </span>
                )}
              </dd>
              {isLinking && (
                <dd id={guestPanelId} className="w-full">
                  <BookingCoGuests
                    guests={[]}
                    canEdit
                    isExistingBooking
                    maxCoGuests={1}
                    excludeUserIds={[createdBy, paidBy, ...linkedIds].filter(
                      (id): id is string => Boolean(id),
                    )}
                    isSaving={isSaving}
                    onAdd={handleAdd}
                    onRemove={handleRemove}
                  />
                </dd>
              )}
            </div>
          );
        })}
      </dl>
      {paidBy && paidBy !== createdBy && (
        <dl className="border-t border-line pt-1 text-sm">
          <div className={rowClass}>
            <dt className="text-muted-foreground">
              {t('booking_co_guests_payer_label')}
            </dt>
            <dd className="min-w-0">
              <UserInfoButton
                variant="preview"
                createdBy={paidBy}
                userInfo={{
                  name: payer?.name || t('booking_co_guests_linked_profile'),
                  photo: payer?.photo || '',
                }}
              />
            </dd>
          </div>
        </dl>
      )}
      {error && <ErrorMessage error={error} />}
    </div>
  );
};

export default StayCoGuests;
