import PropTypes from 'prop-types';

import CloseIcon from './icons/CloseIcon.js';

const MenuContainer = ({ isOpen, toggleNav, children }) => {
  return (
    <>
      <button className="space-y-2" onClick={toggleNav}>
        <span className="block rounded-full ml-3 w-5 h-0.5 bg-black"></span>
        <span className="block rounded-full w-8 h-0.5 bg-black"></span>
        <span className="block rounded-full w-5 h-0.5 bg-black"></span>
      </button>
      <div
        className={
          isOpen
            ? 'w-full h-full fixed inset-0'
            : 'w-full h-full fixed inset-0 invisible'
        }
      >
        <div
          className={
            isOpen
              ? 'w-full h-full duration-500 ease-out transition-all inset-0 absolute bg-gray-900 opacity-50'
              : 'w-full h-full duration-500 ease-out transition-all inset-0 absolute bg-gray-900 opacity-0'
          }
        />
        <div
          className={
            isOpen
              ? 'md:max-w-sm w-full bg-white h-full absolute right-0 duration-300 ease-out transition-all'
              : 'md:max-w-sm w-full bg-white h-full absolute right-0 duration-300 ease-out transition-all translate-x-full'
          }
        >
          <div
            onClick={toggleNav}
            className="absolute cursor-pointer text-gray-600 top-6 left-5 z-20"
          >
            <CloseIcon />
          </div>
          <div className="pt-20 px-8 relative w-full flex flex-col gap-4 z-10">
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
