import CloseIcon from './icons/CloseIcon';

export const Modal = ({ children, closeModal }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="fixed inset-0 bg-black opacity-50" onClick={closeModal} />
      <div className="relative bg-white z-[101] shadow-lg max-w-lg w-full h-full p-8 md:h-1/2">
        <button
          className="absolute top-8 right-8 text-2xl"
          onClick={closeModal}
        >
          <CloseIcon />
        </button>
        <div className="flex flex-col justify-center h-full">{children}</div>
      </div>
    </div>
  );
};
