import Link from 'next/link';

import React, { useEffect, useState } from 'react';

import { Button, Heading, priceFormat } from 'closer';
import UserAvatarPlaceholder from '../UserAvatarPlaceholder';
import { useTranslations } from 'next-intl';

import { resolveBlockHtml, resolveBlockText } from '../../utils/blockI18n';
import SafeCustomPageImage from './SafeCustomPageImage';

const CustomListing: React.FC<{
  settings: {
    numColumns: number;
    isSmallImage?: boolean;
    isAccommodations?: boolean;
    isColorful?: boolean;
    id?: string;
    hasBorder?: boolean;
  };
  content: {
    title: string;
    description: string;
    items: {
      title: string;
      text: string;
      imageUrl: string;
      price: number;
      cta: {
        text: string;
        url: string;
      };
    }[];
  };
}> = ({ content, settings }) => {
  const t = useTranslations();
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < 640);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, []);

  const getFirstParagraph = (text: string) => {
    const match = text.match(/<p[^>]*>(.*?)<\/p>/i);
    return match
      ? match[1].replace(/<[^>]+>/g, '')
      : text.replace(/<[^>]+>/g, '');
  };

  return (
    <div className=" py-10 ">
      {settings?.id && <div className="h-[80px]" id={settings?.id}></div>}
      <section className="max-w-4xl mx-auto flex flex-col gap-[60px]">
        <div className="flex flex-col gap-4 text-center">
          <Heading
            level={2}
            className={`${settings?.isColorful ? 'text-accent' : ''}  text-3xl`}
          >
            {resolveBlockText(content?.title, t)}
          </Heading>
          <p className="text-foreground text-md">
            {resolveBlockText(content?.description, t)}
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-6  gap-y-[50px]">
          {content?.items?.map((item, itemIndex) => (
            <div
              key={`${itemIndex}-${item.title}`}
              className={`flex flex-col  gap-6 text-center ${
                settings?.hasBorder ? 'border shadow-sm rounded-md p-3' : ''
              }`}
              style={{
                width: isSmallScreen
                  ? 'calc(100% - 30px)'
                  : `calc(${100 / (settings?.numColumns || 3)}% - 30px)`,
                flexGrow: 0,
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div className="flex-1 flex flex-col gap-6">
                {item.imageUrl?.trim() ? (
                  <div className={settings?.isSmallImage ? 'px-10' : ''}>
                    <SafeCustomPageImage
                      src={item.imageUrl}
                      alt={resolveBlockText(item.title, t)}
                      width={400}
                      height={500}
                      className={`${
                        settings?.isSmallImage ? 'rounded-full' : ''
                      }  w-full h-auto object-contain`}
                      sizes="(max-width: 768px) 100vw, 40vw"
                    />
                  </div>
                ) : null}
                {!item.imageUrl?.trim() && settings.isSmallImage ? (
                  <div className="flex justify-center py-4">
                    <UserAvatarPlaceholder size="5xl" />
                  </div>
                ) : null}
                <Heading
                  display={false}
                  level={3}
                  className="font-bold text-md"
                >
                  {resolveBlockText(item.title, t)}
                </Heading>
                {settings?.isAccommodations ? (
                  <div className="text-md leading-normal flex-1">
                    {getFirstParagraph(resolveBlockText(item.text, t))}
                  </div>
                ) : (
                  <div
                    className="rich-text text-md leading-normal flex-1"
                    dangerouslySetInnerHTML={{
                      __html: resolveBlockHtml(item.text, t),
                    }}
                  />
                )}
              </div>
              {item.cta && (
                <div className="mt-auto flex flex-col gap-6">
                  {settings?.isAccommodations && (
                    <div>{`${priceFormat(item?.price)} ${t(
                      'listing_preview_per_daily',
                    )}`}</div>
                  )}
                  <Button
                    className={`${
                      settings?.isColorful
                        ? 'bg-accent-alt border-accent-alt '
                        : ''
                    } w-full`}
                  >
                    <Link href={item.cta.url}>
                      {resolveBlockText(item.cta.text, t)}
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default CustomListing;
