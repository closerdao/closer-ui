import { parseMessageFromError } from '../../../utils/common';

interface ErrorMessageProps {
  error: unknown;
}

const ErrorMessage = ({ error }: ErrorMessageProps) => {
  const errorMessage = parseMessageFromError(error);
  return <p className="text-red-500 mb-4">{String(errorMessage)}</p>;
};

export default ErrorMessage;
