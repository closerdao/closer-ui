import { Dispatch, SetStateAction, useState } from 'react';

import { useTranslations } from 'next-intl';

import { TicketOption } from '../../types';
import api from '../../utils/api';
import { priceFormat } from '../../utils/helpers';
import { Button } from '../ui';
import Input from '../ui/Input';

interface Props {
  setDiscountCode: Dispatch<SetStateAction<string>>;
  discountCode: string;
  eventId?: string;
  selectedTicketOption?: TicketOption;
}

interface DiscountResult {
  status: string;
  discountType: string;
  discountVal: number;
  discountPercent: number;
}

const DiscountCode = ({
  setDiscountCode,
  discountCode,
  eventId,
  selectedTicketOption,
}: Props) => {
  const t = useTranslations();
  const [discountResult, setDiscountResult] = useState<DiscountResult>();
  const handleApplyDiscountCode = async () => {
    const res = await api.post('/bookings/validate-discount-code', {
      discountCode,
      eventId,
      ticketOption: selectedTicketOption,
    });
    setDiscountResult({ ...res.data });
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
          onChange={(e) => setDiscountCode(e.target.value)}
          placeholder={t(
            'bookings_dates_step_tickets_discount_code_placeholder',
          )}
          className=""
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
                selectedTicketOption?.currency,
              )} `}
            {t('events_slug_checkout_discount_success_message_part_2')}
          </p>
        )}
        {discountResult && discountResult.status === 'fail' && (
          <p className="rounded-md bg-red-50 text-red-500 px-4 py-2 mt-6">
            {t('listings_slug_checkout_discount_error')}
          </p>
        )}
      </div>
    </div>
  );
};

export default DiscountCode;
