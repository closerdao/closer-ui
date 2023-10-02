import React from "react";
import Flogo from "../../public/assets/svg/Footers.svg";
import Flogo2 from "../../public/assets/svg/Facebook.svg";
import Flogo3 from "../../public/assets/svg/Linkedin.svg";
import Flogo4 from "../../public/assets/svg/Instagram.svg";
import Flogo5 from "../../public/assets/svg/Youtube.svg";
import Flogo6 from "../../public/assets/svg/Twitter.svg";
import Flogo7 from "../../public/assets/svg/Email.svg";
import Flogo8 from "../../public/assets/svg/Location.svg";
import Image from "next/image";
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
            <Image src={Flogo2} alt="" className="cursor-pointer" />
            <Image src={Flogo3} alt="" className="mx-3 cursor-pointer" />
            <Image src={Flogo4} alt="" className="cursor-pointer" />
            <Image src={Flogo5} alt="" className="mx-3 cursor-pointer" />
            <Image src={Flogo6} alt="" className="cursor-pointer" />
          </div>
          <p className="mt-5 font-urbanist font-[400] text-sm md:text-xs lg:text-sm text-[#A5A5A5]">
            © Copyright 2023
          </p>
        </div>

        <div className="md:mx-auto mt-5 md:mt-0">
          <p className=" font-urbanist font-[400] text-sm md:text-xs lg:text-sm text-[#A5A5A5]">
            Home
          </p>
          <p className="mt-5 font-urbanist font-[400] text-sm md:text-xs lg:text-sm text-[#A5A5A5]">
            Product
          </p>
          <p className="mt-5 font-urbanist font-[400] text-sm md:text-xs lg:text-sm text-[#A5A5A5]">
            Journey
          </p>
          <p className="mt-5 font-urbanist font-[400] text-sm md:text-xs lg:text-sm text-[#A5A5A5]">
            Innovators
          </p>
          <p className="mt-5 font-urbanist font-[400] text-sm md:text-xs lg:text-sm text-[#A5A5A5]">
            Investment
          </p>
        </div>

        <div className="md:mx-auto mt-5 md:mt-0">
          <p className=" font-urbanist font-[400] text-sm md:text-xs lg:text-sm text-[#A5A5A5]">
            Terms & Conditions
          </p>
          <p className="mt-5 font-urbanist font-[400] text-sm md:text-xs lg:text-sm text-[#A5A5A5]">
            Privacy Policy
          </p>
          <p className="mt-5 font-urbanist font-[400] text-sm md:text-xs lg:text-sm text-[#A5A5A5]">
            Cookies Policy
          </p>
        </div>

        <div className="md:mx-auto mt-5 md:mt-0">
          <div className="flex">
            <Image src={Flogo7} alt="" className="cursor-pointer" />
            <p className="self-center ml-2  font-urbanist font-[400] text-sm md:text-xs lg:text-sm text-[#A5A5A5]">
              info@closer.earth
            </p>
          </div>

          <div className="flex mt-5">
            <Image src={Flogo8} alt="" className="cursor-pointer" />
            <p className="self-center ml-2  font-urbanist font-[400] text-sm md:text-xs lg:text-sm text-[#A5A5A5]">
              Join our community
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
