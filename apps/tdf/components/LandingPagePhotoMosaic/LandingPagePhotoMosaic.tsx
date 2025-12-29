import { useState, useEffect } from 'react';
import Image from 'next/image';

interface LandingPagePhotoMosaicProps {
  className?: string;
}

const LANDING_PAGE_IMAGES = [
  'cafe.jpg',
  'sheep.jpg',
  'event-hall.jpg',
  'group.jpg',
  'lake.jpg',
  'chicken-coop.jpg',
  'sauna.jpg',
  'side-view.jpg',
  'spreading-seed.jpg',
  'workshop-2.jpg'
];

const LandingPagePhotoMosaic = ({ className }: LandingPagePhotoMosaicProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      if (typeof window !== 'undefined') {
        setIsMobile(window.innerWidth < 768);
      }
    };
    
    checkMobile();
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
    }
  }, []);

  useEffect(() => {
    if (isMobile && LANDING_PAGE_IMAGES.length > 0) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % LANDING_PAGE_IMAGES.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isMobile]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedIndex === null) return;

      if (e.key === 'ArrowRight') {
        setSelectedIndex((prev) => (prev !== null ? (prev + 1) % LANDING_PAGE_IMAGES.length : null));
      } else if (e.key === 'ArrowLeft') {
        setSelectedIndex((prev) => (prev !== null ? (prev + LANDING_PAGE_IMAGES.length - 1) % LANDING_PAGE_IMAGES.length : null));
      } else if (e.key === 'Escape') {
        setSelectedIndex(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex]);

  const openModal = (index: number) => {
    setSelectedIndex(index);
  };

  const closeModal = () => {
    setSelectedIndex(null);
  };

  const navigateImage = (direction: 'next' | 'prev') => {
    if (selectedIndex === null) return;
    if (direction === 'next') {
      setSelectedIndex((selectedIndex + 1) % LANDING_PAGE_IMAGES.length);
    } else {
      setSelectedIndex((selectedIndex + LANDING_PAGE_IMAGES.length - 1) % LANDING_PAGE_IMAGES.length);
    }
  };

  const getImagePath = (imageName: string) => `/images/landing-page/${imageName}`;

  if (isMobile) {
    const currentImage = LANDING_PAGE_IMAGES[currentIndex];
    const nextIndex = (currentIndex + 1) % LANDING_PAGE_IMAGES.length;
    const prevIndex = (currentIndex + LANDING_PAGE_IMAGES.length - 1) % LANDING_PAGE_IMAGES.length;

    return (
      <div className={className}>
        <div className="relative w-screen h-[500px] overflow-hidden" style={{ marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)' }}>
          <div className="relative w-full h-full">
            {LANDING_PAGE_IMAGES.map((image, idx) => (
              <div
                key={image}
                className={`absolute inset-0 transition-opacity duration-700 ${
                  idx === currentIndex ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <Image
                  src={getImagePath(image)}
                  alt=""
                  fill
                  className="object-cover w-full"
                  sizes="100vw"
                  priority={idx === currentIndex}
                />
              </div>
            ))}
          </div>
          
          {LANDING_PAGE_IMAGES.length > 1 && (
            <>
              <button
                onClick={() => setCurrentIndex(prevIndex)}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 transition-all z-10"
                aria-label="Previous image"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => setCurrentIndex(nextIndex)}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 transition-all z-10"
                aria-label="Next image"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                {LANDING_PAGE_IMAGES.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-1.5 rounded-full transition-all ${
                      idx === currentIndex ? 'bg-white w-8' : 'bg-white/50 w-1.5'
                    }`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="w-full max-w-7xl mx-auto px-6 py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <div className="col-span-2 row-span-2 relative aspect-square md:aspect-auto md:h-[500px] overflow-hidden rounded-lg cursor-pointer group">
            <Image
              src={getImagePath(LANDING_PAGE_IMAGES[0])}
              alt=""
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 50vw"
              onClick={() => openModal(0)}
            />
          </div>
          <div className="col-span-2 md:col-span-1 row-span-1 relative aspect-[4/3] md:aspect-auto md:h-[245px] overflow-hidden rounded-lg cursor-pointer group">
            <Image
              src={getImagePath(LANDING_PAGE_IMAGES[1])}
              alt=""
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 25vw"
              onClick={() => openModal(1)}
            />
          </div>
          <div className="col-span-2 md:col-span-1 row-span-1 relative aspect-[4/3] md:aspect-auto md:h-[245px] overflow-hidden rounded-lg cursor-pointer group">
            <Image
              src={getImagePath(LANDING_PAGE_IMAGES[2])}
              alt=""
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 25vw"
              onClick={() => openModal(2)}
            />
          </div>
          <div className="col-span-1 row-span-1 relative aspect-square md:aspect-auto md:h-[245px] overflow-hidden rounded-lg cursor-pointer group">
            <Image
              src={getImagePath(LANDING_PAGE_IMAGES[3])}
              alt=""
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 50vw, 25vw"
              onClick={() => openModal(3)}
            />
          </div>
          <div className="col-span-1 row-span-1 relative aspect-square md:aspect-auto md:h-[245px] overflow-hidden rounded-lg cursor-pointer group">
            <Image
              src={getImagePath(LANDING_PAGE_IMAGES[4])}
              alt=""
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 50vw, 25vw"
              onClick={() => openModal(4)}
            />
          </div>
          <div className="col-span-1 row-span-1 relative aspect-square md:aspect-auto md:h-[245px] overflow-hidden rounded-lg cursor-pointer group">
            <Image
              src={getImagePath(LANDING_PAGE_IMAGES[5])}
              alt=""
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 50vw, 25vw"
              onClick={() => openModal(5)}
            />
          </div>
          <div className="col-span-1 row-span-1 relative aspect-square md:aspect-auto md:h-[245px] overflow-hidden rounded-lg cursor-pointer group">
            <Image
              src={getImagePath(LANDING_PAGE_IMAGES[6])}
              alt=""
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 50vw, 25vw"
              onClick={() => openModal(6)}
            />
          </div>
          <div className="col-span-2 row-span-2 relative aspect-square md:aspect-auto md:h-[500px] overflow-hidden rounded-lg cursor-pointer group">
            <Image
              src={getImagePath(LANDING_PAGE_IMAGES[7])}
              alt=""
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 50vw"
              onClick={() => openModal(7)}
            />
          </div>
          <div className="col-span-2 md:col-span-1 row-span-1 relative aspect-[4/3] md:aspect-auto md:h-[245px] overflow-hidden rounded-lg cursor-pointer group">
            <Image
              src={getImagePath(LANDING_PAGE_IMAGES[8])}
              alt=""
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 25vw"
              onClick={() => openModal(8)}
            />
          </div>
          <div className="col-span-2 md:col-span-1 row-span-1 relative aspect-[4/3] md:aspect-auto md:h-[245px] overflow-hidden rounded-lg cursor-pointer group">
            <Image
              src={getImagePath(LANDING_PAGE_IMAGES[9])}
              alt=""
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 25vw"
              onClick={() => openModal(9)}
            />
          </div>
        </div>
      </div>

      {selectedIndex !== null && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={closeModal}
        >
          <button
            onClick={closeModal}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
            aria-label="Close"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigateImage('prev');
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors z-10 bg-black/50 hover:bg-black/70 rounded-full p-3"
            aria-label="Previous image"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigateImage('next');
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors z-10 bg-black/50 hover:bg-black/70 rounded-full p-3"
            aria-label="Next image"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <div className="relative max-w-7xl max-h-full" onClick={(e) => e.stopPropagation()}>
            <Image
              src={getImagePath(LANDING_PAGE_IMAGES[selectedIndex])}
              alt=""
              width={1200}
              height={800}
              className="max-w-full max-h-[90vh] object-contain"
              quality={90}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPagePhotoMosaic;

