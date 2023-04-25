import { Dispatch, SetStateAction } from 'react';

import Heading from '../ui/Heading';
import Input from '../ui/Input';
import { __ } from '../../utils/helpers';

interface Props {
  setDiscountCode: Dispatch<SetStateAction<string>>;
  discountCode: string;
}

const DiscountCode = ({ setDiscountCode, discountCode }: Props) => {
  return (
    <div className='flex basis-20'>
      <Heading level={3} className="text-[13px] mt-2 basis-1/2">
      {__('bookings_dates_step_tickets_discount_code')}:
      </Heading>
      <Input
        type="text"
        value={discountCode}
        onChange={(e) => setDiscountCode(e.target.value)}
        placeholder='enter code'
        className=''
      />
    </div>
  );
};

export default DiscountCode;
