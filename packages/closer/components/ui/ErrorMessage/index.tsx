import React from 'react';

interface ErrorMessageProps {
  children: React.ReactNode;
}

const ErrorMessage = ({ children }: ErrorMessageProps) => {
  return <p className="text-red-500 mb-4">{children}</p>;
};

export default ErrorMessage;
