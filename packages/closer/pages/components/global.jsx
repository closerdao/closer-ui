import React from 'react';
import Globals from '../../public/assets/png/global.png';
import Image from 'next/image';
import Tick from '../../public/assets/svg/Section-4-Tick-Icon.svg';
import Map from '../../public/assets/png/map.png';
import MobMap from '../../public/assets/png/mobMap.png';
import Digital from '../../public/assets/jpg/digital.jpg';
import MobDigital from '../../public/assets/png/mobDigital.png';

// array
const types = [
  {
    img: Tick,
    title: 'Native community token',
    para: 'Proof of Presence is our game-changing feature that tracks and rewards your active participation within a community. The more time you spend, the more Presence you collect, and the more influence you have in decision-making. It\'s your passport to a richer, more connected community experience.',
  },
  {
    img: Tick,
    title: 'Proof of Presence',
    para: 'Proof of Presence is our game-changing feature that tracks and rewards your active participation within a community. The more time you spend, the more Presence you collect, and the more influence you have in decision-making. It\'s your passport to a richer, more connected community experience.',
  },
  {
    img: Tick,
    title: 'Proof of Sweat',
    para: 'Proof of Presence is our game-changing feature that tracks and rewards your active participation within a community. The more time you spend, the more Presence you collect, and the more influence you have in decision-making. It\'s your passport to a richer, more connected community experience.',
  },
];

export default function Global() {
  return (
    <>
      <div className="bg-[#171717] py-20">
        <div className="grid w-[90%] 2xl:w-[1100px] mx-auto md:w-full md:grid-cols-2">
          <div className="md:self-center lg:self-start">
            <Image src={Globals} alt="" className="w-[90%] " />
          </div>
          <div className="self-center mt-10 md:mt-0">
            <p className="global-txt font-urbanist font-[700] text-3xl md:text-2xl lg:text-3xl xl:text-4xl 2xl:text-2xl  text-white">
              The Global Challenge
            </p>
            <p className="global-para mt-4 font-urbanist font-[400] md:leading-[15px] lg:leading-normal  text-lg md:text-xs lg:text-sm xl:text-lg 2xl:text-xs text-white md:w-[70%]">
              Over the past century, the environment has faced significant
              degradation leading to loss of biodiversity, soil depletion, and
              disrupted water cycles. Centralized food production models and
              non-sustainable land management have been major contributors.
            </p>

            <p className="global-para mt-3 font-urbanist font-[400] md:leading-[15px] lg:leading-normal text-lg md:text-xs lg:text-sm xl:text-lg 2xl:text-xs text-white md:w-[70%]">
              Climate change and environmental degradation call for an urgent
              transformation in land management practices. For the planet to
              sustain life, revitalizing localized food production, restoring
              soil, enhancing water retention, and preserving biodiversity are
              paramount.
            </p>

            <p className="global-para mt-3 font-urbanist font-[400] md:leading-[15px] lg:leading-normal text-lg md:text-xs lg:text-sm xl:text-lg 2xl:text-xs text-white md:w-[70%]">
              We see villages as the dormant powerhouses ready to become the
              socioeconomic hubs spearheading the regenerative transformation.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-b from-[#67F8C0] to-[#3F91DD] py-20 md:py-40">
        <div className="grid md:grid-cols-3 gap-5 w-[90%] xl:w-[80%] 2xl:w-[1100px] mx-auto">
          {/* mapping */}
          {types.map((item) => (
            <div>
              <Image src={item.img} alt="" />
              <p className="titles mt-2 font-urbanist font-[700] text-xl md:text-sm lg:text-xl text-[#171717]">
                {item.title}
              </p>
              <p className="paras mt-2 font-urbanist font-[400] text-sm md:text-xs lg:text-sm text-[#171717]">
                {item.para}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#222] py-20">
        <div className="main w-[90%] xl:w-[80%] 2xl:w-[1100px] mx-auto">
          <Image src={Map} alt="" className="hidden md:block" />
          <Image src={MobMap} alt="" className="block md:hidden" />
        </div>
      </div>

      <div className=" bg-gradient-to-b from-[#67F8C0] to-[#3F91DD] py-20">
        <div className="main w-[90%] xl:w-[80%] 2xl:w-[1100px] mx-auto">
          <p className=" hidden md:block font-urbanist font-[700]  text-3xl md:text-2xl lg:text-3xl xl:text-4xl 2xl:text-2xl text-[#171717] text-center">
            At Closer, we envision a future where <br /> regenerative villages
            emerge as the guardians <br /> of ecological transformation.
          </p>
          <p className="village block md:hidden font-urbanist font-[700] text-3xl text-[#171717] text-center">
            At Closer, we envision a <br /> future where <br /> regenerative
            villages
            <br />
            emerge as the <br /> guardians of ecological <br /> transformation.
          </p>

          <p className="mt-5 font-urbanist font-[400] text-lg md:text-xs lg:text-sm  xl:text-lg 2xl:text-xs text-[#171717] text-center">
            Through our platform, these communities not only gain the knowledge
            and technological tools but also the social capabilities needed to
            track and drive positive impact on the environment. By becoming
            sovereign holders of natural assets, they harness the power of data,
            sustainability practices, and community collaboration to steer the
            course toward a more regenerative world. We empower communities to
            actively steward change, forging a sustainable and harmonious
            relationship with the land they inhabit, ensuring a legacy of
            lasting ecological prosperity.
          </p>

          <Image
            src={Digital}
            alt=""
            className="mt-5 rounded-3xl hidden md:block"
          />
          <Image
            src={MobDigital}
            alt=""
            className="mt-5 rounded-3xl block md:hidden"
          />
        </div>
      </div>
    </>
  );
}
