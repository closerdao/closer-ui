import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router';
import { trackEvent } from './analytics'
import { logout, isSignedIn } from '../utils/auth'


const nav = ({ projectsArticles, signedIn }) => {
  const [navOpen, toggleNav] = useState(false);
  const router = useRouter();

  return (
    <div className="NavContainer">
      <nav className={`${navOpen?'open':'closed'}`}>

        {/* <div className="MenuItems">
          { signedIn ?
          [
            <Link href="/forum" key="forum">
              <a onClick={() => toggleNav(false)} className="MenuLink">Forum</a>
            </Link>,
            <Link href="/logout" key="logout">
              <a onClick={e => toggleNav(false) || e.preventDefault() || logout()} className="MenuLink">Logout</a>
            </Link>
          ]:
            <Link href="/join">
              <a onClick={() => toggleNav(false)} className="button white">Join us</a>
            </Link>
          }
        </div> */}
      </nav>
    </div>
  )
};

export default nav;
