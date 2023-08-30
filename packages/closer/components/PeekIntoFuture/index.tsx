import Image from 'next/image';

import { useState } from 'react';
import Lightbox from 'react-image-lightbox';

import { __ } from '../../utils/helpers';
import { Heading } from '../ui';
import { slides } from './slides';

const PeekIntoFuture = () => {
  const [photoIndex, setPhotoIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const currentImage = slides[photoIndex];
  const nextIndex = (photoIndex + 1) % slides.length;
  const nextImage = slides[nextIndex] || currentImage;
  const prevIndex = (photoIndex + slides.length - 1) % slides.length;
  const prevImage = slides[prevIndex] || currentImage;

  const handleMovePrev = () => setPhotoIndex(prevIndex);
  const handleMoveNext = () => setPhotoIndex(nextIndex);

  const handleShowPhoto = (index: number) => {
    setIsLightboxOpen(true);
    setPhotoIndex(index);
  };

  return (
    <section className="flex items-center flex-col mb-32">
      {isLightboxOpen && (
        <Lightbox
          mainSrc={slides[photoIndex]}
          nextSrc={nextImage}
          prevSrc={prevImage}
          onCloseRequest={() => setIsLightboxOpen(!isLightboxOpen)}
          onMovePrevRequest={handleMovePrev}
          onMoveNextRequest={handleMoveNext}
        />
      )}
      <div className="w-full flex flex-col  gap-2">
        <div className="flex gap-2 justify-center items-center flex-col md:flex-row">
          <div className="flex flex-col justify-center items-center w-full md:w-1/3 min-h-[240px]">
            <Image
              className="w-full md:w-1/3 max-w-[127px]"
              src="/images/token-sale/crystal-ball.png"
              width={127}
              height={127}
              alt={__('token_sale_peek_into_future')}
            />
            <Heading level={2} className="">
              {__('token_sale_peek_into_future')}
            </Heading>
          </div>
          <div
            onClick={() => handleShowPhoto(0)}
            className=" cursor-pointer w-full md:w-2/3  min-h-[280px] overflow-hidden rounded-md "
          >
            <div className=" p-6 hover:scale-[103%]  duration-300 h-[280px]  bg-bottom bg-[url(/images/token-sale/co-living.jpg)] bg-cover">
              <Heading level={3} className="text-white text-2xl">
                {__('token_sale_peek_modern_coliving')}
              </Heading>
            </div>
          </div>
        </div>

        <div className="flex gap-2 justify-center items-center flex-col md:flex-row">
          <div
            onClick={() => handleShowPhoto(1)}
            className="cursor-pointer w-full md:w-1/2 text-right min-h-[280px] overflow-hidden rounded-md"
          >
            <div className=" p-6 hover:scale-[103%]  duration-300 h-[280px]  bg-bottom bg-[url(/images/token-sale/co-working.jpg)] bg-cover">
              <Heading level={3} className="text-white text-2xl drop-shadow-lg">
                {__('token_sale_peek_coworking')}
              </Heading>
            </div>
          </div>
          <div
            onClick={() => handleShowPhoto(2)}
            className="cursor-pointer w-full md:w-1/2 text-right min-h-[280px] overflow-hidden rounded-md"
          >
            <div className=" p-6 hover:scale-[103%]  duration-300 h-[280px]  bg-bottom bg-[url(/images/token-sale/greenhouse.jpg)] bg-cover">
              <Heading level={3} className="text-white text-2xl">
                {__('token_sale_peek_greenhouse')}
              </Heading>
            </div>
          </div>
        </div>

        <div className="flex gap-2 justify-center items-center flex-col md:flex-row">
          <div
            onClick={() => handleShowPhoto(3)}
            className="hover:bg-[length:103%] cursor-pointer w-full md:w-2/3 text-right  min-h-[280px] rounded-md overflow-hidden"
          >
            <div className=" p-6 hover:scale-[103%]  duration-300 h-[280px]  bg-bottom bg-[url(/images/token-sale/suites.jpg)] bg-cover">
              <Heading level={3} className="text-white text-2xl">
                <div>{__('token_sale_peek_suites_1')}</div>
                <div>{__('token_sale_peek_suites_2')}</div>
                {__('token_sale_peek_suites_3')}
              </Heading>
            </div>
          </div>
          <div className="w-full md:w-1/3 bg-bottom flex flex-col gap-4 justify-center items-center bg-accent-light min-h-[280px] rounded-md bg-cover p-6">
            <p className="text-center">{__('token_sale_peek_design_1')}</p>
            <p className="text-center">{__('token_sale_peek_design_2')}</p>
          </div>
        </div>

        <div className="flex gap-2 justify-center items-center flex-col md:flex-row">
          <div
            onClick={() => handleShowPhoto(4)}
            className="cursor-pointer w-full text-right  min-h-[340px] rounded-md overflow-hidden"
          >
            <div className=" p-6 hover:scale-[103%] duration-300 min-h-[340px] min-w-full bg-bottom bg-[url(/images/token-sale/plan.png)] bg-cover"></div>
          </div>
        </div>

        <div className="flex gap-2 justify-center items-center flex-col md:flex-row">
          <div className="w-full md:w-1/3 bg-bottom flex flex-col gap-4 justify-center items-center bg-accent-light min-h-[280px] rounded-md bg-cover p-6">
            <Heading level={3} className="text-center text-2xl">
              {__('token_sale_food_heading')}
            </Heading>
            <p className="text-center">{__('token_sale_food_text')}</p>
          </div>
          <div
            onClick={() => handleShowPhoto(5)}
            className="hover:bg-[length:103%] cursor-pointer w-full md:w-2/3  min-h-[280px] rounded-md overflow-hidden"
          >
            <div className=" p-6 hover:scale-[103%] duration-300 min-h-[280px] min-w-full bg-bottom bg-[url(/images/token-sale/map.png)] bg-cover"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PeekIntoFuture;
