import React from 'react'
import Newsletter from '../components/newsletter'
import Link from 'next/link'
import api from '../utils/api'
import { trackEvent } from './analytics'

/*
 * Icons generated at https://www.tailwindtoolbox.com/icons
 */

const header = ({ articles, originalUrl, tags }) => (
  <header>
    <h2 className="text-xl font-bold font-display font-black">
      <Link href="/"><a className="flex flex-row no-underline justify-start tracking-widest items-center">
        <img src="/images/logo-sheep.png?transparent" width="60" alt="TDF"/>
        <span className="ml-2">Traditional Dream Factory</span>
      </a></Link>
    </h2>
  </header>
);

export default header;
