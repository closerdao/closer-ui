import React, { useEffect, useState } from 'react';

import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { resolveBlockHtml, resolveBlockText } from '../../utils/blockI18n';
import SafeCustomPageImage from './SafeCustomPageImage';

interface GalleryImage {
  src: string;
  width: number;
  height: number;
  alt?: string;
}

type GallerySize = 'standard' | 'large' | 'featured';

interface PhotoGalleryProps {
  settings: {
    galleryType?: 'masonry' | 'grid';
    size?: GallerySize;
  };
  content: {
    title?: string;
    items: {
      alt: string;
      imageUrl: string;
      width: number;
      height: number;
    }[];
  };
}

const getTileClass = (
  index: number,
  total: number,
  size: GallerySize,
): string => {
  if (size === 'featured' && total > 4) {
    const isLast = index === total - 1;
    const isFirst = index === 0;
    if (isFirst || isLast) {
      return 'col-span-2 row-span-2 aspect-square md:aspect-auto md:h-[500px]';
    }
  }
  if (size === 'large') {
    return 'col-span-1 row-span-1 aspect-square md:aspect-auto md:h-[360px]';
  }
  return 'col-span-1 row-span-1 aspect-square md:aspect-auto md:h-[245px]';
};

const CustomPhotoGallery: React.FC<PhotoGalleryProps> = ({
  content,
  settings,
}) => {
  const t = useTranslations();
  const size: GallerySize = settings?.size ?? 'standard';
  const images: GalleryImage[] = (content?.items ?? []).map((item) => ({
    src: item.imageUrl,
    width: item.width,
    height: item.height,
    alt: item.alt,
  }));

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (selectedIndex === null) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedIndex === null) return;
      if (e.key === 'ArrowRight') {
        setSelectedIndex((prev) =>
          prev !== null ? (prev + 1) % images.length : null,
        );
      } else if (e.key === 'ArrowLeft') {
        setSelectedIndex((prev) =>
          prev !== null ? (prev + images.length - 1) % images.length : null,
        );
      } else if (e.key === 'Escape') {
        setSelectedIndex(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, images.length]);

  const openModal = (index: number) => {
    setSelectedIndex(index);
  };

  const closeModal = () => {
    setSelectedIndex(null);
  };

  const navigateImage = (direction: 'next' | 'prev') => {
    if (selectedIndex === null) return;
    setSelectedIndex((prev) => {
      if (prev === null) return null;
      return direction === 'next'
        ? (prev + 1) % images.length
        : (prev + images.length - 1) % images.length;
    });
  };

  if (images.length === 0) return null;

  return (
    <section className="py-12 md:py-16">
      {content?.title ? (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 mb-8 md:mb-10 text-center">
          <p
            className="rich-text max-w-3xl mx-auto"
            dangerouslySetInnerHTML={{
              __html: resolveBlockHtml(content.title, t),
            }}
          />
        </div>
      ) : null}

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {images.map((image, index) => (
            <div
              key={`gallery-img-${index}`}
              className={`relative overflow-hidden rounded-lg cursor-pointer group ${getTileClass(
                index,
                images.length,
                size,
              )}`}
              onClick={() => openModal(index)}
            >
              <SafeCustomPageImage
                src={image.src}
                alt={resolveBlockText(image.alt, t) || 'Gallery image'}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          ))}
        </div>
      </div>

      {selectedIndex !== null ? (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={closeModal}
        >
          <button
            type="button"
            onClick={closeModal}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
            aria-label="Close"
          >
            <X className="w-8 h-8" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigateImage('prev');
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors z-10 bg-black/50 hover:bg-black/70 rounded-full p-3"
            aria-label="Previous image"
          >
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigateImage('next');
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors z-10 bg-black/50 hover:bg-black/70 rounded-full p-3"
            aria-label="Next image"
          >
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
          <div
            className="relative max-w-7xl max-h-full"
            onClick={(e) => e.stopPropagation()}
          >
            <SafeCustomPageImage
              src={images[selectedIndex].src}
              alt={
                resolveBlockText(images[selectedIndex].alt, t) ||
                'Gallery image'
              }
              width={1200}
              height={800}
              className="max-w-full max-h-[90vh] object-contain"
              quality={90}
            />
          </div>
        </div>
      ) : null}
    </section>
  );
};

export default CustomPhotoGallery;
