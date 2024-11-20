import Link from 'next/link';

import { FC } from 'react';

import { useConfig } from 'closer';

export const Footer: FC = () => {
  const { INSTAGRAM_URL, TWITTER_URL } = useConfig() || {};

  return (
    <footer className="w-full mt-8 mx-auto text-center max-w-prose">
      <div className="p-6 text-gray-700 italic">
        <p>
          Platform developed by <a href="https://closer.earth">Closer</a>.
        </p>

        <p>
          <Link href="/legal/terms">Terms of use</Link> |{' '}
          <Link href="/pdf/PP-FozdaCova.World.pdf">Privacy policy</Link>
        </p>
        <div className="social mt-4 flex flex-row justify-center">
          {INSTAGRAM_URL && (
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              className="mr-2 p-2 transition ease-linear duration-1200 hover:scale-125"
              rel="noreferrer"
            >
              <svg
                className="h-8 w-8 text-accent"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {' '}
                <path stroke="none" d="M0 0h24v24H0z" />{' '}
                <rect x="4" y="4" width="16" height="16" rx="4" />{' '}
                <circle cx="12" cy="12" r="3" />{' '}
                <line x1="16.5" y1="7.5" x2="16.5" y2="7.501" />
              </svg>
            </a>
          )}
          {TWITTER_URL && (
            <a
              href={TWITTER_URL}
              target="_blank"
              className="mr-2 p-2 transition ease-linear duration-1200 hover:scale-125"
              rel="noreferrer"
            >
              <svg
                className="h-8 w-8 text-accent"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {' '}
                <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
              </svg>
            </a>
          )}
        </div>
      </div>
    </footer>
  );
};
