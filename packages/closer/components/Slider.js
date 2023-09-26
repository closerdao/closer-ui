import React, { useState } from 'react';

import { GrNext } from '@react-icons/all-files/gr/GrNext';
import { GrPrevious } from '@react-icons/all-files/gr/GrPrevious';

const Slider = ({ slides, reverse }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slide = slides[currentSlide] || slides[0] || {};

  return (
    <div className={`slider ${reverse ? 'reverse' : ''}`}>
      <div className="slide drop-shadow-md">
        <img src={slide.image} alt="" />
      </div>
      <div className="text-area">
        <div className="text-slide">
          <label>{slide.label}</label>
          <p>{slide.text}</p>
        </div>
        <div className="slider-controls flex flex-row justify-start items-center">
          <button
            className="p-2 pr-4"
            onClick={() =>
              setCurrentSlide(
                currentSlide === 0 ? slides.length - 1 : currentSlide - 1,
              )
            }
          >
            <GrPrevious />
          </button>
          <figure>
            {currentSlide + 1} / {slides.length}
          </figure>
          <button
            className="p-2 pl-4"
            onClick={() =>
              setCurrentSlide(
                currentSlide >= slides.length - 1 ? 0 : currentSlide + 1,
              )
            }
          >
            <GrNext />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Slider;
