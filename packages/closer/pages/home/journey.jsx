import React from 'react';
import BluTick from '../../public/assets/svg/blue-tick.svg';
import Image from 'next/image';
import Line from '../../public/assets/png/line.png';

const jour = {
  year: '2023',
  pic: BluTick,
  text: '1 active village',
  text2: '5 Proof of concepts',
  line: Line,
  heading: 'Increased Utility',
  text3: 'Financed tokens',
  text4: 'Snapshot integration',
  years: '2024',
  pics: BluTick,
  texts: '6 active village',
  texts2: '6 Proof of concepts',
  lines: Line,
  headings: 'Blockchain upgrades',
  texts3: 'Improved Proof of Presence',
  texts4: 'Celo migration to L2 rollup',
  texts5: 'Enable multichain deployments',
  headings2: 'Cross village data sharing',
  texts6:
    'Using Murmoring or other protocol to propagate public events etc to the network',
  texts7: 'NFT skill & memberships badges that are transferable',
  texts8: 'Proof of Regeneration',
  yearss: '2025',
  picss: BluTick,
  textss: '1 active village',
  textss2: '20 Proof of concepts',
  liness: Line,
  headingss: 'Village token index',
  textss3:
    'Partner with IndexCoop to release an index of Closer enabled communities',
  headingss2: 'Token swaps',
  textss4: 'Provide liquidity for cross village token trading',
};

export default function Journey() {
  return (
    <>
      <div id="journey" className="bg-[#171717] py-20">
        <div className="w-[90%] xl:w-[80%] 2xl:w-[1100px] mx-auto">
          <p className="global-txt font-urbanist font-[700] text-3xl md:text-2xl lg:text-3xl xl:text-4xl 2xl:text-2xl  text-white">
            Our Journey Ahead
          </p>
          <p className="line global-para mt-3 font-urbanist font-[400] text-sm md:text-xs lg:text-sm text-[#A5A5A5] md:w-[70%]">
            In the coming years, Closer is poised to revolutionize how regenerative communities access and manage shared resources, enabling a global network of sustainable, cooperative living spaces.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mt-10 w-[90%] xl:w-[80%] 2xl:w-[1100px] mx-auto">
          <div
            style={{
              border: ' 1px solid var(--Main, #67F8C0)',
              borderRadius: '20px',
            }}
            className="p-5"
          >
            <p className="font-urbanist font-[700] text-5xl bg-clip-text text-transparent bg-gradient-to-t from-[#67F8C0] to-[#3F91DD]">
              {jour.year}
            </p>
            <div className="flex mt-5">
              <Image src={jour.pic} alt="" className="" />
              <p className="self-center ml-2 font-urbanist font-[600] text-white text-lg">
                {jour.text}
              </p>
            </div>
            <div className="flex mt-5">
              <Image src={jour.pic} alt="" className="" />
              <p className="self-center ml-2 font-urbanist font-[600] text-white text-lg">
                {jour.text2}
              </p>
            </div>

            <div className="py-5">
              <Image src={jour.line} alt="" />
            </div>

            <p className=" font-urbanist font-[600] text-white text-xl">
              {jour.heading}
            </p>

            <div className="flex mt-5">
              <Image src={jour.pic} alt="" className="w-[8%]" />
              <p className="self-center ml-2 font-urbanist font-[600] text-white text-lg">
                {jour.text3}
              </p>
            </div>

            <div className="flex mt-5">
              <Image src={jour.pic} alt="" className="w-[8%]" />
              <p className="self-center ml-2 font-urbanist font-[600] text-white text-lg">
                {jour.text4}
              </p>
            </div>
          </div>
          <div
            style={{
              border: ' 1px solid var(--Main, #67F8C0)',
              borderRadius: '20px',
            }}
            className="p-5"
          >
            <p className="font-urbanist font-[700] text-5xl bg-clip-text text-transparent bg-gradient-to-t from-[#67F8C0] to-[#3F91DD]">
              {jour.years}
            </p>
            <div className="flex mt-5">
              <Image src={jour.pics} alt="" className="" />
              <p className="self-center ml-2 font-urbanist font-[600] text-white text-lg">
                {jour.texts}
              </p>
            </div>
            <div className="flex mt-5">
              <Image src={jour.pics} alt="" className="" />
              <p className="self-center ml-2 font-urbanist font-[600] text-white text-lg">
                {jour.texts2}
              </p>
            </div>

            <div className="py-5">
              <Image src={jour.lines} alt="" />
            </div>

            <p className=" font-urbanist font-[600] text-white text-xl">
              {jour.headings}
            </p>

            <div className="flex mt-5">
              <Image src={jour.pics} alt="" className="w-[8%]" />
              <p className="self-center ml-2 font-urbanist font-[600] text-white text-lg">
                {jour.texts3}
              </p>
            </div>

            <div className="flex mt-5">
              <Image src={jour.pics} alt="" className="w-[8%]" />
              <p className="self-center ml-2 font-urbanist font-[600] text-white text-lg">
                {jour.texts4}
              </p>
            </div>

            <div className="flex mt-5">
              <Image src={jour.pics} alt="" className="w-[8%]" />
              <p className="self-center ml-2 font-urbanist font-[600] text-white text-lg">
                {jour.texts5}
              </p>
            </div>

            <p className="mt-5 font-urbanist font-[600] text-white text-xl">
              {jour.headings2}
            </p>

            <div className="flex mt-5">
              <Image src={jour.pics} alt="" className="w-[8%]" />
              <p className="self-center ml-2 font-urbanist font-[600] text-white text-lg">
                {jour.texts6}
              </p>
            </div>

            <div className="flex mt-5">
              <Image src={jour.pics} alt="" className="w-[8%]" />
              <p className="self-center ml-2 font-urbanist font-[600] text-white text-lg">
                {jour.texts7}
              </p>
            </div>

            <div className="flex mt-5">
              <Image src={jour.pics} alt="" className="w-[8%]" />
              <p className="self-center ml-2 font-urbanist font-[600] text-white text-lg">
                {jour.texts8}
              </p>
            </div>
          </div>

          <div
            style={{
              border: ' 1px solid var(--Main, #67F8C0)',
              borderRadius: '20px',
            }}
            className="p-5"
          >
            <p className="font-urbanist font-[700] text-5xl bg-clip-text text-transparent bg-gradient-to-t from-[#67F8C0] to-[#3F91DD]">
              {jour.yearss}
            </p>
            <div className="flex mt-5">
              <Image src={jour.picss} alt="" className="" />
              <p className="self-center ml-2 font-urbanist font-[600] text-white text-lg">
                {jour.textss}
              </p>
            </div>
            <div className="flex mt-5">
              <Image src={jour.picss} alt="" className="" />
              <p className="self-center ml-2 font-urbanist font-[600] text-white text-lg">
                {jour.textss2}
              </p>
            </div>

            <div className="py-5">
              <Image src={jour.liness} alt="" />
            </div>

            <p className=" font-urbanist font-[600] text-white text-xl">
              {jour.headingss}
            </p>

            <div className="flex mt-5">
              <Image src={jour.pic} alt="" className="w-[8%]" />
              <p className="self-center ml-2 font-urbanist font-[600] text-white text-lg">
                {jour.textss3}
              </p>
            </div>

            <div className="flex mt-5">
              <Image src={jour.pic} alt="" className="w-[8%]" />
              <p className="self-center ml-2 font-urbanist font-[600] text-white text-lg">
                {jour.text4}
              </p>
            </div>

            <p className="mt-5 font-urbanist font-[600] text-white text-xl">
              {jour.headingss2}
            </p>
            <div className="flex mt-5">
              <Image src={jour.pic} alt="" className="w-[8%]" />
              <p className="self-center ml-2 font-urbanist font-[600] text-white text-lg">
                {jour.textss4}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
