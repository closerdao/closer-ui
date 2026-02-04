import Image from 'next/image';

import React, { useEffect, useState } from 'react';

import { X } from 'lucide-react';

interface GalleryImage {
  src: string;
  width: number;
  height: number;
  alt?: string;
}

interface PhotoGalleryProps {
  settings: {
    galleryType: 'masonry';
    isRandomized?: boolean;
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

const shuffleArray = <T,>(array: T[]): T[] => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const CustomPhotoGallery: React.FC<PhotoGalleryProps> = ({
  content,
  settings,
}) => {
  // Prepare images in original order for SSR
  const initialImages: GalleryImage[] = content.items.map((item) => ({
    src: item.imageUrl,
    width: item.width,
    height: item.height,
    alt: item.alt,
  }));

  // State to hold randomized images (client only)
  const [images, setImages] = useState<GalleryImage[]>(initialImages);

  useEffect(() => {
    // Randomize only on client after hydration
    if (settings.isRandomized) {
      setImages(shuffleArray(initialImages));
    } else {
      setImages(initialImages);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content.items, settings.isRandomized]); // re-shuffle if items or randomization setting change

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [, setSlideDirection] = useState<'left' | 'right' | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [nextIndex, setNextIndex] = useState<number | null>(null);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedIndex === null) return;

      if (e.key === 'ArrowRight') {
        navigateToImage('next');
      } else if (e.key === 'ArrowLeft') {
        navigateToImage('prev');
      } else if (e.key === 'Escape') {
        closeModal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex]);

  const navigateToImage = (direction: 'next' | 'prev') => {
    if (selectedIndex === null || isAnimating) return;

    setIsAnimating(true);
    setSlideDirection(direction === 'next' ? 'left' : 'right');

    // Calculate next index
    const newIndex =
      direction === 'next'
        ? (selectedIndex + 1) % images.length
        : (selectedIndex - 1 + images.length) % images.length;

    setNextIndex(newIndex);

    // Complete the transition
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setSelectedIndex(newIndex);
        setIsAnimating(false);
        setSlideDirection(null);
        setNextIndex(null);
      });
    });
  };

  const openModal = (index: number) => {
    setSelectedIndex(index);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setSelectedIndex(null);
    setSlideDirection(null);
    setNextIndex(null);
    setIsAnimating(false);
    document.body.style.overflow = 'auto';
  };

  // Calculate groups of images for the masonry layout
  const createMasonryRows = (imgs: GalleryImage[], targetHeight = 200) => {
    let currentRow: GalleryImage[] = [];
    const rows: GalleryImage[][] = [];
    let rowWidth = 0;
    const maxWidth = 1152; // Match max-w-6xl (72rem = 1152px)

    imgs.forEach((img) => {
      const scaledWidth = (img.width / img.height) * targetHeight;

      if (rowWidth + scaledWidth > maxWidth && currentRow.length > 0) {
        // Scale the row to fit the container width
        rows.push([...currentRow]);
        currentRow = [img];
        rowWidth = scaledWidth;
      } else {
        // Add to current row
        currentRow.push(img);
        rowWidth += scaledWidth;
      }
    });

    // Add the last row if not empty
    if (currentRow.length > 0) {
      rows.push(currentRow);
    }

    return rows;
  };

  const rows = createMasonryRows(images);
  const baseHeight = 200; // Base height for thumbnails

  return (
    <section className="w-screen  bg-accent-dark py-10 -mx-4">
      {/* Only render title container if title exists */}
      {content?.title && (
        <div className="max-w-6xl mx-auto flex flex-col gap-4 text-center w-full mb-[60px]">
          <p
            className="rich-text max-w-3xl mx-auto"
            dangerouslySetInnerHTML={{ __html: content.title }}
          />
        </div>
      )}
      

      {/* Gallery always takes full width */}
      <div className="max-w-6xl mx-auto">
        {rows.map((row, rowIndex) => (
          <div
            key={`row-${rowIndex}`}
            className="flex flex-wrap md:flex-nowrap mb-2 w-full justify-center gap-2"
          >
            {row.map((image, imgIndex) => {
              const aspectRatio = image.width / image.height;
              const thumbWidth = Math.round(baseHeight * aspectRatio);

              // Calculate absolute index across all rows
              const absoluteIndex =
                rows
                  .slice(0, rowIndex)
                  .reduce((sum, currentRow) => sum + currentRow.length, 0) +
                imgIndex;

              return (
                <div
                  key={`img-${rowIndex}-${imgIndex}`}
                  className="relative overflow-hidden cursor-pointer transition-transform hover:scale-[1.02] duration-200 flex-grow-0 flex-shrink-0"
                  style={{
                    width: `min(${thumbWidth}px, calc(100% - 8px))`,
                    height: baseHeight,
                  }}
                  onClick={() => openModal(absoluteIndex)}
                >

                  <Image
                    src={image.src}
                    alt={image.alt || 'Gallery Image'}
                    fill
                    style={{ objectFit: 'cover' }}
                    sizes={`${thumbWidth}px`}
                  />
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Enhanced Lightbox Modal with Synchronized Sliding Animation */}
      {selectedIndex !== null && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50"
          onClick={closeModal}
        >
          {/* Content container - relative positioning for animation */}
          <div
            className="relative w-full h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Current image */}
            <div
              className="absolute w-full h-full flex items-center justify-center transition-opacity duration-300 ease-in-out"
              style={{
                opacity: isAnimating ? 0 : 1,
                pointerEvents: isAnimating ? 'none' : 'auto',
              }}
            >
              <div className="relative w-full h-[90vh] flex items-center justify-center">
                <Image
                  src={images[selectedIndex].src}
                  alt={images[selectedIndex].alt || 'Gallery Image'}
                  fill
                  style={{
                    objectFit: 'contain',
                  }}
                  sizes="90vw"
                  priority
                />
              </div>
            </div>

            {/* Next image */}
            {nextIndex !== null && (
              <div
                className="absolute w-full h-full flex items-center justify-center transition-opacity duration-300 ease-in-out"
                style={{
                  opacity: isAnimating ? 1 : 0,
                  pointerEvents: isAnimating ? 'auto' : 'none',
                }}
              >
                <div className="relative w-full h-[90vh] flex items-center justify-center">
                  <Image
                    src={images[nextIndex].src}
                    alt={images[nextIndex].alt || 'Gallery Image'}
                    fill
                    style={{
                      objectFit: 'contain',
                    }}
                    sizes="90vw"
                    priority
                  />
                </div>
              </div>
            )}

            {/* Navigation arrows */}
            <button
              className="fixed left-4 md:left-8 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full w-12 h-12 flex items-center justify-center transition-all"
              onClick={(e) => {
                e.stopPropagation();
                navigateToImage('prev');
              }}
              disabled={isAnimating}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                className="w-6 h-6"
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
              className="fixed right-4 md:right-8 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full w-12 h-12 flex items-center justify-center transition-all"
              onClick={(e) => {
                e.stopPropagation();
                navigateToImage('next');
              }}
              disabled={isAnimating}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>

            {/* Close button */}
            <button
              className="fixed top-4 right-4 md:top-8 md:right-8 text-white text-4xl bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full w-10 h-10 flex items-center justify-center"
              onClick={(e) => {
                e.stopPropagation();
                closeModal();
              }}
            >
              <X />
            </button>

            {/* Image counter */}
            <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 text-white bg-black bg-opacity-50 px-4 py-2 rounded-full">
              {selectedIndex + 1} / {images.length}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default CustomPhotoGallery;
