import { useRouter } from 'next/router';

import { useEffect, useMemo, useRef, useState } from 'react';

import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

import dayjs from 'dayjs';
import { useTranslations } from 'next-intl';

import { DEFAULT_CURRENCY } from '../../constants';
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
  eventNeedsAccommodation,
  getEventNights,
  isFreeEvent,
} from '../../utils/events.helpers';
import {
  getEventTicketAvailability,
  getTicket,
  quoteTicket,
} from '../../utils/tickets.api';
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
  /** Ticket option to open on, by name — from `?checkout&ticket=`. */
  initialTicketOption?: string;
  /** Discount code to prefill and apply — from `?checkout&discountCode=`. */
  initialDiscountCode?: string;
  /** An unpaid ticket to settle — from `?checkout&ticketId=`. */
  initialTicketId?: string;
}

type Step = 'select' | 'payment' | 'success';

/** Statuses that still owe money, and so can be resumed from a deep link. */
const RESUMABLE_STATUSES = ['pending', 'pending-payment'];

/**
 * What a free event with no ticket options of its own is sold under. It has no
 * name because there is no option behind it — the requests it drives leave
 * `ticketOption` out entirely and the server prices plain admission.
 */
const FREE_ADMISSION: TicketAvailabilityOption = {
  name: '',
  price: 0,
  currency: DEFAULT_CURRENCY,
  available: null,
  isDayTicket: true,
};

const stripePromise = process.env.NEXT_PUBLIC_PLATFORM_STRIPE_PUB_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_PLATFORM_STRIPE_PUB_KEY, {
      stripeAccount: process.env.NEXT_PUBLIC_STRIPE_CONNECTED_ACCOUNT,
    })
  : null;

const formatDay = (value: string | Date) => dayjs(value).format('YYYY-MM-DD');

/** Options are shown with underscores as spaces, so links may carry either. */
const looseName = (name: string) =>
  name.trim().toLowerCase().split('_').join(' ');

const findOptionByName = (
  options: TicketAvailabilityOption[],
  name?: string,
): TicketAvailabilityOption | null => {
  if (!name) return null;
  return (
    options.find((option) => option.name === name) ||
    options.find((option) => looseName(option.name) === looseName(name)) ||
    null
  );
};

/**
 * Buying a ticket for an event, start to finish: pick a ticket, pay, celebrate.
 *
 * The ticket decides whether the guest still needs a bed. A day ticket never
 * does, and neither does a guest whose own booking already spans the event —
 * both are sold here through `/tickets/*` without ever leaving the modal. Any
 * other ticket for an event that runs overnight needs accommodation, and that
 * is the one case the modal hands over to the booking flow, carrying the chosen
 * ticket in the URL so the guest is not asked for it twice.
 *
 * The modal can also be opened straight onto payment by a link carrying an
 * unpaid ticket id (see utils/eventCheckout). Paying then re-runs
 * `/tickets/init`, which expires the guest's earlier hold on the same event —
 * so resuming settles the seat they already had rather than taking a second.
 */
const EventTicketModal = ({
  event,
  closeModal,
  initialTicketOption,
  initialDiscountCode,
  initialTicketId,
}: Props) => {
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
  const [discountCode, setDiscountCode] = useState(
    normalizeDiscountCode(initialDiscountCode),
  );
  const [quote, setQuote] = useState<TicketQuote | null>(null);
  const [coveringBooking, setCoveringBooking] =
    useState<AccommodationBooking | null>(null);
  const [paidTicketId, setPaidTicketId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  /** True while a `?ticketId=` link is being turned into a payment step. */
  const [isResuming, setIsResuming] = useState(Boolean(initialTicketId));
  const [notice, setNotice] = useState<string | null>(null);
  const resumedTicketRef = useRef<string | null>(null);

  // A one-day event and a virtual one both leave the guest nowhere to sleep,
  // so they are ticket-only however long they run — no nights to cover, no
  // accommodation step, and never a booking.
  const nights = eventNeedsAccommodation(event)
    ? getEventNights(event.start, event.end)
    : 0;

  const availableTickets = useMemo(() => {
    const inStock = ticketOptions.filter(
      (option) => option.available === null || option.available > 0,
    );
    // A free event that never had ticket options is still attended by holding
    // a ticket, so plain admission stands in for the option it does not have.
    // Only where nobody needs a bed — an event that does is booked, and the
    // booking writes the ticket.
    if (inStock.length === 0 && nights === 0 && isFreeEvent(event)) {
      return [FREE_ADMISSION];
    }
    return inStock;
  }, [ticketOptions, nights, event]);

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
      return (
        findOptionByName(availableTickets, initialTicketOption) ||
        (availableTickets.length === 1 ? availableTickets[0] : null)
      );
    });
  }, [availableTickets, initialTicketOption]);

  /**
   * `?checkout&ticketId=` — settle a ticket the guest already started.
   *
   * The ticket itself is the source of truth for what was being bought, so its
   * option, quantity and discount are read back rather than taken from the
   * link. An option that has since sold out is still rebuilt from the ticket:
   * the seat is already held under this guest's name, and init hands it back
   * to them rather than counting it against availability twice.
   */
  useEffect(() => {
    if (!initialTicketId) return;
    if (!isAuthenticated) {
      // Nothing to load until they sign in — the select step's login button
      // brings them back to this same link.
      setIsResuming(false);
      return;
    }
    if (isLoadingTickets) return;
    if (resumedTicketRef.current === initialTicketId) return;
    resumedTicketRef.current = initialTicketId;

    let cancelled = false;
    (async () => {
      setIsResuming(true);
      setNotice(null);
      try {
        const { ticket } = await getTicket(initialTicketId);
        if (cancelled) return;

        if (String(ticket.event) !== String(event._id)) {
          setNotice(t('event_ticket_resume_wrong_event'));
          return;
        }
        if (!RESUMABLE_STATUSES.includes(ticket.status)) {
          setNotice(
            ticket.status === 'approved'
              ? t('event_ticket_resume_already_paid')
              : t('event_ticket_resume_unavailable'),
          );
          return;
        }

        const optionName = ticket.option?.name || '';
        const option =
          findOptionByName(availableTickets, optionName) ||
          (optionName
            ? {
                name: optionName,
                price: ticket.unitPrice?.val ?? ticket.price?.val ?? 0,
                currency: ticket.unitPrice?.cur ?? ticket.price?.cur ?? '',
                available: null,
              }
            : null);
        if (!option) {
          setNotice(t('event_ticket_resume_unavailable'));
          return;
        }

        const resumedQuantity = Math.max(1, ticket.quantity || 1);
        const resumedDiscount = normalizeDiscountCode(ticket.discount);

        // The payment step shows a total, and only the server may say what it
        // is — so the ticket is repriced before that step is allowed to open.
        const resumedQuote = await quoteTicket({
          eventId: event._id,
          ticketOption: option.name,
          quantity: resumedQuantity,
          ...(resumedDiscount ? { discountCode: resumedDiscount } : {}),
        });
        if (cancelled) return;

        setSelectedOption(option);
        setQuantity(resumedQuantity);
        setDiscountCode(resumedDiscount);
        setQuote(resumedQuote);
        setStep('payment');
      } catch {
        // A ticket that cannot be read is one this guest may not resume —
        // they still get the normal flow rather than a dead end.
        if (!cancelled) setNotice(t('event_ticket_resume_unavailable'));
      } finally {
        if (!cancelled) setIsResuming(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [initialTicketId, isAuthenticated, isLoadingTickets, event._id]);

  const needsAccommodation =
    nights > 0 && !selectedOption?.isDayTicket && !coveringBooking;

  /**
   * An event selling plain admission has literally nothing to choose and
   * nothing to pay, so the modal opens straight on the claim step — the RSVP
   * button this replaced was one click and this stays one click. An event that
   * does define a free ticket keeps the selection: how many is still a
   * question worth asking.
   */
  const claimsDirectly =
    isAuthenticated &&
    !initialTicketId &&
    !isLoadingTickets &&
    availableTickets.length === 1 &&
    availableTickets[0] === FREE_ADMISSION;

  // The option is picked by an effect, so on the render that first has the
  // options it is still unset — reading it here keeps the claim step from
  // flashing the selection it is meant to skip.
  const optionInPlay =
    selectedOption || (claimsDirectly ? availableTickets[0] : null);
  const currentStep: Step =
    step === 'select' && claimsDirectly ? 'payment' : step;

  /**
   * Nothing to pay. The quote decides whenever there is one — a code or a
   * volunteer rate can take a priced ticket down to zero — and the option's
   * own price answers before the first quote comes back.
   */
  const isFreeTicket = optionInPlay
    ? quote
      ? quote.total.val <= 0
      : !(Number(optionInPlay.price) > 0)
    : false;

  /** Where login should send the guest back to — the deep link, if there is one. */
  const backHref = router.asPath?.startsWith('/events/')
    ? router.asPath
    : `/events/${event.slug}`;

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
      // back to the page they were on — deep link and all, so a link to a
      // pending ticket survives the detour through login.
      router.push(`/login?back=${encodeURIComponent(backHref)}`);
      return;
    }
    setStep('payment');
  };

  const title =
    currentStep === 'payment'
      ? isFreeTicket
        ? t('event_ticket_claim_title')
        : t('event_ticket_payment_title')
      : currentStep === 'success'
      ? t('event_ticket_success_heading')
      : t('event_ticket_modal_title');

  return (
    <Modal closeModal={closeModal} className="md:w-[640px]">
      {currentStep !== 'success' && (
        <>
          <Heading level={2} className="text-xl pr-8 mb-1">
            {title}
          </Heading>
          <p className="text-sm text-gray-600 mb-4">
            {currentStep === 'payment'
              ? isFreeTicket
                ? t('event_ticket_claim_subtitle')
                : t('event_ticket_payment_subtitle')
              : t('event_ticket_modal_subtitle')}
          </p>
        </>
      )}

      {currentStep === 'success' && paidTicketId ? (
        <TicketSuccessStep
          ticketId={paidTicketId}
          eventName={event.name}
          onClose={closeModal}
        />
      ) : currentStep === 'payment' && optionInPlay ? (
        <Elements stripe={stripePromise}>
          <TicketPaymentStep
            eventId={event._id}
            ticketOptionName={optionInPlay.name}
            quantity={quantity}
            discountCode={normalizeDiscountCode(discountCode)}
            quote={quote}
            isFree={isFreeTicket}
            userEmail={user?.email}
            userName={user?.screenname}
            onPaid={(ticketId) => {
              setPaidTicketId(ticketId);
              setStep('success');
            }}
            // Skipping the selection leaves nothing to go back to.
            onBack={claimsDirectly ? undefined : () => setStep('select')}
          />
        </Elements>
      ) : isLoadingTickets || isResuming ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : availableTickets.length === 0 ? (
        <p className="text-sm text-gray-600 py-6">
          {t('event_ticket_modal_no_tickets')}
        </p>
      ) : (
        <>
          {notice && (
            <p
              className="mb-4 rounded-md bg-accent-light p-3 text-sm"
              role="status"
            >
              {notice}
            </p>
          )}
          <TicketSelectStep
            eventId={event._id}
            nights={nights}
            isFree={isFreeTicket}
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
