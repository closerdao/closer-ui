import Image from 'next/image';

import { parseMessageFromError } from '../../../utils/common';

interface ErrorMessageProps {
  error: unknown;
}

const ErrorMessage = ({ error }: ErrorMessageProps) => {
  const errorMessage = parseMessageFromError(error);
  return (
    <div className="text-error mb-4 py-2 flex">
      <div className="align-top mr-2 w-5 h-5 pt-1">
        <Image src="/images/icon-info.svg" width={16} height={16} alt="Error" />
      </div>

      <p className="break-words w-[90%]">{String(errorMessage)}</p>
    </div>
  );
};

export default ErrorMessage;
