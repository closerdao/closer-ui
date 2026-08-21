import { useEffect, useMemo, useState } from 'react';

import dayjs from 'dayjs';
import { useTranslations } from 'next-intl';

import { CloserCurrencies } from '../../types';
import type { TicketAvailabilityOption, TicketQuote } from '../../types/ticket';
import { normalizeDiscountCode } from '../../utils/discountCode';
import { priceFormat } from '../../utils/helpers';
import { quoteTicket } from '../../utils/tickets.api';
import { Button, ErrorMessage } from '../ui';
import Input from '../ui/Input';
import Spinner from '../ui/Spinner';

interface Props {
  eventId: string;
  /** Nights of the event, or 0 when nowhere to sleep is involved. */
  nights: number;
  options: TicketAvailabilityOption[];
  selectedOption: TicketAvailabilityOption | null;
  onSelectOption: (option: TicketAvailabilityOption) => void;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  discountCode: string;
  onDiscountCodeChange: (code: string) => void;
  quote: TicketQuote | null;
  onQuoteChange: (quote: TicketQuote | null) => void;
  /** Dates of the booking that already puts the guest on site, if any. */
  coveringBooking: { start: string; end: string } | null;
  needsAccommodation: boolean;
  isAuthenticated: boolean;
  onContinue: () => void;
}

/** `null` available means unlimited, which is not the same as none left. */
const seatsLeft = (option: TicketAvailabilityOption | null): number | null =>
  option && option.available === null ? null : option?.available ?? null;

const TicketCard = ({
  option,
  isSelected,
  onSelect,
}: {
  option: TicketAvailabilityOption;
  isSelected: boolean;
  onSelect: () => void;
}) => {
  const t = useTranslations();
  const left = seatsLeft(option);
  const isSoldOut = left !== null && left <= 0;

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={isSoldOut}
      className={`border-2 flex flex-col justify-center rounded-md shadow-sm p-4 text-left grow basis-[45%] ${
        isSelected ? 'border-accent' : 'border-gray-100'
      } ${isSoldOut ? 'text-gray-400' : 'hover:border-accent'}`}
    >
      <h4 title={option.disclaimer}>{option.name.split('_').join(' ')}</h4>
      <p className="text-gray-500 italic text-sm">
        {option.isDayTicket
          ? t('ticket_day_ticket')
          : t('ticket_overnight_ticket')}
      </p>
      <p className="price text-gray-500">
        {priceFormat(option.price, option.currency as CloserCurrencies)}
      </p>
      <p className="availability text-xs uppercase text-accent">
        {isSoldOut
          ? t('ticket_not_available')
          : left === null
          ? t('ticket_available_unlimited')
          : `${left} ${t('ticket_available')}`}
      </p>
      {isSelected && option.disclaimer && (
        <p className="text-xs text-gray-500 mt-1">{option.disclaimer}</p>
      )}
    </button>
  );
};

/**
 * Step one: which ticket, how many, and at what price. Every figure shown here
 * comes from `POST /tickets/quote` — the client never prices a ticket itself.
 */
const TicketSelectStep = ({
  eventId,
  nights,
  options,
  selectedOption,
  onSelectOption,
  quantity,
  onQuantityChange,
  discountCode,
  onDiscountCodeChange,
  quote,
  onQuoteChange,
  coveringBooking,
  needsAccommodation,
  isAuthenticated,
  onContinue,
}: Props) => {
  const t = useTranslations();
  const [appliedDiscount, setAppliedDiscount] = useState('');
  const [isQuoting, setIsQuoting] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  const maxQuantity = useMemo(() => {
    const left = seatsLeft(selectedOption);
    return left === null ? 10 : Math.max(1, Math.min(left, 10));
  }, [selectedOption]);

  useEffect(() => {
    if (quantity > maxQuantity) onQuantityChange(maxQuantity);
  }, [maxQuantity, quantity, onQuantityChange]);

  useEffect(() => {
    if (!selectedOption) {
      onQuoteChange(null);
      return;
    }
    let cancelled = false;
    setIsQuoting(true);
    setQuoteError(null);
    (async () => {
      try {
        const result = await quoteTicket({
          eventId,
          ticketOption: selectedOption.name,
          quantity,
          ...(appliedDiscount ? { discountCode: appliedDiscount } : {}),
        });
        if (!cancelled) onQuoteChange(result);
      } catch (err: any) {
        if (!cancelled) {
          onQuoteChange(null);
          setQuoteError(
            err?.response?.data?.error || t('event_ticket_quote_failed'),
          );
        }
      } finally {
        if (!cancelled) setIsQuoting(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [eventId, selectedOption?.name, quantity, appliedDiscount]);

  const total = quote?.total;

  return (
    <>
      <div className="flex flex-row flex-wrap gap-3">
        {options.map((option) => (
          <TicketCard
            key={option.name}
            option={option}
            isSelected={option.name === selectedOption?.name}
            onSelect={() => onSelectOption(option)}
          />
        ))}
      </div>

      {selectedOption && (
        <div className="mt-4 flex flex-col gap-3">
          <label className="flex items-center justify-between gap-4 text-sm">
            <span>{t('event_ticket_quantity')}</span>
            <select
              aria-label={t('event_ticket_quantity')}
              className="border rounded-md px-3 py-2"
              value={quantity}
              onChange={(event) => onQuantityChange(Number(event.target.value))}
            >
              {Array.from({ length: maxQuantity }, (_, index) => index + 1).map(
                (value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ),
              )}
            </select>
          </label>

          <div className="flex items-end gap-2">
            <Input
              label={t('bookings_dates_step_tickets_discount_code')}
              placeholder={t(
                'bookings_dates_step_tickets_discount_code_placeholder',
              )}
              value={discountCode}
              onChange={(event: any) =>
                onDiscountCodeChange(event.target.value)
              }
              className="grow"
            />
            <Button
              variant="secondary"
              size="small"
              className="w-auto shrink-0"
              isEnabled={Boolean(discountCode.trim()) && !isQuoting}
              onClick={() =>
                setAppliedDiscount(normalizeDiscountCode(discountCode))
              }
            >
              {t('apply_submit_button')}
            </Button>
          </div>

          {quote?.discountRejected && (
            <p className="text-sm text-gray-600">
              {t('event_ticket_discount_rejected')}
            </p>
          )}
          {quote?.discountApplied && (
            <p className="text-sm text-success">
              {t('event_ticket_discount_applied')}
            </p>
          )}
        </div>
      )}

      {nights > 0 && (
        <div className="mt-4 rounded-md bg-accent-light p-4 text-sm">
          {coveringBooking ? (
            <p>
              {t('event_ticket_modal_accommodation_covered', {
                start: dayjs(coveringBooking.start).format('MMM D'),
                end: dayjs(coveringBooking.end).format('MMM D'),
              })}
            </p>
          ) : selectedOption?.isDayTicket ? (
            <p>{t('event_ticket_modal_accommodation_not_needed')}</p>
          ) : selectedOption ? (
            <p>{t('event_ticket_modal_accommodation_needed', { nights })}</p>
          ) : (
            <p>{t('event_ticket_modal_accommodation_unknown')}</p>
          )}
        </div>
      )}

      {quoteError && (
        <div className="mt-4">
          <ErrorMessage error={quoteError} />
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3">
        {isQuoting ? (
          <div className="flex justify-center">
            <Spinner />
          </div>
        ) : (
          total && (
            <div className="flex justify-between items-center text-lg font-bold">
              <span>{t('event_ticket_total')}</span>
              <span>
                {priceFormat(total.val, total.cur as CloserCurrencies)}
              </span>
            </div>
          )
        )}
        <Button
          onClick={onContinue}
          isEnabled={Boolean(selectedOption) && !isQuoting}
        >
          {!isAuthenticated
            ? t('events_login_to_book')
            : needsAccommodation
            ? t('event_ticket_continue_to_accommodation')
            : t('event_ticket_continue_to_payment')}
        </Button>
      </div>
    </>
  );
};

export default TicketSelectStep;
