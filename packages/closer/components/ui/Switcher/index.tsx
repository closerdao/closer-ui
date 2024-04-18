import { Dispatch, SetStateAction } from 'react';

import { CloserCurrencies } from '../../../types';
import { capitalizeFirstLetter } from '../../../utils/learn.helpers';

interface Props {
  options: string[] | null;
  selectedOption: string | CloserCurrencies;
  setSelectedOption: Dispatch<SetStateAction<string | CloserCurrencies>>;
  optionsTitles?: string[];
  isTokenPaymentAvailable?: boolean;
}

const Switcher = ({
  options,
  selectedOption,
  setSelectedOption,
  optionsTitles,
  isTokenPaymentAvailable,
}: Props) => {
  const isButtonDisabled = (options: string[], i: number) => {
    if (isTokenPaymentAvailable === undefined) {
      return options[i] === selectedOption;
    }
    if (isTokenPaymentAvailable === true) {
      return i === options.length || options[i] === selectedOption;
    }
    if (isTokenPaymentAvailable === false) {
      return i === options.length - 1 || options[i] === selectedOption;
    }
  };

  return (
    <>
      {options && (
        <div className="border border-gray-600 rounded-[19px] w-full flex gap-0 flex-wrap p-[2px]">
          {options?.map((option, i) => (
            <button
              disabled={isButtonDisabled(options, i)}
              onClick={() => {
                setSelectedOption(option);
              }}
              className={`whitespace-nowrap rounded-full px-3 flex-1 text-center py-1 ${
                option !== selectedOption ? 'bg-white ' : 'bg-accent-light'
              }  ${
                isButtonDisabled(options, i) &&
                !isTokenPaymentAvailable &&
                option !== selectedOption
                  ? 'text-disabled'
                  : 'text-black'
              } 
            
              `}
              key={option}
            >
              {optionsTitles ? optionsTitles[i] : capitalizeFirstLetter(option)}
            </button>
          ))}
        </div>
      )}
    </>
  );
};

export default Switcher;
