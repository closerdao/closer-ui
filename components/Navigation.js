import React from 'react';
import Link from 'next/link';
import api from '../utils/api';

const header = () => (
  <header className="navigation flex justify-between items-center mb-4">
    <h2 className="text-xl font-bold font-display font-black">
      <Link href="/">
        <a className="flex flex-row no-underline justify-start tracking-widest items-center">
          <img src="/images/logo-sheep.png?transparent" width="60" alt="TDF"/>
          <span className="ml-2 text-black hover:text-gray-800 tracking-tighter no-underline">Traditional Dream Factory</span>
        </a>
      </Link>
    </h2>
    <Link href="/events">
      <a className="text-black no-underline italic font-bold">
        Events
      </a>
    </Link>
  </header>
);

export default header;
