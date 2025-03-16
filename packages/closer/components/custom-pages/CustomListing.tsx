import Image from 'next/image';
import Link from 'next/link';

import React from 'react';

import { FaUser } from '@react-icons/all-files/fa/FaUser';
import { Button, Heading } from 'closer';

const CustomListing: React.FC<{
  settings: {
    numColumns: number;
    isHosts?: boolean;
    isAccommodations?: boolean;
  };
  content: {
    title: string;
    description: string;
    items: {
      title: string;
      text: string;
      imageUrl: string;
      cta: {
        text: string;
        url: string;
      };
    }[];
  };
}> = ({ content, settings }) => {
  const getFirstParagraph = (text: string) => {
    const match = text.match(/<p[^>]*>(.*?)<\/p>/i);
    return match
      ? match[1].replace(/<[^>]+>/g, '')
      : text.replace(/<[^>]+>/g, '');
  };

  return (
    <section className="max-w-4xl px-4 mx-auto flex flex-col gap-[60px]">
      <div className="flex flex-col gap-4 text-center">
        <Heading level={2} className="text-4xl text-foreground">
          {content?.title}
        </Heading>
        <p className="text-foreground text-md">{content?.description}</p>
      </div>

      <div
        className={`grid grid-cols-1 gap-[60px] md:grid-cols-${
          settings?.numColumns || 3
        }`}
      >
        {content?.items?.map((item) => (
          <div key={item.title} className={' flex flex-col gap-6 h-full'}>

            {item?.imageUrl && (
              <div
                className={`${
                  settings?.isHosts ? ' px-10' : ''
                } w-full aspect-auto flex-shrink-0 overflow-hidden`}
              >
                <Image
                  src={item.imageUrl}
                  alt={item.title}
                  width={400}
                  height={500}
                  className={`${
                    settings?.isHosts ? 'rounded-full' : ''
                  } w-full h-auto object-contain`}
                  sizes="(max-width: 768px) 100vw, 40vw"
                />
              </div>
            )}

            {!item.imageUrl && settings.isHosts && (
              <div
                className={
                  'px-10 w-full aspect-auto flex-shrink-0 overflow-hidden'
                }
              >
                <div className="rounded-full overflow-hidden">
                  <FaUser className="text-neutral w-full h-full" />
                </div>
              </div>
            )}
            <Heading
              display={false}
              level={3}
              className="font-normal text-lg text-center text-foreground"
            >
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
              <div className="mt-auto pt-4">
                <Button className="w-full">
                  <Link href={item.cta.url}>{item.cta.text}</Link>
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

export default CustomListing;
