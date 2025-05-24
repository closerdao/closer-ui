import Link from 'next/link';

import { FC } from 'react';

import { RiFacebookFill } from '@react-icons/all-files/ri/RiFacebookFill';
import { useConfig } from 'closer';

export const Footer: FC = () => {
  const { INSTAGRAM_URL, FACEBOOK_URL, TEAM_EMAIL } = useConfig() || {};
  

  return (
    <footer className="w-full mt-8 mx-auto text-center max-w-prose pb-20">
      <div className="p-6  italic">
        <p>
          For any visits, bookings or enquiries you can contact us by email: 
          <a href={`mailto:${TEAM_EMAIL}`}>
            {TEAM_EMAIL}
          </a>
        </p>
  

        <div className="social mt-4 flex flex-row justify-center">
          <a
            href="https://t.me/+rdZvSdohTzs0Njlh"
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
              <path d="M15 10l-4 4l6 6l4 -16l-18 7l4 2l2 6l3 -4" />
            </svg>
          </a>

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
          {FACEBOOK_URL && (
            <a
              href={FACEBOOK_URL}
              target="_blank"
              rel="noreferrer nofollow"
              title="Follow us on Facebook"
              className="text-2xl mr-2 rounded-full p-2 text-accent bg-transparent duration-300 hover:scale-110"
            >
              <RiFacebookFill />
            </a>
          )}
        </div>
        <div className='mt-12'>
          <p>
            Platform developed by <a href="https://closer.earth">Closer</a>.
          </p>
          <p>
            <Link href="/pdf/Closer-PP.pdf">
              Privacy policy
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
};
