import Link from 'next/link';

import { FC } from 'react';

import { useConfig } from '../hooks/useConfig';

const Logo: FC = () => {
  const config = useConfig();
  const { LOGO_HEADER, PLATFORM_NAME, APP_NAME } = config;

  return PLATFORM_NAME !== '[object Object]' ? (
    <Link href="/" className="block">
      {LOGO_HEADER ? (
        <>
          {APP_NAME === 'lios' && (
            <div className="overflow-hidden w-[60px] sm:w-full">
              <img
                src={LOGO_HEADER}
                alt={PLATFORM_NAME}
                className="h-12 object-cover object-left"
              />
            </div>
          )}
          {APP_NAME !== 'lios' && (
            <img
              src={LOGO_HEADER}
              alt={PLATFORM_NAME}
              className="h-12 object-cover object-left"
            />
          )}
        </>
      ) : (
        <div className="font-normal text-4xl tracking-wider">
          {PLATFORM_NAME}
        </div>
      )}
    </Link>
  ) : (
    <div></div>
  );
};

export default Logo;
