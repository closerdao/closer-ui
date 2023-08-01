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
          className="text-center w-full rounded-full border-2 border-accent bg-white uppercase font-bold text-accent text-xl py-1 px-4 hover:text-white hover:bg-accent"
        >
          {children}
        </button>
      ) : (
        <Link
          target={target}
          className="text-center w-full rounded-full border-2 border-accent bg-white uppercase font-bold text-accent text-xl py-1 px-4 hover:text-white hover:bg-accent"
          href={href || ''}
        >
          {children}
        </Link>
      )}
    </>
  );
};

export default NavLink;
