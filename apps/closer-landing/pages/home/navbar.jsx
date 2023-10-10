import React from 'react';
import Link from 'next/link';
import Logo from '../../public/assets/svg/logo.svg';
import Image from 'next/image';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import AnchorLink from 'react-anchor-link-smooth-scroll';
import { Fragment } from 'react';
import { useState } from 'react';

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="bg-[#171717] py-4">
        <div className="main grid grid-cols-3 md:grid-cols-2 2xl:grid-cols-3 w-[90%] xl:w-[80%] 2xl:w-[1100px] mx-auto">
          <div className="flex 2xl:col-span-1">
            <Image src={Logo} alt="" />
            <p className="hidden md:block self-center ml-4 font-urbanist font-[700] text-[30px] text-white">
              Closer
            </p>
          </div>
          <div className="2xl:col-span-2 self-center justify-evenly hidden lg:flex">
            <AnchorLink href="#home" className="self-center">
              <p className="self-center cursor-pointer font-urbanist font-[300] text-sm xl:text-md text-white hover:bg-clip-text hover:text-transparent hover:bg-gradient-to-t from-[#67F8C0] to-[#3F91DD]">
                Home
              </p>
            </AnchorLink>
            <AnchorLink href="#product" className="self-center">
              <p className="self-center cursor-pointer font-urbanist font-[300] text-sm xl:text-md text-white hover:bg-clip-text hover:text-transparent hover:bg-gradient-to-t from-[#67F8C0] to-[#3F91DD]">
                Products
              </p>
            </AnchorLink>

            <AnchorLink href="#journey" className="self-center">
              <p className="self-center cursor-pointer font-urbanist font-[300] text-sm xl:text-md text-white hover:bg-clip-text hover:text-transparent hover:bg-gradient-to-t from-[#67F8C0] to-[#3F91DD]">
                Journey
              </p>
            </AnchorLink>

            <AnchorLink href="#innovator" className="self-center">
              <p className="self-center cursor-pointer font-urbanist font-[300] text-sm xl:text-md text-white hover:bg-clip-text hover:text-transparent hover:bg-gradient-to-t from-[#67F8C0] to-[#3F91DD]">
                Innovators
              </p>
            </AnchorLink>
            <p className="self-center cursor-pointer font-urbanist font-[300] text-sm xl:text-md text-white hover:bg-clip-text hover:text-transparent hover:bg-gradient-to-t from-[#67F8C0] to-[#3F91DD]">
              Investment
            </p>

            <Link
              href="mailto:team@closer.earth"
              target="_blank"
              className="font-urbanist font-[600] text-sm xl:text-md bg-clip-text text-transparent bg-gradient-to-r from-[#67F8C0] to-[#3F91DD] border-[1px] border-l-[#67F8C0] border-t-[#67F8C0] border-r-[#3F91DD] border-b-[#3F91DD] rounded-lg py-2 px-5"
            >
              Contact Us
            </Link>
          </div>
          <div className="block md:hidden">
            <p className="self-center ml-4 font-urbanist font-[700] text-[30px] text-white">
              Closer
            </p>
          </div>
          <div className="self-center ml-auto cursor-pointer block lg:hidden">
            <svg
              onClick={() => setOpen(true)}
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-8 h-8 text-white "
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              />
            </svg>
          </div>
        </div>
      </div>

      <Transition.Root show={open} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={setOpen}>
          <Transition.Child
            as={Fragment}
            enter="ease-in-out duration-500"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in-out duration-500"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
              <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-0">
                <Transition.Child
                  as={Fragment}
                  enter="transform transition ease-in-out duration-500 sm:duration-700"
                  enterFrom="translate-x-full"
                  enterTo="translate-x-0"
                  leave="transform transition ease-in-out duration-500 sm:duration-700"
                  leaveFrom="translate-x-0"
                  leaveTo="translate-x-full"
                >
                  <Dialog.Panel className="pointer-events-auto relative w-screen max-w-full">
                    <Transition.Child
                      as={Fragment}
                      enter="ease-in-out duration-500"
                      enterFrom="opacity-0"
                      enterTo="opacity-100"
                      leave="ease-in-out duration-500"
                      leaveFrom="opacity-100"
                      leaveTo="opacity-0"
                    >
                      <div className="absolute top-0 left-0 -ml-4 flex pt-4 pr-2 sm:-ml-10 sm:pr-4">
                        {/* <button
                          type="button"
                          className="rounded-md text-gray-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-white"
                          onClick={() => setOpen(false)}
                        >
                          <span className="sr-only">Close panel</span>
                          <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                        </button> */}
                      </div>
                    </Transition.Child>
                    <div className="flex w-[100%] ml-auto h-full flex-col overflow-y-scroll bg-[#171717]  py-3 shadow-xl">
                      <div class="container grid grid-cols-1 py-1">
                        <div class="flex justify-between">
                          <div className="w-[50%] px-3"></div>
                          <button
                            type="button"
                            className="mr-5 self-center rounded-md text-white  focus:outline-none"
                            onClick={() => setOpen(false)}
                          >
                            <span className="sr-only">Close panel</span>
                            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                          </button>
                        </div>
                        <AnchorLink href="#home">
                          <p
                            onClick={() => setOpen(false)}
                            className="text-center cursor-pointer pt-5 font-[400] font-urbanist text-[16px] text-white  "
                          >
                            Home
                          </p>
                        </AnchorLink>
                        <AnchorLink href="#product">
                          <p
                            onClick={() => setOpen(false)}
                            className="text-center cursor-pointer  mt-5 font-[400] font-urbanist text-[16px] text-white  "
                          >
                            Products
                          </p>
                        </AnchorLink>
                        <AnchorLink href="#journey">
                          <p
                            onClick={() => setOpen(false)}
                            className="text-center cursor-pointer  mt-5 font-[400] font-urbanist text-[16px] text-white  "
                          >
                            Journey
                          </p>
                        </AnchorLink>
                        <AnchorLink href="#innovator">
                          <p
                            onClick={() => setOpen(false)}
                            className="text-center cursor-pointer  mt-5 font-[400] font-urbanist text-[16px] text-white  "
                          >
                            Innovators
                          </p>
                        </AnchorLink>

                        <p className="text-center cursor-pointer  mt-5 font-[400] font-urbanist text-[16px] text-white  ">
                          Investment
                        </p>
                        <Link
                          href="mailto:team@closer.earth"
                          target="_blank"
                          className="w-[40%] mx-auto mt-10 font-urbanist font-[600] text-[15px] bg-clip-text text-transparent bg-gradient-to-t from-[#67F8C0] to-[#3F91DD] border-[1px] border-l-[#67F8C0] border-t-[#67F8C0] border-r-[#3F91DD] border-b-[#3F91DD] rounded-lg py-2 px-5"
                        >
                          Contact Us
                        </Link>
                      </div>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  );
}
