import React from 'react';
import Link from 'next/link';
import Flogo from '../../public/assets/svg/Footers.svg';
import LinkedIn from '../../public/assets/svg/Linkedin.svg';
import Instagram from '../../public/assets/svg/Instagram.svg';
import Twitter from '../../public/assets/svg/Twitter.svg';
import Email from '../../public/assets/svg/Email.svg';
import Location from '../../public/assets/svg/Location.svg';
import Image from 'next/image';
export default function Footer() {
  return (
    <div className="bg-[#171717] py-20 ">
      <div className="grid md:grid-cols-4 w-[90%] xl:w-[80%] 2xl:w-[1100px] mx-auto">
        <div>
          <Image src={Flogo} alt="" />
          <p className="mt-5 font-urbanist font-[400] text-sm md:text-xs lg:text-sm text-[#A5A5A5]">
            The operating system for regenerative communities.
          </p>
          <div className="flex mt-5">
            <Link href="https://www.linkedin.com/company/proofofpresenceprotocol/">
              <Image src={LinkedIn} alt="" className="mr-3 cursor-pointer" />
            </Link>
            <Link href="https://instagram.com/closerearth">
              <Image src={Instagram} alt="" className="mr-3 cursor-pointer" />
            </Link>
            <Link href="https://twitter.com/closerearth">
              <Image src={Twitter} alt="" className="cursor-pointer" />
            </Link>
          </div>
          <p className="mt-5 font-urbanist font-[400] text-sm md:text-xs lg:text-sm text-[#A5A5A5]">
            © Copyright {(new Date()).getFullYear()}
          </p>
        </div>

        <div className="md:mx-auto mt-5 md:mt-0">
          <div className="flex">
            <Image src={Email} alt="" className="cursor-pointer" />
            <Link
              href="mailto:team@closer.earth"
              className="self-center ml-2 font-urbanist font-[400] text-sm md:text-xs lg:text-sm text-[#A5A5A5] cursor-pointer"
            >
              team@closer.earth
            </Link>
          </div>

          <div className="flex mt-5">
            <Image src={Location} alt="" className="cursor-pointer" />
            <Link
              href="https://t.me/+rdZvSdohTzs0Njlh"
              className="self-center ml-2 font-urbanist font-[400] text-sm md:text-xs lg:text-sm text-[#A5A5A5] cursor-pointer"
            >
              Join our community
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
