import Link from 'next/link';

import { FC } from 'react';

import { useConfig } from '../hooks/useConfig';

const Logo: FC = () => {
  const config = useConfig();
  const { LOGO_HEADER, PLATFORM_NAME } = config || {};

  return (
    <Link href="/" className="block">
      {LOGO_HEADER ? (
        <img src={LOGO_HEADER} alt={PLATFORM_NAME} className="h-12" />
      ) : (
        PLATFORM_NAME
      )}
    </Link>
  );
};

export default Logo;
