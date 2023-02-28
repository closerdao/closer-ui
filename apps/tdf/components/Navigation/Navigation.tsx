import Link from 'next/link';

import React from 'react';

export const Navigation = () => (
  <header className="navigation flex justify-between items-center mb-4 mx-auto max-w-3xl w-full">
    <h2 className="text-xl font-display font-black">
      <Link
        href="/"
        className="flex flex-row no-underline justify-start tracking-widest items-center"
      >
        <img src="/images/logo.png" width="60" alt="TDF" />
        <span className="ml-2 text-black hover:text-gray-800 tracking-tighter no-underline">
          Traditional Dream Factory
        </span>
      </Link>
    </h2>
    <Link href="/events" className="text-black no-underline italic font-bold">
      Events
    </Link>
  </header>
);
