import Image from 'next/image';

import { useState } from 'react';

import { useTranslations } from 'next-intl';

import Modal from '../Modal';
import { Heading } from '../ui';
import { slides } from './slides';

const PeekIntoFuture = () => {
  const t = useTranslations();
  const [photoIndex, setPhotoIndex] = useState(0);
  const [isInfoModalOpened, setIsInfoModalOpened] = useState(false);

  const handleShowPhoto = (index: number) => {
    setIsInfoModalOpened(true);
    setPhotoIndex(index);
  };

  const closeModal = () => {
    setIsInfoModalOpened(false);
  };

  return (
    <section className="flex items-center flex-col mb-32 relative">
      {isInfoModalOpened && (
        <Modal
          closeModal={closeModal}
          className="flex items-center justify-center bg-green-200  md:h-[calc(100vh-100px)] md:w-[calc(100vw-100px)]"
        >
          <Image
            className="object-cover h-full w-full md:w-auto md:h-full"
            src={slides[photoIndex]}
            width={800}
            height={400}
            alt=""
          />
        </Modal>
      )}

      <div className="w-full flex flex-col  gap-2">
        <div className="flex gap-2 justify-center items-center flex-col md:flex-row">
          <div
            onClick={() => handleShowPhoto(0)}
            className=" cursor-pointer w-full  min-h-[280px] overflow-hidden rounded-md "
          >
            <div className=" p-6 hover:scale-[103%]  duration-300 h-[280px]  bg-bottom bg-[url(/images/token-sale/co-living.jpg)] bg-cover">
              <Heading level={3} className="text-white text-2xl">
                {t('token_sale_peek_modern_coliving')}
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
                {t('token_sale_peek_coworking')}
              </Heading>
            </div>
          </div>
          <div
            onClick={() => handleShowPhoto(2)}
            className="cursor-pointer w-full md:w-1/2 text-right min-h-[280px] overflow-hidden rounded-md"
          >
            <div className=" p-6 hover:scale-[103%]  duration-300 h-[280px]  bg-bottom bg-[url(/images/token-sale/greenhouse.jpg)] bg-cover">
              <Heading level={3} className="text-white text-2xl">
                {t('token_sale_peek_greenhouse')}
              </Heading>
            </div>
          </div>
        </div>

        <div className="flex gap-2 justify-center items-center flex-col md:flex-row">
          <div
            onClick={() => handleShowPhoto(3)}
            className="hover:bg-[length:103%] cursor-pointer w-full text-right  min-h-[280px] rounded-md overflow-hidden"
          >
            <div className=" p-6 hover:scale-[103%]  duration-300 h-[280px]  bg-bottom bg-[url(/images/token-sale/suites.jpg)] bg-cover">
              <Heading level={3} className="text-white text-2xl">
                <div>{t('token_sale_peek_suites_1')}</div>
                <div>{t('token_sale_peek_suites_2')}</div>
                {t('token_sale_peek_suites_3')}
              </Heading>
            </div>
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

        {/* <div className="flex gap-2 justify-center items-center flex-col md:flex-row">
          <div className="w-full md:w-1/3 bg-bottom flex flex-col gap-4 justify-center items-center bg-accent-light min-h-[280px] rounded-md bg-cover p-6">
            <Heading level={3} className="text-center text-2xl">
              {t('token_sale_food_heading')}
            </Heading>
            <p className="text-center">{t('token_sale_food_text')}</p>
          </div>
          <div
            onClick={() => handleShowPhoto(5)}
            className="hover:bg-[length:103%] cursor-pointer w-full md:w-2/3  min-h-[280px] rounded-md overflow-hidden"
          >
            <div className=" p-6 hover:scale-[103%] duration-300 min-h-[280px] min-w-full bg-bottom bg-[url(/images/token-sale/map.png)] bg-cover"></div>
          </div>
        </div> */}
      </div>
    </section>
  );
};

export default PeekIntoFuture;
