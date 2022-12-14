import Link from 'next/link';

import { LOGO_HEADER, LOGO_WIDTH, PLATFORM_NAME } from '../config';

const Logo = () => (
  <Link href="/">
    <a className="block">
      {LOGO_HEADER ? (
        <img
          src={LOGO_HEADER}
          alt={PLATFORM_NAME}
          width={LOGO_WIDTH}
          className="h-12"
        />
      ) : (
        PLATFORM_NAME
      )}
    </a>
  </Link>
);

export default Logo;
