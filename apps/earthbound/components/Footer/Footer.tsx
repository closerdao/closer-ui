import Link from 'next/link';

import { FC } from 'react';

import { RiFacebookFill } from '@react-icons/all-files/ri/RiFacebookFill';
import { useConfig } from 'closer';

export const Footer: FC = () => {
  const { INSTAGRAM_URL, FACEBOOK_URL, TEAM_EMAIL } = useConfig() || {};

  return (
    <footer className="w-full mt-8 mx-auto text-center max-w-prose ">
      <div className="p-6  italic">
        <div>
          For any visits, bookings or enquiries you can contact us by email: 
          <a href={`mailto:${TEAM_EMAIL}`}>{TEAM_EMAIL}</a>
          <ul>
            <li>
              <span>Phone:</span>{' '}
              <a className="underline" href="tel:+46722362135">
                +46 72 236 2135
              </a>
            </li>
            <li>
              <a className="underline" href="/pages/community#faq">
                FAQ
              </a>
            </li>
          </ul>
        </div>

        <div className=" mt-4 flex flex-row justify-center">
          <a
            href="https://t.me/earthboundecovillage"
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
          <p>
            Platform developed by <a href="https://closer.earth">Closer</a>.
          </p>
          <p>
            <Link href="https://docs.google.com/document/d/1EL1fPVq0octTpe6mOZVREbX3CYtacILh88OQmTpjGDU/edit?tab=t.0#heading=h.51685m1645be">
              Privacy policy
            </Link>
          </p>
        </div>
        <p className="mt-6">
          Logo and icons designed by{' '}
          <a href="https://www.instagram.com/zu_sun_na/">Zuzanna Bączyk</a>
        </p>
      </div>
    </footer>
  );
};
