import Image from 'next/image';
import Link from 'next/link';

import React from 'react';

import { FaUser } from '@react-icons/all-files/fa/FaUser';
import { Button, Heading, priceFormat } from 'closer';
import { useTranslations } from 'next-intl';

const CustomListing: React.FC<{
  settings: {
    numColumns: number;
    isSmallImage?: boolean;
    isAccommodations?: boolean;
    isColorful?: boolean;
    id?: string;
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
  const getFirstParagraph = (text: string) => {
    const match = text.match(/<p[^>]*>(.*?)<\/p>/i);
    return match
      ? match[1].replace(/<[^>]+>/g, '')
      : text.replace(/<[^>]+>/g, '');
  };

  return (
    <div>
      <div className='h-[100px]' id={settings?.id}></div>
      <section id={settings?.id} className="max-w-4xl mx-auto flex flex-col gap-[60px] ">
        <div className="flex flex-col gap-4 text-center">
          <Heading
            level={2}
            className={`${settings?.isColorful ? 'text-accent' : ''}  text-4xl`}
          >
            {content?.title}
          </Heading>
          <p className="text-foreground text-md">{content?.description}</p>
        </div>
        <div
          className={`grid grid-cols-1 gap-[60px] md:grid-cols-${
            settings?.numColumns || 3
          } place-items-center`}
        >
          {content?.items?.map((item) => (
            <div
              key={item.title}
              className={
                '  flex flex-col gap-6 h-full text-center w-full '
              }
            >
              {item?.imageUrl && (
                <div
                  className={`${
                    settings?.isSmallImage ? 'px-10' : ''
                  } w-full aspect-auto flex-shrink-0 `}
                >
                  <Image
                    src={item.imageUrl}
                    alt={item.title}
                    width={400}
                    height={500}
                    className={`${
                      settings?.isSmallImage ? 'rounded-full' : ''
                    } w-full h-auto object-contain`}
                    sizes="(max-width: 768px) 100vw, 40vw"
                  />
                </div>
              )}
              {!item.imageUrl && settings.isSmallImage && (
                <div className="px-10 w-full aspect-auto flex-shrink-0 overflow-hidden  min-h-[140px]">
                  <div className="rounded-full overflow-hidden bg-white pt-2">
                    <FaUser className="text-neutral w-full h-full" />
                  </div>
                </div>
              )}
              <Heading display={false} level={3} className="font-normal text-lg">
                {item.title}
              </Heading>
              {settings?.isAccommodations ? (
                <div className="text-md leading-normal">
                  {getFirstParagraph(item.text)}
                </div>
              ) : (
                <div
                  className="rich-text text-md leading-normal"
                  dangerouslySetInnerHTML={{ __html: item.text }}
                />
              )}
              {item.cta && (
                <div className="mt-auto pt-4 flex flex-col gap-6">
                  {settings?.isAccommodations && (
                    <div>{`${priceFormat(item?.price)} ${t(
                      'listing_preview_per_daily',
                    )}`}</div>
                  )}
                  <Button className={`${settings?.isColorful ? 'bg-accent-alt border-accent-alt ' : ''} w-full`}>
                    <Link href={item.cta.url}>{item.cta.text}</Link>
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
