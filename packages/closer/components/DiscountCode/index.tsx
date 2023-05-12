import { Dispatch, SetStateAction, useState } from 'react';

import { TicketOption } from '../../types';
import api from '../../utils/api';
import { __, priceFormat } from '../../utils/helpers';
import { Button } from '../ui';
import Heading from '../ui/Heading';
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
        <Heading level={4} className="text-[14px] mt-2 basis-1/2 mb-4 sm: mb-0">
          {__('bookings_dates_step_tickets_discount_code')}:
        </Heading>
        <Input
          type="text"
          value={discountCode}
          onChange={(value) => setDiscountCode(value)}
          placeholder={__('bookings_dates_step_tickets_discount_code_placeholder')}
          className=""
        />
        <Button
          type="inline"
          onClick={handleApplyDiscountCode}
          isEnabled={!!(discountCode && selectedTicketOption)}
          className='mt-4 ml-0 sm:mt-0 sm:ml-4'
          title={__('apply_submit_button_help')}
        >
          {__('apply_submit_button')}
        </Button>
      </div>
      <div>
        {discountResult && discountResult.status === 'success' && (
          <p className="rounded-md bg-green-100 px-4 py-2 mt-6">
            {__('events_slug_checkout_discount_success')}.{' '}
            {__('events_slug_checkout_discount_success_message')}
            {discountResult.discountPercent !== 0 &&
              ` ${discountResult.discountPercent * 100}% `}
            {discountResult.discountType === 'val' &&
              ` ${priceFormat(
                discountResult.discountVal,
                selectedTicketOption?.currency,
              )} `}
            {__('events_slug_checkout_discount_success_message_part_2')}
          </p>
        )}
        {discountResult && discountResult.status === 'fail' && (
          <p className="rounded-md bg-red-50 text-red-500 px-4 py-2 mt-6">
            {__('listings_slug_checkout_discount_error')}
          </p>
        )}
      </div>
    </div>
  );
};

export default DiscountCode;
