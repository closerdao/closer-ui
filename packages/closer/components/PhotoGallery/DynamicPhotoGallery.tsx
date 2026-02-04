import { useState, useEffect } from 'react';
import Image from 'next/image';

import { useConfig } from '../../hooks/useConfig';
import api from '../../utils/api';

interface Props {
  className?: string;
  isSlider?: boolean;
}

interface GalleryImage {
  src: string;
  original: string;
}

const DynamicPhotoGallery = ({ className, isSlider = false }: Props) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { APP_NAME } = useConfig() || {};

  useEffect(() => {
    const loadGalleryImages = async () => {
      try {
        const response = await api.get('/config/photo-gallery').catch(() => null);
        const photoIds = response?.data?.results?.value?.photoIds;
        
        if (photoIds && Array.isArray(photoIds) && photoIds.length > 0) {
          const cdn = process.env.NEXT_PUBLIC_CDN_URL || '';
          const galleryImages: GalleryImage[] = photoIds.map((photoId: string) => {
            const thumbnailUrl = `${cdn}${photoId}-max-lg.jpg`;
            const fullSizeUrl = `${cdn}${photoId}-max-xl.jpg`;
            
            return {
              src: thumbnailUrl,
              original: fullSizeUrl,
            };
          });
          setImages(galleryImages);
        } else {
          setImages([]);
        }
      } catch (error) {
        console.error('Error loading gallery images:', error);
        setImages([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (APP_NAME?.toLowerCase() === 'tdf') {
      loadGalleryImages();
    } else {
      setIsLoading(false);
    }
  }, [APP_NAME]);

  useEffect(() => {
    if (isSlider && images.length > 0) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % images.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isSlider, images.length]);

  if (isLoading) {
    return null;
  }

  if (images.length === 0) {
    return null;
  }

  if (isSlider) {
    const nextIndex = (currentIndex + 1) % images.length;
    const prevIndex = (currentIndex + images.length - 1) % images.length;

    return (
      <div className={className}>
        <div className="relative w-screen h-[500px] md:h-[700px] overflow-hidden" style={{ marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)' }}>
          <div className="relative w-full h-full">
            {images.map((image, idx) => (
              <div
                key={idx}
                className={`absolute inset-0 transition-opacity duration-700 ${
                  idx === currentIndex ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <Image
                  src={image.src}
                  alt=""
                  fill
                  className="object-cover w-full"
                  sizes="100vw"
                  priority={idx === currentIndex}
                />
              </div>
            ))}
          </div>
          
          {images.length > 1 && (
            <>
              <button
                onClick={() => setCurrentIndex(prevIndex)}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 transition-all"
                aria-label="Previous image"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => setCurrentIndex(nextIndex)}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 transition-all"
                aria-label="Next image"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {images.map((_, idx) => (
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

  return null;
};

export default DynamicPhotoGallery;

