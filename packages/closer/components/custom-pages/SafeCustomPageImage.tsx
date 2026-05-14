import Image, { type ImageProps } from 'next/image';

import React, { useEffect, useState } from 'react';

import { useTranslations } from 'next-intl';

import { isValidNextImageSrc } from '../../utils/nextImageSrc';

type Props = Omit<ImageProps, 'src'> & { src: string };

const SafeCustomPageImage = ({
  src,
  alt,
  className,
  onError,
  fill,
  ...rest
}: Props) => {
  const t = useTranslations();
  const [broken, setBroken] = useState(false);
  const normalized = typeof src === 'string' ? src.trim() : '';
  const canRender = isValidNextImageSrc(normalized);

  useEffect(() => {
    setBroken(false);
  }, [normalized]);

  if (!canRender || broken) {
    const base =
      'flex items-center justify-center bg-gray-100 text-gray-500 text-sm text-center px-3';
    const layout = fill
      ? `absolute inset-0 ${base}`
      : `${base} min-h-[12rem] w-full`;
    return (
      <div
        className={[layout, className].filter(Boolean).join(' ')}
        role="img"
        aria-label={t('custom_pages_image_not_found')}
      >
        {t('custom_pages_image_not_found')}
      </div>
    );
  }

  return (
    <Image
      src={normalized}
      alt={alt}
      className={className}
      fill={fill}
      onError={(e) => {
        setBroken(true);
        onError?.(e);
      }}
      {...rest}
    />
  );
};

export default SafeCustomPageImage;
