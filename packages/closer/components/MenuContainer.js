import PropTypes from 'prop-types';
import { useEffect, useRef } from 'react';

import CloseIcon from './icons/CloseIcon.js';

const MenuContainer = ({ isOpen, toggleNav, children }) => {
  const menuRef = useRef(null);

  const menuClassnames = {
    container: 'w-full h-full fixed inset-0 z-[110]',
    overlay:
      'w-full h-full duration-500 ease-out transition-all inset-0 absolute bg-gray-900',
    slider:
      'md:max-w-sm w-full bg-white h-full absolute right-0 duration-300 ease-out transition-all overflow-y-auto',
  };

  const handleClickOutside = (event) => {
    if (menuRef.current && !menuRef.current.contains(event.target)) {
      toggleNav();
    }
  };

  const handleEscKey = (event) => {
    if (event.key === 'Escape' && isOpen) {
      toggleNav();
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscKey);
    } 

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen]); 


  return (
    <>
      <button className="space-y-2" onClick={toggleNav}>
        <span className="block rounded-full ml-3 w-5 h-0.5 bg-black"></span>
        <span className="block rounded-full w-8 h-0.5 bg-black"></span>
        <span className="block rounded-full w-5 h-0.5 bg-black"></span>
      </button>
      <div
        className={
          isOpen ? menuClassnames.container : `${menuClassnames.container} invisible`
        }
        ref={menuRef}
      >
        <div
          className={
            isOpen
              ? `${menuClassnames.overlay} opacity-50`
              : `${menuClassnames.overlay} opacity-0`
          }
          onClick={toggleNav} 
        />
        <div
          className={
            isOpen
              ? `${menuClassnames.slider} translate-x-0`
              : `${menuClassnames.slider} translate-x-full`
          }
        >
          <button
            onClick={toggleNav}
            aria-label="Close menu"
            className="absolute top-4 right-8 z-20 flex h-8 w-8 items-center justify-center rounded-lg border border-current text-accent transition-colors hover:bg-accent-light"
          >
            <CloseIcon className="h-4 w-4" strokeWidth={1} />
          </button>
          {/* pt-16 keeps the first row of content clear of the close button. */}
          <div className="pt-16 pb-12 px-8 relative w-full flex flex-col gap-4 z-10">
            {children}
          </div>
        </div>
      </div>
    </>
  );
};

MenuContainer.propTypes = {
  children: PropTypes.node,
  isOpen: PropTypes.bool,
  toggleNav: PropTypes.func,
};

export default MenuContainer;