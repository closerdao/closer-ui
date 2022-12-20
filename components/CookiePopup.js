import { useLocalStorage } from '../hooks/useLocalStorage';
import { __ } from '../utils/helpers';

const GdprCompliancePopup = () => {
  const [acceptedCookieWarning, setAcceptedCookieWarning] = useLocalStorage(
    'acceptedGdprCookie',
    false,
  );

  const onAccept = () => {
    setAcceptedCookieWarning(true);
  };

  if (acceptedCookieWarning) return null;

  return (
    <div className="absolute bottom-0 w-full bg-white shadow-2xl">
      <div className="main-content p-4 flex flex-col items-center md:flex-row md:px-8">
        <div className="md:mr-14">
          <h1 className="text-2xl font-normal">
            <span className="mr-1">🍪</span>
            <span>{__('gdpr-popup-title')}</span>
          </h1>
          <p className="mt-2">{__('gdpr-popup-description')}</p>
        </div>
        <div className="w-full my-4 flex flex-col gap-4 md:flex-row md:flex-1">
          <button
            className="btn uppercase w-full md:basis-1/2 h-fit"
            onClick={onAccept}
          >
            {__('gdpr-popup-button-accept')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GdprCompliancePopup;
