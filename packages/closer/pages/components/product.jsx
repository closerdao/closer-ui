import React from "react";
import SS from "../../public/assets/png/ss.png";
import Image from "next/image";
import Icon from "../../public/assets/png/icon.png";
import Icon2 from "../../public/assets/png/icon2.png";
import Icon3 from "../../public/assets/png/icon3.png";
import Icon4 from "../../public/assets/png/icon4.png";

const product = [
  {
    pic: Icon,
    title: "Integrated Events & ticketing platform",
    description:
      "A powerful tool that enables regenerative communities to seamlessly organize and manage events within their ecosystem.",
  },
  {
    pic: Icon2,
    title: "Community management & subscriptions",
    description:
      "Community Management & Subscriptions facilitate revenue generation for communities by granting access to digital content, including online courses, and enhancing overall community engagement.",
  },
  {
    pic: Icon3,
    title: "Proof of Presence Governance",
    description:
      "Proof of Presence Governance empowers community members to influence decision-making based on their active participation within regenerative communities.",
  },
  {
    pic: Icon4,
    title: "Token Based Access to Physical Spaces",
    description:
      "Token-Based Access to Physical Spaces provides seamless entry and resource utilization within regenerative communities through utility tokens.",
  },
];

export default function Product() {
  return (
    <>
      <div id="product" className="bg-[#222] py-20">
        <div className="grid md:grid-cols-2  w-[90%] xl:w-[80%] 2xl:w-[1100px] mx-auto">
          <div className="self-center">
            <p className="global-txt font-urbanist font-[700] text-3xl md:text-2xl lg:text-3xl xl:text-4xl 2xl:text-2xl  text-white">
              Our Current Product
            </p>
            <p className="global-para mt-3 font-urbanist font-[400] text-sm md:text-xs lg:text-sm text-[#A5A5A5] md:w-[90%]">
              Lorem ipsum dolor sit amet consectetur. Risus porttitor orci
              convallis turpis est leo tellus facilisi et. Consectetur pulvinar
              euismod purus gravida ferment
            </p>

            <div className="mt-5 ">
              <button className="py-3 px-6 rounded-xl bg-gradient-to-r from-[#67F8C0] to-[#3F91DD]  font-[700] font-urbanist text-[#171717] text-xs lg:text-sm">
                Explore
              </button>
              <button className="ml-5 py-3 px-6 rounded-xl border-[1px] border-white font-[700] font-urbanist text-white text-xs lg:text-sm">
                Learn More
              </button>
            </div>
          </div>
          <div className="mt-10 md:mt-0">
            <Image src={SS} alt="" />
          </div>
        </div>

        <div className="grid md:grid-cols-2 w-[90%] xl:w-[80%] 2xl:w-[1100px] mx-auto mt-10 md:mt-20">
          {product.map((x) => (
            <div className="flex mt-10">
              <Image
                src={x.pic}
                alt=""
                className="w-[10%] md:w-[10%] h-[40px] md:h-[30px] lg:h-[40px] xl:h-[50px]"
              />
              <div className="ml-5">
                <p className="font-urbanist font-[600] text-xl md:text-sm lg:text-xl text-white">
                  {x.title}
                </p>
                <p className="line mt-2 font-urbanist font-[400] text-sm md:text-xs lg:text-sm text-[#A5A5A5] w-[80%] md:w-[90%]">
                  {x.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
