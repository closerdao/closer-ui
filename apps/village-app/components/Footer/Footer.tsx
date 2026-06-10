import Link from 'next/link';

import { FC } from 'react';

import { RiFacebookFill } from '@react-icons/all-files/ri/RiFacebookFill';
import { useConfig } from 'closer';

export const Footer: FC = () => {
  const {
    FACEBOOK_URL,
    INSTAGRAM_URL,
    PLATFORM_NAME,
    SEMANTIC_URL,
    TEAM_EMAIL,
    TELEGRAM_URL,
    TWITTER_URL,
  } = useConfig() || {};
  const platformName = PLATFORM_NAME || 'This village';
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mx-auto mt-8 w-full max-w-prose text-center">
      <div className="p-6">
        {TEAM_EMAIL ? (
          <p>
            Contact{' '}
            <Link className="underline" href={`mailto:${TEAM_EMAIL}`}>
              {TEAM_EMAIL}
            </Link>
          </p>
        ) : null}

        <div className="mt-4 flex flex-row justify-center">
          {INSTAGRAM_URL && (
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              className="mr-2 p-2 transition ease-linear duration-1200 hover:scale-125"
              rel="noreferrer"
            >
              <svg
                className="h-10 w-10 text-accent"
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
          {TELEGRAM_URL && (
            <a
              href={TELEGRAM_URL}
              target="_blank"
              className="mr-2 p-2 transition ease-linear duration-1200 hover:scale-125"
              rel="noreferrer"
              title="Telegram"
            >
              <svg
                className="h-10 w-10 text-accent"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path stroke="none" d="M0 0h24v24H0z" />
                <path d="M15 10l-4 4l6 6l4 -16l-18 7l4 2l2 6l3 -4" />
              </svg>
            </a>
          )}
          {TWITTER_URL && (
            <a
              href={TWITTER_URL}
              target="_blank"
              rel="noreferrer nofollow"
              title="Follow us on X"
              className="mr-2 p-2 text-accent duration-300 hover:scale-110"
            >
              X
            </a>
          )}
          {FACEBOOK_URL && (
            <a
              href={FACEBOOK_URL}
              target="_blank"
              rel="noreferrer nofollow"
              title="Follow us on Facebook"
              className="pt-[12px] text-[30px] mr-2 rounded-full p-2 text-accent bg-transparent duration-300 hover:scale-110"
            >
              <RiFacebookFill />
            </a>
          )}
        </div>
        <div className="mt-12">
          <p>{`(c) ${currentYear} ${platformName}`}</p>
          {SEMANTIC_URL ? <p>{SEMANTIC_URL}</p> : null}
          <p className="mt-2">
            Platform developed by <a href="https://closer.earth">Closer</a>.
          </p>
        </div>
      </div>
    </footer>
  );
};
