import { ReactNode } from 'react';

import { twMerge } from 'tailwind-merge';

import CloseIcon from './icons/CloseIcon';
import { MouseEvent } from 'react';

interface Props {
  children: ReactNode;
  closeModal: (event: MouseEvent<HTMLButtonElement>) => void;
  doesShowVideo?: boolean;
  className?: string;
}

const Modal = ({ children, closeModal, doesShowVideo, className }: Props) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      <button className="fixed inset-0 bg-black opacity-50" onClick={closeModal} />
      <div
        className={`p-4 rounded-t-xl sm:rounded-md relative bg-white z-[101] shadow-lg max-h-[92vh] sm:max-h-[85vh] overflow-y-auto ${twMerge(
          'w-full sm:p-8 md:w-[500px]',
          className,
          doesShowVideo ? 'pt-20 sm:pt-20 md:w-[850px] md:h-[600px]' : '',
        )}`}
      >
        <button
          className="absolute top-3 right-3 sm:top-4 sm:right-4 text-2xl z-10"
          onClick={closeModal}
        >
          <CloseIcon />
        </button>

        <div
          className={`flex flex-col ${twMerge(
            '',
            doesShowVideo ? 'h-[300px] sm:h-[450px]' : '',
          )}`}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
