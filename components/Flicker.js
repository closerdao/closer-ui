import React, { useState } from 'react'
import Link from 'next/link'
import { trackEvent } from './analytics'
import { logout, isSignedIn } from '../utils/auth'

const imgCount = 14;
let totalFlickers = 0;

const Flicker = () => {
  const getImage = (activeImage, totalFlickers, imgCount) => (activeImage || 0 + totalFlickers) % imgCount;
  const [activeImage, setActiveImage] = useState(getImage(0, totalFlickers, imgCount));
  setTimeout(() => {
    totalFlickers++;
    setActiveImage(getImage(activeImage + 1, totalFlickers, imgCount));
  }, 1000);

  return (
    <div className="Flicker-container">
      <div className="Flicker">
        { Array.from('0'.repeat(imgCount)).map((e, i) => (
          <div
            key={ `0x${i+1}` }
            style={{
              backgroundImage: `url("/images/backgrounds/${i+1}.jpg")`,
              opacity: i === activeImage ? '1' : '0'
            }}
            alt="test"
            className="sample"
          />
        )) }
        {/* <div className="overlay" /> */}
      </div>
    </div>
  )
};

export default Flicker;
