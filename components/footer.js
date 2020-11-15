import React from 'react'
import Newsletter from '../components/newsletter'
import Link from 'next/link'
import api from '../utils/api'
import { trackEvent } from './analytics'

const footer = ({ articles, originalUrl, tags }) => (
  <footer>
    <div className="inner">
      <div className="columns">
        <div className="col lg">
          <img src="/images/logo/logo.png" height="80" alt="gathering" />
          <img src="/images/logo/name.png" height="80" alt="re:build" />
        </div>
        <div className="col">
          <div className="social-links">
            <a href="https://instagram.com/re_buildco" target="_blank" rel="noreferrer nofollow">
              <img src="/images/icons/instagram.svg" width="30" alt="instagram" />
            </a>
            <a href="https://www.facebook.com/rebuildgathering" target="_blank" rel="noreferrer nofollow">
              <img src="/images/icons/facebook.svg" width="30" alt="facebook" />
            </a>
            <a href="https://twitter.com/re_buildco" target="_blank" rel="noreferrer nofollow">
              <img src="/images/icons/twitter.svg" width="30" alt="twitter" />
            </a>
          </div>
        </div>
      </div>
    </div>
  </footer>
);

export default footer;
