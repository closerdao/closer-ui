import Head from 'next/head';
import Link from 'next/link';

import { useState } from 'react';

import JoinWebinarPrompt from 'closer/components/JoinWebinarPrompt';

import { Button, Heading } from 'closer';
import { loadLocaleData } from 'closer/utils/locale.helpers';
import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';
import { event } from 'nextjs-google-analytics';

const HomePage = () => {
  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const t = useTranslations();

  const joinWebinar = () => {
    setIsPromptOpen(true);
  };

  return (
    <>
      <Head>
        <title>{t('dataroom_title')}</title>
        <meta name="description" content={t('dataroom_meta_description')} />
        <link
          rel="canonical"
          href="https://www.traditionaldreamfactory.com/"
          key="canonical"
        />
      </Head>
      <section>
        {isPromptOpen && (
          <JoinWebinarPrompt setIsPromptOpen={setIsPromptOpen} />
        )}
        <div className="bg-black text-white -m-4 h-full min-h-[100vh] flex justify-center">
          <div className="w-full h-auto overflow-scroll flex justify-start flex-col md:flex-row items-center">
            <div className="md:w-[50%]">
              <img
                src="/images/landing/top-view.jpeg"
                className="md:rounded-r-2xl"
                alt={t('dataroom_img_alt')}
              />
            </div>
            <div className="md:w-[50%] max-w-prose">
              <div className="p-8">
                <Heading
                  className="text-2xl md:text-3xl mb-2"
                  data-testid="page-title"
                  display
                  level={1}
                >
                  {t('dataroom_heading')}
                </Heading>
                <p className="mb-4">{t('dataroom_intro')}</p>
                <ul>
                  <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                    {t('dataroom_bullet_1')}
                  </li>
                  <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                    {t('dataroom_bullet_2')}
                  </li>
                  <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                    {t('dataroom_bullet_3')}
                  </li>
                  <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                    {t('dataroom_bullet_4')}
                  </li>
                  <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                    {t('dataroom_bullet_5')}
                  </li>
                  <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                    {t('dataroom_bullet_6')}
                  </li>
                </ul>
                <ul className="my-8 flex items-center gap-1">
                  <li className="flex flex-col flex-start space-y-4 md:space-y-0 md:space-x-4 md:flex-row justify-start">
                    <Link
                      href="/pdf/deck.pdf"
                      target="_blank"
                      className="whitespace-nowrap bg-accent border-2 border-accent uppercase text-white rounded-full py-2 px-3 text-center md:text-left"
                      onClick={() =>
                        event('click', {
                          category: 'Dataroom',
                          label: t('dataroom_investment_deck_label'),
                        })
                      }
                    >
                      {t('dataroom_investment_deck')}
                    </Link>
                  </li>
                  <li>
                    <Button
                      className="bg-transparent md:ml-2 border-2 border-white uppercase text-white rounded-full py-2 px-3 text-center md:text-left"
                      onClick={joinWebinar}
                    >
                      {t('dataroom_join_webinar')}
                    </Button>
                  </li>
                </ul>
                <div className="mt-8">
                  {t('dataroom_documents')}
                  <Link
                    href="/pdf/2021-TDF-report.pdf"
                    target="_blank"
                    className="ml-2 underline"
                  >
                    {t('dataroom_report_2021')}
                  </Link>
                  <Link
                    href="/pdf/2022-TDF-report.pdf"
                    target="_blank"
                    className="ml-2 underline"
                  >
                    {t('dataroom_report_2022')}
                  </Link>
                  <Link
                    href="/pdf/2024-TDF-report.pdf"
                    target="_blank"
                    className="ml-2 underline"
                  >
                    {t('dataroom_report_2024')}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

HomePage.getInitialProps = async (context: NextPageContext) => {
  try {
    const messages = await loadLocaleData(
      context?.locale,
      process.env.NEXT_PUBLIC_APP_NAME,
    );
    return {
      messages,
    };
  } catch (err: unknown) {
    return {
      messages: null,
    };
  }
};

export default HomePage;
