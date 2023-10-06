import React from 'react';
import Link from 'next/link';
import Ava from '../../public/assets/png/ava.png';
import Ava2 from '../../public/assets/png/ava2.png';
import Ava3 from '../../public/assets/png/ava3.png';
import Ava4 from '../../public/assets/png/ava4.png';
import Ava5 from '../../public/assets/png/ava5.png';
import Hire from '../../public/assets/svg/hire.svg';
import Image from 'next/image';

const inno = [
  {
    img: Ava,
    title: 'Sam (Founder)',
    moto: 'Sam, the founder of Closer, is a pioneer in the regenerative village movement and has over a decade of experience in both corporate and startup environments, driving forward the mission of regenerative living.',
  },
  {
    img: Ava2,
    title: 'Vlad (Fullstack Dev)',
    moto: 'Vlad, a seasoned full-stack interface developer, specializes in creating intuitive and user-centric digital interfaces, ensuring a smooth and engaging user experience.',
  },
  {
    img: Ava3,
    title: 'Marvin (Web3 Dev)',
    moto: 'Marvin, our web3 developer, leverages his experience gained at Curve Labs to enhance the technological backbone of our platform, bringing innovation and robustness to our regenerative ecosystem.',
  },

  {
    img: Ava4,
    title: 'Daneel (UX Lead)',
    moto: 'Daneel, our UX designer, is dedicated to shaping user-friendly and regenerative systems, drawing from a background of experience with organizations like Solve.earth.',
  },
  {
    img: Ava5,
    title: 'Marek (Product Manager) ',
    moto: 'Marek, our product manager, combines deep expertise in web3, DeFi, and DEX with a strong commitment to regenerative communities.',
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
            <p className="block global-para mt-3 font-urbanist font-[400] text-sm md:text-xs lg:text-sm text-[#171717] ">
              Our diverse team of passionate individuals brings a wealth of experience in technology, sustainability, and community-building, united by a shared vision to drive positive change through Closer.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 w-[80%] xl:w-[70%] 2xl:w-[1100px] mx-auto  gap-10 mt-10 pb-10 border-b-[1px] border-[#171717]">
          {inno.map((item, index) => (
            <div key={index} className="text-center">
              <Image
                src={item.img}
                alt={ item.title }
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
        <div className="bg-[#171717] w-[80%] xl:w-[70%] 2xl:w-[1100px] mx-auto  py-20 px-5 md:px-20 rounded-2xl text-center">
          <p className="lines font-urbanist font-[700] text-lg md:text-xl lg:text-2xl xl:text-3xl text-white">
            Driven by regeneration? Whether you're looking to fund impact drive
            technology solutions or pioneering new communities, we need you.
            Connect with Closer. Shape the future, pragmatically.
          </p>

          <Link
            href="mailto:team@closer.earth"
            target="_blank"
            className="mt-5 inline-block mx-auto block py-3 px-6 rounded-xl bg-gradient-to-r from-[#67F8C0] to-[#3F91DD]  font-[700] font-urbanist text-[#171717] text-sm md:text-lg"
          >
            Contact Us
          </Link>
        </div>
      </div>
    </>
  );
}
