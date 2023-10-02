import React from "react";
import Ava from "../../public/assets/png/ava.png";
import Ava2 from "../../public/assets/png/ava2.png";
import Ava3 from "../../public/assets/png/ava3.png";
import Ava4 from "../../public/assets/png/ava4.png";
import Ava5 from "../../public/assets/png/ava5.png";
import Hire from "../../public/assets/svg/hire.svg";
import Image from "next/image";

const inno = [
  {
    img: Ava,
    title: "Sam (Founder)",
    moto: " Tech veteran with 10 years spanning startups to corporates.",
  },
  {
    img: Ava2,
    title: "Vlad (Fullstack Dev)",
    moto: "React maestro, turning code into intuitive interfaces.",
  },
  {
    img: Ava3,
    title: "Marvin (Web3 Dev)",
    moto: " Decentralized dev ace, hailing from Curve Labs.",
  },

  {
    img: Ava4,
    title: "Daneel (UX Lead)",
    moto: "Designer with a regenerative flair",
  },
  {
    img: Ava5,
    title: "Marek (Product Manager) ",
    moto: "Tech veteran with 10 years spanning startups to corporates.",
  },
];

export default function Meet() {
  return (
    <>
      <div
        id="innovator"
        className="bg-gradient-to-b from-[#67F8C0] to-[#3F91DD] py-20"
      >
        <div>
          <div className="w-[90%] xl:w-[60%] 2xl:w-[1100px] mx-auto text-center">
            <p className="global-txt font-urbanist font-[700] text-3xl md:text-2xl lg:text-3xl xl:text-4xl 2xl:text-2xl  text-[#171717]">
              Meet the Innovator
            </p>
            <p className="hidden md:block global-para mt-3 font-urbanist font-[400] text-sm md:text-xs lg:text-sm text-[#171717] ">
              Lorem ipsum dolor sit amet consectetur. Risus porttitor orci
              convallis turpis <br /> est leo tellus facilisi et. Consectetur
              pulvinar euismod
            </p>

            <p className="block md:hidden global-para mt-3 font-urbanist font-[400] text-sm md:text-xs lg:text-sm text-[#171717] ">
              Lorem ipsum dolor sit amet consectetur. Risus porttitor orci
              convallis turpis est leo tellus facilisi et. Consectetur pulvinar
              euismod
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 w-[80%] xl:w-[70%] 2xl:w-[1100px] mx-auto  gap-10 mt-10 pb-10 border-b-[1px] border-[#171717]">
          {inno.map((item, index) => (
            <div key={index} className="text-center">
              <Image
                src={item.img}
                className="mx-auto w-[30%] lg:w-[25%] xl:w-[20%]"
              />
              <p className="mt-2 font-urbanist font-[600] text-[#171717] text-xl md:text-sm lg:text-xl">
                {item.title}
              </p>
              <p className="line mt-2 font-urbanist font-[400] text-[#171717] text-sm md:text-xs lg:text-sm">
                {item.moto}
              </p>
            </div>
          ))}
        </div>

        <div className="w-[80%]  xl:w-[60%] 2xl:w-[1100px] mx-auto md:flex justify-between mt-10 ">
          <div className="flex ">
            <Image src={Hire} alt="" />
            <p className="ml-3 font-urbanist font-[500] text-xl md:text-sm lg:text-xl text-[#171717]">
              UI Designer
            </p>
          </div>

          <div className="flex mt-5 md:mt-0">
            <Image src={Hire} alt="" />
            <p className="ml-3 font-urbanist font-[500] text-xl md:text-sm lg:text-xl text-[#171717]">
              Fullstack dev
            </p>
          </div>

          <div className="flex mt-5 md:mt-0">
            <Image src={Hire} alt="" />
            <p className="ml-3 font-urbanist font-[500] text-xl md:text-sm lg:text-xl text-[#171717]">
              Devops
            </p>
          </div>

          <div className="flex mt-5 md:mt-0">
            <Image src={Hire} alt="" />
            <p className="ml-3 font-urbanist font-[500] text-xl md:text-sm lg:text-xl text-[#171717]">
              Head of sales
            </p>
          </div>
        </div>
      </div>

      <div className="bg-[#1C1C1C] py-20">
        <div className="bg-[#171717] w-[80%] xl:w-[70%] 2xl:w-[1100px] mx-auto  py-20 px-5 md:px-20   rounded-2xl">
          <p className="lines font-urbanist font-[700] text-lg md:text-xl lg:text-2xl xl:text-3xl text-white text-center">
            Driven by regeneration? Whether you're looking to fund impact drive
            technology solutions or pioneering new communities, we need you.
            Connect with Closer. Shape the future, pragmatically.
          </p>

          <button className="mt-5 mx-auto block py-3 px-6 rounded-xl bg-gradient-to-r from-[#67F8C0] to-[#3F91DD]  font-[700] font-urbanist text-[#171717] text-sm md:text-lg">
            Contact Us
          </button>
        </div>
      </div>
    </>
  );
}
