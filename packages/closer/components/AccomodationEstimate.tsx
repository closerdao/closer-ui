import { FC } from 'react';

import { useConfig } from '../hooks/useConfig';
import { __ } from '../utils/helpers';

interface Props {
  weeksNumber: string;
  setWeeksNumber: (value: string) => void;
  selectedAccomodation: string;
  selectAccomodation: (value: string) => void;
}

const AccomodationEstimate: FC<Props> = ({
  weeksNumber,
  setWeeksNumber,
  selectedAccomodation,
  selectAccomodation,
}) => {
  const config = useConfig();
  const { ACCOMODATION_COST } = config || {};
  return (
    <p className="flex flex-wrap self-center mt-8 md:mt-28 items-center gap-4 text-center md:text-left">
      <span className="text-2xl leading-8 w-1/2 md:w-fit">
        {__('token_sale_page_I_want_stay')}
      </span>
      <input
        type="number"
        value={weeksNumber}
        onChange={(e) => setWeeksNumber(e.target.value)}
        min={1}
        max={52}
        step={1}
        className="inline w-16 m-0 mx-2 text-2xl bg-accent-light rounded-full px-4 !text-accent !border-none"
      />
      <span className="text-2xl leading-8 w-full md:w-auto">
        {__('token_sale_page_stay_weeks')}
      </span>
      <select
        value={selectedAccomodation}
        onChange={(e) => selectAccomodation(e.target.value)}
        className="flex-1 h-12 mx-2 mt-4 md:mt-0 py-1 px-4 rounded-full text-2xl bg-accent-light text-accent !border-none"
      >
        {ACCOMODATION_COST.map((accomodation: { name: string }) => (
          <option key={accomodation.name} value={accomodation.name}>
            {accomodation.name}
          </option>
        ))}
      </select>
      <span className="text-2xl leading-8 flex-auto mt-4 md:mt-0">
        {__('token_sale_page_I_should_buy')}
      </span>
    </p>
  );
};

export default AccomodationEstimate;
