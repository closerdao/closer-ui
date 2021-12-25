import React, { useState } from 'react'

const Slider = ({
  slides,
  reverse
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slide = slides[currentSlide] || slides[0] || {};

  return (
    <div className={ `slider ${reverse ? 'reverse' : ''}` }>
      <div className="hidden cache">
        { slides.map(s => <img src={ s.image } />) }
      </div>
      <div className="slide">
        <img src={ slide.image } alt="interiors" />
      </div>
      <div className="text-area">
        <div className="text-slide">
          <label>{ slide.label }</label>
          <p>{ slide.text }</p>
        </div>
        <div className="slider-controls">
          <button className="transparent" onClick={ () => setCurrentSlide(currentSlide === 0 ? slides.length - 1 : currentSlide - 1) }>
            <img width="15" height="10" src="/images/icons/arrow-left.svg" alt="Prev" />
          </button>
          <figure>{ currentSlide + 1 } / { slides.length }</figure>
          <button className="transparent" onClick={ () => setCurrentSlide(currentSlide >= slides.length - 1 ? 0 : currentSlide + 1) }>
            <img width="15" height="10" src="/images/icons/arrow-right.svg" alt="Next" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default Slider
