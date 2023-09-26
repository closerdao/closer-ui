import CloseIcon from './icons/CloseIcon';

const Modal = ({ children, closeModal }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="fixed inset-0 bg-black opacity-50" onClick={closeModal} />
      <div className="rounded-md relative bg-white z-[101] shadow-lg max-w-lg w-full h-auto p-8 ">
        <button
          className="absolute top-4 right-4 text-2xl"
          onClick={closeModal}
        >
          <CloseIcon />
        </button>
        <div className="flex flex-col  h-full">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
