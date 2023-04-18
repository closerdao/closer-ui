import { Dispatch, SetStateAction } from 'react';

import Heading from '../ui/Heading';
import Input from '../ui/Input';

interface Props {
  setDiscountCode: Dispatch<SetStateAction<string>>;
  discountCode: string;
}

const DiscountCode = ({ setDiscountCode, discountCode }: Props) => {
  return (
    <div>
      <Heading level={3} className="mb-4">
        I have a discount code
      </Heading>
      <Input
        type="text"
        value={discountCode}
        onChange={(e) => setDiscountCode(e.target.value)}
      />
      {/* TODO: validate disount code in the background? */}
    </div>
  );
};

export default DiscountCode;
