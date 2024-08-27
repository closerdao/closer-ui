import Link from 'next/link';

import { ReactNode } from 'react';

interface Props {
  href?: string;
  children: ReactNode;
  target?: string;
  isButton?: boolean;
  onClick?: () => void;
}
const NavLink = ({ href, children, target, isButton, onClick }: Props) => {
  return (
    <>
      {isButton ? (
        <button
          onClick={onClick}
          className="rounded-full w-full text-lg py-1.5 px-4 text-left hover:bg-accent-light"
        >
          {children}
        </button>
      ) : (
        <Link
          target={target}
          className="rounded-full w-full  bg-white  text-lg py-1.5 px-4  hover:bg-accent-light"
          href={href || ''}
        >
          {children}
        </Link>
      )}
    </>
  );
};

export default NavLink;
