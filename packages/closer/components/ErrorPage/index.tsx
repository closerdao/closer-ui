import { ReactNode } from 'react';

import Heading from '../ui/Heading';

interface ErrorPageProps {
  /** Large watermark above the title — a status code like "404", or an icon
   * when there is no meaningful code. */
  code?: ReactNode;
  title: string;
  /** Optional detail from the caller, e.g. "User may not access". */
  error?: string;
  /** Optional supporting sentence shown above the actions. */
  message?: string;
  /** Links or buttons offering a way out. */
  children?: ReactNode;
}

/**
 * Shared shell for the 404 / 401 / not-found pages so they stay visually
 * consistent. Styled with theme tokens only — every branded app renders this
 * in its own accent colour.
 */
const ErrorPage = ({ code, title, error, message, children }: ErrorPageProps) => (
  <main className="main-content page-not-found flex flex-1 flex-col items-center justify-center text-center min-h-[60vh] py-16">
    <div className="flex flex-col items-center gap-5 max-w-md w-full">
      {code && (
        <span
          aria-hidden="true"
          className="text-7xl sm:text-8xl font-bold leading-none text-accent opacity-30 select-none"
        >
          {code}
        </span>
      )}
      <Heading className="!text-3xl">{title}</Heading>
      {error && (
        <p className="text-sm text-gray-500 italic break-words">{error}</p>
      )}
      {message && <p className="text-gray-600">{message}</p>}
      {children && (
        <div className="flex flex-wrap gap-3 justify-center mt-2">
          {children}
        </div>
      )}
    </div>
  </main>
);

export default ErrorPage;
