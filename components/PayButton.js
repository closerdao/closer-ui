import Spinner from './Spinner';

export const PayButton = ({
  disabled,
  className = 'btn-primary',
  isSpinnerVisible,
  buttonText,
}) => {
  return (
    <button
      type="submit"
      className={`${className} flex items-center justify-center`}
      disabled={disabled}
    >
      {isSpinnerVisible && (
        <span className="mr-2">
          <Spinner />
        </span>
      )}
      <span>{buttonText}</span>
    </button>
  );
};
