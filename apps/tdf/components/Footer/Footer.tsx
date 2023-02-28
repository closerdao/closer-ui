import { FC } from 'react';

export const Footer: FC = () => (
  <footer className="max-w-3xl m-full mx-auto">
    <div className="py-6 text-gray-400">
      <p>
        Traditional Dream Factory is the first village in the{' '}
        <a href="https://oasa.earth" target="_blank" rel="noreferrer">
          Oasa network
        </a>{' '}
        - it is located in Abela, Portugal. Logo designed by{' '}
        <a
          href="https://www.instagram.com/braulioamado/"
          rel="noreferrer nofollow"
          target="_blank"
        >
          braulioamado
        </a>
        .
      </p>
      <div className="social mt-4 flex flex-row">
        <a
          href="https://t.me/+7yBqlNOMbRtlZmFh"
          target="_blank"
          className="mr-2"
          rel="noreferrer"
        >
          <svg
            className="h-8 w-8 text-pink-500"
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
            <path d="M15 10l-4 4l6 6l4 -16l-18 7l4 2l2 6l3 -4" />
          </svg>
        </a>
        <a
          href="https://www.instagram.com/traditionaldreamfactory/"
          target="_blank"
          className="mr-2"
          rel="noreferrer"
        >
          <svg
            className="h-8 w-8 text-pink-500"
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
        <a
          href="https://twitter.com/tdfinyourdreams/"
          target="_blank"
          className="mr-2"
          rel="noreferrer"
        >
          <svg
            className="h-8 w-8 text-pink-500"
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
      </div>
    </div>
  </footer>
);
