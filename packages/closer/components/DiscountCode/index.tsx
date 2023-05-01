import {  ChangeEvent, Dispatch, SetStateAction } from 'react';

import { __ } from '../../utils/helpers';
import Heading from '../ui/Heading';
import Input from '../ui/Input';

interface Props {
  setDiscountCode: Dispatch<SetStateAction<string>>;
  discountCode: string;
}

const DiscountCode = ({ setDiscountCode, discountCode }: Props) => {
  return (
    <div className="flex basis-20">
      <Heading level={4} className="text-[14px] mt-2 basis-1/2">
        {__('bookings_dates_step_tickets_discount_code')}:
      </Heading>
      <Input  
        type="text"
        value={discountCode}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setDiscountCode(e.target.value ) as any}
        placeholder="enter code"
        className=""
      />
    </div>
  );
};

export default DiscountCode;
