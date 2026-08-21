import { useRouter } from 'next/router';

import { useEffect, useMemo, useState } from 'react';

import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

import dayjs from 'dayjs';
import { useTranslations } from 'next-intl';

import { useAuth } from '../../contexts/auth';
import { Event } from '../../types';
import type { TicketAvailabilityOption, TicketQuote } from '../../types/ticket';
import api from '../../utils/api';
import { buildMyBookingsAccessOr } from '../../utils/bookingCoGuests.helpers';
import { normalizeDiscountCode } from '../../utils/discountCode';
import {
  ACTIVE_BOOKING_STATUSES,
  AccommodationBooking,
  doesBookingCoverEvent,
  getEventNights,
} from '../../utils/events.helpers';
import { getEventTicketAvailability } from '../../utils/tickets.api';
import Modal from '../Modal';
import { ErrorMessage } from '../ui';
import Heading from '../ui/Heading';
import Spinner from '../ui/Spinner';
import TicketPaymentStep from './TicketPaymentStep';
import TicketSelectStep from './TicketSelectStep';
import TicketSuccessStep from './TicketSuccessStep';

interface Props {
  event: Event;
  closeModal: () => void;
}

type Step = 'select' | 'payment' | 'success';

const stripePromise = process.env.NEXT_PUBLIC_PLATFORM_STRIPE_PUB_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_PLATFORM_STRIPE_PUB_KEY, {
      stripeAccount: process.env.NEXT_PUBLIC_STRIPE_CONNECTED_ACCOUNT,
    })
  : null;

const formatDay = (value: string | Date) => dayjs(value).format('YYYY-MM-DD');

/**
 * Buying a ticket for an event, start to finish: pick a ticket, pay, celebrate.
 *
 * The ticket decides whether the guest still needs a bed. A day ticket never
 * does, and neither does a guest whose own booking already spans the event —
 * both are sold here through `/tickets/*` without ever leaving the modal. Any
 * other ticket for an event that runs overnight needs accommodation, and that
 * is the one case the modal hands over to the booking flow, carrying the chosen
 * ticket in the URL so the guest is not asked for it twice.
 */
const EventTicketModal = ({ event, closeModal }: Props) => {
  const t = useTranslations();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  const [step, setStep] = useState<Step>('select');
  const [ticketOptions, setTicketOptions] = useState<
    TicketAvailabilityOption[]
  >([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(true);
  const [selectedOption, setSelectedOption] =
    useState<TicketAvailabilityOption | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [discountCode, setDiscountCode] = useState('');
  const [quote, setQuote] = useState<TicketQuote | null>(null);
  const [coveringBooking, setCoveringBooking] =
    useState<AccommodationBooking | null>(null);
  const [paidTicketId, setPaidTicketId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // A virtual event has nowhere to sleep, so it is ticket-only however many
  // days it runs — no nights to cover, no accommodation step.
  const nights = event.virtual ? 0 : getEventNights(event.start, event.end);

  const availableTickets = useMemo(
    () =>
      ticketOptions.filter(
        (option) => option.available === null || option.available > 0,
      ),
    [ticketOptions],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoadingTickets(true);
      try {
        // Only the availability endpoint knows how many of each option are
        // left; the event itself carries the limits but not the sales.
        const availability = await getEventTicketAvailability(event._id);
        if (cancelled) return;
        setTicketOptions(
          availability?.ticketOptions?.length
            ? availability.ticketOptions
            : ((event.ticketOptions || []) as TicketAvailabilityOption[]),
        );
      } catch {
        if (!cancelled) {
          setTicketOptions(
            (event.ticketOptions || []) as TicketAvailabilityOption[],
          );
        }
      } finally {
        if (!cancelled) setIsLoadingTickets(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [event._id]);

  useEffect(() => {
    if (!isAuthenticated || !user?._id) {
      setCoveringBooking(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get('/booking', {
          params: {
            where: {
              $or: buildMyBookingsAccessOr(user),
              status: ACTIVE_BOOKING_STATUSES,
              end: { $gte: event.start },
            },
            limit: 50,
          },
        });
        if (cancelled) return;
        const bookings: AccommodationBooking[] = data?.results || [];
        setCoveringBooking(
          bookings.find((booking) =>
            doesBookingCoverEvent(booking, event.start, event.end),
          ) || null,
        );
      } catch {
        // Not knowing about an existing booking only costs the guest an extra
        // step, so a failure here stays silent.
        if (!cancelled) setCoveringBooking(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user?._id, event.start, event.end]);

  useEffect(() => {
    setSelectedOption((previous) => {
      if (
        previous &&
        availableTickets.some((option) => option.name === previous.name)
      ) {
        return previous;
      }
      return availableTickets.length === 1 ? availableTickets[0] : null;
    });
  }, [availableTickets]);

  const needsAccommodation =
    nights > 0 && !selectedOption?.isDayTicket && !coveringBooking;

  const goToBookingFlow = () => {
    const query: Record<string, string> = {
      eventId: event._id,
      start: formatDay(event.start),
      end: formatDay(event.end),
      ticketOption: selectedOption?.name || '',
      // Every ticket bought here is a person who needs a bed, so the count
      // carries over as the party size rather than being asked for again.
      adults: String(Math.max(1, quantity)),
    };
    const normalizedDiscount = normalizeDiscountCode(discountCode);
    if (normalizedDiscount) query.discountCode = normalizedDiscount;

    const target = `/stay/create?${new URLSearchParams(query).toString()}`;
    router.push(
      isAuthenticated ? target : `/login?back=${encodeURIComponent(target)}`,
    );
  };

  const handleContinue = () => {
    if (!selectedOption) {
      setError(t('bookings_error_no_ticket_option'));
      return;
    }
    setError(null);

    if (needsAccommodation) {
      goToBookingFlow();
      return;
    }
    if (!isAuthenticated) {
      // Ticket-only checkout lives in this modal, so a signed out guest comes
      // back to the event page rather than into the booking flow.
      router.push(`/login?back=${encodeURIComponent(`/events/${event.slug}`)}`);
      return;
    }
    setStep('payment');
  };

  const title =
    step === 'payment'
      ? t('event_ticket_payment_title')
      : step === 'success'
      ? t('event_ticket_success_heading')
      : t('event_ticket_modal_title');

  return (
    <Modal closeModal={closeModal} className="md:w-[640px]">
      {step !== 'success' && (
        <>
          <Heading level={2} className="text-xl pr-8 mb-1">
            {title}
          </Heading>
          <p className="text-sm text-gray-600 mb-4">
            {step === 'payment'
              ? t('event_ticket_payment_subtitle')
              : t('event_ticket_modal_subtitle')}
          </p>
        </>
      )}

      {step === 'success' && paidTicketId ? (
        <TicketSuccessStep
          ticketId={paidTicketId}
          eventName={event.name}
          onClose={closeModal}
        />
      ) : step === 'payment' && selectedOption ? (
        <Elements stripe={stripePromise}>
          <TicketPaymentStep
            eventId={event._id}
            ticketOptionName={selectedOption.name}
            quantity={quantity}
            discountCode={normalizeDiscountCode(discountCode)}
            quote={quote}
            userEmail={user?.email}
            userName={user?.screenname}
            onPaid={(ticketId) => {
              setPaidTicketId(ticketId);
              setStep('success');
            }}
            onBack={() => setStep('select')}
          />
        </Elements>
      ) : isLoadingTickets ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : availableTickets.length === 0 ? (
        <p className="text-sm text-gray-600 py-6">
          {t('event_ticket_modal_no_tickets')}
        </p>
      ) : (
        <>
          <TicketSelectStep
            eventId={event._id}
            nights={nights}
            options={availableTickets}
            selectedOption={selectedOption}
            onSelectOption={setSelectedOption}
            quantity={quantity}
            onQuantityChange={setQuantity}
            discountCode={discountCode}
            onDiscountCodeChange={setDiscountCode}
            quote={quote}
            onQuoteChange={setQuote}
            coveringBooking={coveringBooking}
            needsAccommodation={needsAccommodation}
            isAuthenticated={isAuthenticated}
            onContinue={handleContinue}
          />
          {error && (
            <div className="mt-4">
              <ErrorMessage error={error} />
            </div>
          )}
        </>
      )}
    </Modal>
  );
};

export default EventTicketModal;
