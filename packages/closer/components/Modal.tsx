import { ReactNode } from 'react';

import { twMerge } from 'tailwind-merge';

import CloseIcon from './icons/CloseIcon';

interface Props {
  children: ReactNode;
  closeModal: () => void;
  doesShowVideo?: boolean;
}

const Modal = ({
  children,
  closeModal,
  doesShowVideo,
}: Props) => {

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="fixed inset-0 bg-black opacity-50" onClick={closeModal} />
      <div
        className={` relative bg-white z-[101] shadow-lg   ${twMerge(
          ' w-full h-full md:h-2/3 sm:p-8 md:w-[500px]',
          doesShowVideo ? 'pt-20 sm:pt-20 md:w-[850px] md:h-[600px]' : '',

        )} `}
      >
        <button
          className="absolute top-8 right-8 text-2xl"
          onClick={closeModal}
        >
          <CloseIcon />
        </button>

        <div className={`flex flex-col justify-center  ${twMerge(
          'h-full',
          doesShowVideo ? 'h-[300px] sm:h-[450px]' : ''

        )}`}>{children}</div>
      </div>
    </div>
  );
};

export default Modal;