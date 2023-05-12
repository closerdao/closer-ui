import { parseMessageFromError } from '../../../utils/common';

interface ErrorMessageProps {
  error: unknown;
}

const ErrorMessage = ({ error }: ErrorMessageProps) => {
  const errorMessage = parseMessageFromError(error);
  return <p className="text-error mb-4 py-2 bg-red-100 rounded-md px-4">{String(errorMessage)}</p>;
};

export default ErrorMessage;
