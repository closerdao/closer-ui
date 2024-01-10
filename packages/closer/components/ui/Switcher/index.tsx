import { Dispatch, SetStateAction } from 'react';

import { CloserCurrencies } from '../../../types';
import { capitalizeFirstLetter } from '../../../utils/learn.helpers';

interface Props {
  options: string[] | null;
  selectedOption: string | CloserCurrencies | null;
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
    if (options[i] === selectedOption) {
      return true
    }
    if (options[i] === CloserCurrencies.Token && isTokenPaymentAvailable) {
      return false
    }
    if (!options.includes(CloserCurrencies.Token)) {
      return false
    }
    return true
  };

  return (
    <>
      {options && (
        <div className="border border-gray-600 rounded-2xl sm:rounded-full w-full flex flex-col sm:flex-row p-[2px]">
          {options?.map((option, i) => (
            <button
              disabled={isButtonDisabled(options, i)}
              onClick={() => {
                setSelectedOption(option);
              }}
              className={` rounded-full  flex-1 text-center py-1 ${
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
