import { FAVICON_MASTER_SIZE } from './favicon';

export type NormalizedFavicon = {
  file: File;
  /** True when the source was not square and we added transparent padding. */
  wasPadded: boolean;
};

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('decode_failed'));
    image.src = src;
  });

/**
 * Draws any admin-supplied image onto a transparent square canvas and exports
 * PNG. Two things depend on this: the `/upload/file` fallback path serves a
 * small square PNG instead of the original photo, and an SVG upload is
 * rasterised here, so an author-supplied SVG is never what ends up behind a
 * `<link rel="icon">`. Contain, never stretch — a squashed logo is worse than
 * a padded one.
 */
export const normalizeToSquarePng = async (
  source: File,
  size: number = FAVICON_MASTER_SIZE,
): Promise<NormalizedFavicon> => {
  const objectUrl = URL.createObjectURL(source);

  try {
    const image = await loadImage(objectUrl);

    // SVGs without an intrinsic size decode to 0×0 in some browsers; treat
    // those as already square at the master size.
    const sourceWidth = image.naturalWidth || image.width || size;
    const sourceHeight = image.naturalHeight || image.height || size;

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;

    const context = canvas.getContext('2d');
    if (!context) throw new Error('canvas_unavailable');

    context.clearRect(0, 0, size, size);

    const scale = Math.min(size / sourceWidth, size / sourceHeight);
    const drawWidth = sourceWidth * scale;
    const drawHeight = sourceHeight * scale;
    context.drawImage(
      image,
      (size - drawWidth) / 2,
      (size - drawHeight) / 2,
      drawWidth,
      drawHeight,
    );

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/png'),
    );
    if (!blob) throw new Error('encode_failed');

    return {
      file: new File([blob], 'favicon.png', { type: 'image/png' }),
      wasPadded: Math.abs(sourceWidth - sourceHeight) > 1,
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};
