import Image from 'next/image';

import React, { useEffect, useState } from 'react';

interface GalleryImage {
  src: string;
  width: number;
  height: number;
  alt?: string;
}

interface PhotoGalleryProps {
  settings: {
    galleryType: 'masonry';
  };
  content: {
    title: string;
    photos: {
      alt: string;
      imageUrl: string;
    }[];
  };
}

const CustomPhotoGallery: React.FC<PhotoGalleryProps> = ({
  content,
  settings,
}) => {
  // Sample images with proper dimensions
  const images: GalleryImage[] = [
    {
      src: 'https://cdn.oasa.co/custom-pages/per-auset/gallery/72124d1f-6314-4639-b3f7-e03199b10612.png',
      width: 1504,
      height: 2008,
      alt: 'Gallery Image 1',
    },
    {
      src: 'https://cdn.oasa.co/custom-pages/per-auset/gallery/Webversion-Per-Ausset-Jaqueline_Louan-35.png',
      width: 3000,
      height: 2008,
      alt: 'Gallery Image 2',
    },
  ];

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(
    null,
  );
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
    // Prevent scrolling when modal is open
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setSelectedIndex(null);
    setSlideDirection(null);
    setNextIndex(null);
    setIsAnimating(false);
    // Restore scrolling
    document.body.style.overflow = 'auto';
  };

  // Calculate groups of images for the masonry layout
  const createMasonryRows = (imgs: GalleryImage[], targetHeight = 200) => {
    let currentRow: GalleryImage[] = [];
    const rows: GalleryImage[][] = [];
    let rowWidth = 0;
    const maxWidth = 768; // Maximum width for a row

    imgs.forEach((img) => {
      const scaledWidth = (img.width / img.height) * targetHeight;

      if (rowWidth + scaledWidth > maxWidth && currentRow.length > 0) {
        // Start a new row if this would exceed max width
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
    <section className="max-w-4xl px-4 mx-auto flex flex-col gap-[60px]">
      <div className="flex flex-col gap-4 text-center">
        <p
          className="rich-text"
          dangerouslySetInnerHTML={{ __html: content?.title }}
        />
      </div>

      <div className="gallery-container">
        {rows.map((row, rowIndex) => (
          <div key={`row-${rowIndex}`} className="flex mb-2 gallery-row">
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
                  className="relative mr-2 overflow-hidden cursor-pointer transition-transform hover:scale-[1.02] duration-200"
                  style={{
                    width: thumbWidth,
                    height: baseHeight,
                    flexShrink: 0,
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
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
          onClick={closeModal}
        >
          {/* Content container - relative positioning for animation */}
          <div
            className="relative max-w-4xl max-h-[80vh] w-full h-full flex items-center justify-center"
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
              <Image
                src={images[selectedIndex].src}
                alt={images[selectedIndex].alt || 'Gallery Image'}
                width={images[selectedIndex].width}
                height={images[selectedIndex].height}
                style={{
                  objectFit: 'contain',
                  maxHeight: '80vh',
                  maxWidth: '90vw',
                  width: 'auto',
                  height: 'auto',
                }}
                sizes="90vw"
                priority
              />
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
                <Image
                  src={images[nextIndex].src}
                  alt={images[nextIndex].alt || 'Gallery Image'}
                  width={images[nextIndex].width}
                  height={images[nextIndex].height}
                  style={{
                    objectFit: 'contain',
                    maxHeight: '80vh',
                    maxWidth: '90vw',
                    width: 'auto',
                    height: 'auto',
                  }}
                  sizes="90vw"
                  priority
                />
              </div>
            )}

            {/* Navigation arrows */}
            <button
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full w-12 h-12 flex items-center justify-center z-10 transition-all"
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
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full w-12 h-12 flex items-center justify-center z-10 transition-all"
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
              className="absolute top-4 right-4 text-white text-4xl bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full w-10 h-10 flex items-center justify-center z-20"
              onClick={(e) => {
                e.stopPropagation();
                closeModal();
              }}
            >
              ×
            </button>

            {/* Image counter */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white bg-black bg-opacity-50 px-4 py-2 rounded-full">
              {selectedIndex + 1} / {images.length}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default CustomPhotoGallery;
