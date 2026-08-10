import Link from 'next/link';

import { useState } from 'react';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

interface Props {
  slides: any;
  reverse: boolean;
  link?: string;
  isListing?: boolean;
  isListingPreview?: boolean;
  className?: string;
}

const Slider = ({
  slides,
  reverse,
  link,
  isListing,
  isListingPreview,
  className,
}: Props) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slide = slides[currentSlide] || slides[0] || {};

  return (
    <div className={twMerge(`slider  ${reverse ? 'reverse' : ''} `, className)}>
      <div className="relative w-full">
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
          <img src={slide.image} alt="" className="object-cover rounded-md w-full" />
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
                  <ChevronLeft className="w-5 h-5" />
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
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </>
        )}

        {isListing || isListingPreview ? (
          <div className="absolute bottom-0  flex flex-row  justify-center text-sm w-full my-2">
            {slides.length > 1 && (
              <figure className="bg-white px-2 rounded-full opacity-60 font-normal">
                {currentSlide + 1} / {slides.length}
              </figure>
            )}
          </div>
        ) : (
          <div className="flex flex-row justify-between items-center text-sm font-normal">
            <button
              className="py-2"
              onClick={() =>
                setCurrentSlide(
                  currentSlide === 0 ? slides.length - 1 : currentSlide - 1,
                )
              }
            >
              <ChevronLeft className="w-5 h-5" />
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
              <ChevronRight className="w-5 h-5" />
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
