import Link from 'next/link';

import React, { useState } from 'react';

import { GrNext } from '@react-icons/all-files/gr/GrNext';
import { GrPrevious } from '@react-icons/all-files/gr/GrPrevious';

interface Props {
  slides: any;
  reverse: boolean;
  link?: string;
  isListing?: boolean;
  isListingPreview?: boolean;
}

const Slider = ({
  slides,
  reverse,
  link,
  isListing,
  isListingPreview,
}: Props) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slide = slides[currentSlide] || slides[0] || {};

  return (
    <div className={`slider ${reverse ? 'reverse' : ''} `}>
      <div className="relative">
        {link ? (
          <Link href={(link as string) || ''}>
            <img
              src={slide.image}
              alt=""
              className="w-full object-cover rounded-md"
            />
          </Link>
        ) : isListing ? (
          <div className="h-[350px] md:h-[600px]">
            <img
              src={slide.image}
              className="object-cover rounded-md w-full h-full"
              alt=""
            />
          </div>
        ) : (
          <img src={slide.image} alt="" className="rounded-md" />
        )}

        {(isListing || isListingPreview) && slides.length > 1 && (
          <>
            <div className="p-4 opacity-60 absolute left-0 top-0 h-full flex items-center">
              <div>
                <button
                  className={` bg-white rounded-full  ${
                    isListing ? 'text-xl p-2.5' : 'text-xs p-1.5'
                  }`}
                  onClick={() =>
                    setCurrentSlide(
                      currentSlide === 0 ? slides.length - 1 : currentSlide - 1,
                    )
                  }
                >
                  <GrPrevious />
                </button>
              </div>
            </div>
            <div className="p-3 opacity-60 absolute right-0 top-0 h-full flex items-center">
              <button
                className={` bg-white rounded-full  ${
                  isListing ? 'text-xl p-2.5' : 'text-xs p-1.5'
                }`}
                onClick={() =>
                  setCurrentSlide(
                    currentSlide >= slides.length - 1 ? 0 : currentSlide + 1,
                  )
                }
              >
                <GrNext />
              </button>
            </div>
          </>
        )}

        {isListing || isListingPreview ? (
          <div className="absolute bottom-0  flex flex-row  justify-center text-sm w-full my-2">
            {slides.length > 1 && (
              <figure className="bg-white px-2 rounded-full opacity-60">
                {currentSlide + 1} / {slides.length}
              </figure>
            )}
          </div>
        ) : (
          <div className="flex flex-row justify-between items-center text-sm">
            <button
              className="py-2"
              onClick={() =>
                setCurrentSlide(
                  currentSlide === 0 ? slides.length - 1 : currentSlide - 1,
                )
              }
            >
              <GrPrevious />
            </button>
            {slides.length > 0 && (
              <figure>
                {currentSlide + 1} / {slides.length}
              </figure>
            )}

            <button
              className="p-1"
              onClick={() =>
                setCurrentSlide(
                  currentSlide >= slides.length - 1 ? 0 : currentSlide + 1,
                )
              }
            >
              <GrNext />
            </button>
          </div>
        )}
      </div>
      <div className="text-area">
        <div className="text-slide">
          <label>{slide.label}</label>
          <p>{slide.text}</p>
        </div>
      </div>
    </div>
  );
};

export default Slider;
