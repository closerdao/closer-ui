import { Dispatch, SetStateAction, useEffect, useState } from 'react';

import { useTranslations } from 'next-intl';

import { TicketOption } from '../../types';
import { normalizeDiscountCode } from '../../utils/discountCode';
import { priceFormat } from '../../utils/helpers';
import {
  DiscountProbeResult,
  validateDiscountCode,
} from '../../utils/stays.api';
import { Button } from '../ui';
import Input from '../ui/Input';

interface Props {
  setDiscountCode: Dispatch<SetStateAction<string>>;
  discountCode: string;
  eventId?: string;
  /** Preferred over eventId once the stay exists — the server reads the event
   * and the ticket option off the stay. */
  stayId?: string;
  selectedTicketOption?: TicketOption;
  onDiscountValidated?: (code: string) => void;
}

const DiscountCode = ({
  setDiscountCode,
  discountCode,
  eventId,
  stayId,
  selectedTicketOption,
  onDiscountValidated,
}: Props) => {
  const t = useTranslations();
  const [discountResult, setDiscountResult] = useState<DiscountProbeResult>();
  // Distinct from a rejected code: this means the probe request itself failed.
  const [requestError, setRequestError] = useState(false);

  useEffect(() => {
    setDiscountResult(undefined);
    setRequestError(false);
  }, [selectedTicketOption?.name, discountCode]);

  const handleApplyDiscountCode = async () => {
    const normalizedCode = normalizeDiscountCode(discountCode);
    if (normalizedCode !== discountCode) {
      setDiscountCode(normalizedCode);
    }
    setRequestError(false);
    try {
      // A rejected code comes back as a 200 with status: 'fail' — only a
      // non-2xx lands in the catch below.
      const results = await validateDiscountCode(
        stayId
          ? { discountCode: normalizedCode, stayId }
          : {
              discountCode: normalizedCode,
              eventId,
              ticketOption: selectedTicketOption,
            },
      );
      setDiscountResult(results);
      if (results?.status === 'success' && normalizedCode) {
        onDiscountValidated?.(normalizedCode);
      }
    } catch {
      setDiscountResult(undefined);
      setRequestError(true);
    }
  };

  return (
    <div>
      <div className="blcok sm:flex basis-20">
        <p className="mt-2 basis-1/2 sm:mb-0">
          {t('bookings_dates_step_tickets_discount_code')}:
        </p>
        <Input
          type="text"
          value={discountCode}
          onChange={(e) =>
            setDiscountCode(normalizeDiscountCode(e.target.value))
          }
          placeholder={t(
            'bookings_dates_step_tickets_discount_code_placeholder',
          )}
          className="uppercase"
        />
        <Button
          variant="inline"
          onClick={handleApplyDiscountCode}
          isEnabled={!!(discountCode && selectedTicketOption)}
          className="mt-4 ml-0 sm:mt-0 sm:ml-4"
          title={t('apply_submit_button_help')}
        >
          {t('apply_submit_button')}
        </Button>
      </div>
      <div>
        {discountResult && discountResult.status === 'success' && (
          <p className="rounded-md bg-green-100 px-4 py-2 mt-6">
            {t('events_slug_checkout_discount_success')}.{' '}
            {t('events_slug_checkout_discount_success_message')}
            {discountResult.discountPercent !== 0 &&
              ` ${discountResult.discountPercent * 100}% `}
            {discountResult.discountType === 'val' &&
              ` ${priceFormat(
                discountResult.discountVal,
                discountResult.currency ?? selectedTicketOption?.currency,
              )} `}
            {t('events_slug_checkout_discount_success_message_part_2')}
          </p>
        )}
        {discountResult?.status === 'fail' &&
          discountResult.reason === 'ticket_mismatch' && (
            <p className="rounded-md bg-red-50 text-red-500 px-4 py-2 mt-6">
              {t('events_slug_checkout_discount_ticket_mismatch', {
                ticketName: discountResult.applicableTicketName || '',
              })}
            </p>
          )}
        {discountResult?.status === 'fail' &&
          discountResult.reason !== 'ticket_mismatch' && (
            <p className="rounded-md bg-red-50 text-red-500 px-4 py-2 mt-6">
              {t('listings_slug_checkout_discount_error')}
            </p>
          )}
        {requestError && (
          <p className="rounded-md bg-red-50 text-red-500 px-4 py-2 mt-6">
            {t('discount_code_request_error')}
          </p>
        )}
      </div>
    </div>
  );
};

export default DiscountCode;
