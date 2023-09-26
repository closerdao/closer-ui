import { Dispatch, SetStateAction } from 'react';

interface Props {
  options: string[] | null;
  selectedOption: string;
  setSelectedOption: Dispatch<SetStateAction<string>>;
  optionsTitles?: string[]
}

const Switcher = ({ options, selectedOption, setSelectedOption, optionsTitles }: Props) => {
  return (
    <>
      {options && (
        <div className="border border-gray-600 rounded-full w-full flex p-[2px]">
          {options?.map((option, i) => (
            <button
              disabled={option === selectedOption}
              onClick={() => {
                setSelectedOption(option);
              }}
              className={`rounded-full bg-accent-light flex-1 text-center py-1 ${
                option !== selectedOption && 'bg-white'
              }`}
              key={option}
            >
              {optionsTitles ? optionsTitles[i] : option}
            </button>
          ))}
        </div>
      )}
    </>
  );
};

export default Switcher;
