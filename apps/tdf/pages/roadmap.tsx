import Head from 'next/head';
import Link from 'next/link';

import { Heading } from 'closer';
import { loadLocaleData } from 'closer/utils/locale.helpers';
import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

const RoadmapPage = () => {
  const t = useTranslations();
  return (
    <>
      <Head>
        <title>{t('roadmap_title')}</title>
      </Head>
      <main className="mx-auto max-w-3xl">
        <section className="flex flex-wrap justify-center">
          <div>
            <Heading
              className="text-4xl mb-6 max-w-3xl text-center mt-8  uppercase sm:text-5xl bg-[url(/images/landing/spade.png)] bg-no-repeat pt-[170px] bg-top"
              level={2}
            >
              {t('roadmap_heading')}
            </Heading>
          </div>
        </section>
        <section className="flex items-center flex-col py-24">
          <div className="w-full sm:w-[80%] flex items-center flex-col">
            <div className="max-w-[800px]">
              {/* 2021 */}
              <div className="grid grid-cols-[37px_240px] sm:grid-cols-[37px_370px]">
                <div className="w-7 h-7 bg-accent rounded-full"></div>
                <Heading level={4} className="uppercase text-accent">
                  <span className="font-normal">2021</span>
                </Heading>
                <div className="w-7 flex justify-center">
                  <div className="bg-accent w-[4px] h-auto"></div>
                </div>
                <div className="pb-12">
                  <p className="uppercase font-bold">
                    {t('roadmap_2021_title')}
                  </p>
                  <ul className=" my-4 list-none">
                    <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                      {t('roadmap_2021_bullet_1')}
                    </li>
                    <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                      {t('roadmap_2021_bullet_2')}
                    </li>
                    <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                      {t('roadmap_2021_bullet_3')}
                    </li>
                    <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                      {t('roadmap_2021_bullet_4')}
                    </li>
                    <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                      {t('roadmap_2021_bullet_5')}
                    </li>
                  </ul>
                </div>
              </div>
              {/* 2022 */}
              <div className="grid grid-cols-[37px_240px] sm:grid-cols-[37px_370px]">
                <div className="w-7 h-7 bg-accent rounded-full"></div>
                <Heading level={4} className="uppercase text-accent">
                  <span className="font-normal">2022</span>
                </Heading>
                <div className="w-7 flex justify-center">
                  <div className="bg-accent w-[4px] h-auto"></div>
                </div>
                <div className="pb-12">
                  <p className="uppercase font-bold">
                    {t('roadmap_2022_title')}
                  </p>
                  <ul className=" my-4 list-none">
                    <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                      {t('roadmap_2022_bullet_1')}
                    </li>
                    <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                      {t('roadmap_2022_bullet_2')}
                    </li>
                    <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                      {t('roadmap_2022_bullet_3')}
                    </li>
                    <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                      {t('roadmap_2022_bullet_4')}
                    </li>
                    <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                      {t('roadmap_2022_bullet_5')}
                    </li>
                  </ul>
                </div>
              </div>
              {/* 2023 */}
              <div className="grid grid-cols-[37px_240px] sm:grid-cols-[37px_370px]">
                <div className="w-7 h-7 bg-accent rounded-full"></div>
                <Heading level={4} className="uppercase text-accent">
                  <span className="font-normal">2023</span>
                </Heading>
                <div className="w-7 flex justify-center">
                  <div className="bg-accent w-[4px] h-auto"></div>
                </div>
                <div className="pb-12">
                  <p className="uppercase font-bold">
                    {t('roadmap_2023_title')}
                  </p>
                  <ul className=" my-4 list-none">
                    <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                      {t('roadmap_2023_bullet_1')}
                    </li>
                    <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                      {t('roadmap_2023_bullet_2')}
                    </li>
                    <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                      {t('roadmap_2023_bullet_3')}
                    </li>
                    <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                      {t('roadmap_2023_bullet_4')}
                    </li>
                    <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                      {t('roadmap_2023_bullet_5')}
                    </li>
                    <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                      {t('roadmap_2023_bullet_6')}
                    </li>
                  </ul>
                </div>
              </div>
              {/* 2024 */}
              <div className="grid grid-cols-[37px_240px] sm:grid-cols-[37px_370px]">
                <div className="w-7 flex justify-center">
                  <div className="bg-accent w-[4px] h-[40px]"></div>
                </div>
                <div className="text-accent"></div>
                <div className="w-7 h-7 bg-accent rounded-full"></div>
                <Heading level={4} className="uppercase text-accent">
                  <span className="font-normal">2024</span>
                </Heading>
                <div className="w-7 flex justify-center">
                  <div className="bg-accent w-[4px] h-auto"></div>
                </div>
                <div className="pb-12">
                  <p className="uppercase font-bold">
                    {t('roadmap_2024_fundraising')}
                  </p>
                  <ul className=" my-4 list-none">
                    <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                      {t('roadmap_2024_bullet_1')}
                    </li>
                    <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                      {t('roadmap_2024_bullet_2')}
                    </li>
                    <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                      {t('roadmap_2024_bullet_3')}
                    </li>
                    <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                      {t('roadmap_2024_bullet_4')}
                    </li>
                  </ul>
                </div>
              </div>
              {/* 2025 - COMPLETE */}
              <div className="grid grid-cols-[37px_240px] sm:grid-cols-[37px_370px]">
                <div className="w-7 flex justify-center">
                  <div className="bg-accent w-[4px] h-[40px]"></div>
                </div>
                <div className="text-accent"></div>
                <div className="w-7 h-7 bg-accent rounded-full"></div>
                <Heading level={4} className="uppercase text-accent">
                  <span className="font-normal">2025</span>
                </Heading>
                <div className="w-7 flex justify-center">
                  <div className="bg-accent w-[4px] h-auto"></div>
                </div>
                <div className="pb-12">
                  <p className="uppercase font-bold">
                    {t('roadmap_2025_title')}
                  </p>
                  <ul className=" my-4 list-none">
                    <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                      {t('roadmap_2025_bullet_1')}
                    </li>
                    <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                      {t('roadmap_2025_bullet_2')}
                    </li>
                    <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                      {t('roadmap_2025_bullet_3')}
                    </li>
                    <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                      {t('roadmap_2025_bullet_4')}
                    </li>
                    <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                      {t('roadmap_2025_bullet_5')}
                    </li>
                    <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                      {t('roadmap_2025_bullet_6')}
                    </li>
                    <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                      {t('roadmap_2025_bullet_7')}
                    </li>
                    <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                      {t('roadmap_2025_bullet_8')}
                    </li>
                  </ul>
                </div>
              </div>
              {/* 2026 - CURRENT */}
              <div className="grid grid-cols-[37px_270px]">
                <div className="w-7 flex justify-center">
                  <div className="bg-accent w-[4px] h-[40px]"></div>
                </div>
                <div className="text-accent"></div>
                <div className="w-7 h-7 bg-accent-light border-4 border-accent rounded-full"></div>
                <Heading
                  level={4}
                  className="font-normal uppercase text-accent"
                >
                  2026
                </Heading>
                <div className="w-7 flex justify-center">
                  <div className="bg-accent-light w-[4px] h-auto"></div>
                </div>
                <div className="pb-12">
                  <p className="uppercase font-bold">
                    {t('roadmap_2026_title')}
                  </p>
                  <ul className=" my-4 list-none">
                    <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                      {t('roadmap_2026_bullet_1')}
                    </li>
                    <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                      {t('roadmap_2026_bullet_2')}
                    </li>
                    <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                      {t('roadmap_2026_bullet_3')}
                    </li>
                  </ul>
                </div>
              </div>
              {/* 2027 */}
              <div className="grid grid-cols-[37px_270px]">
                <div className="w-7 flex justify-center">
                  <div className="bg-accent-light w-[4px] h-[40px]"></div>
                </div>
                <div className="text-accent"></div>
                <div className="w-7 h-7 bg-accent-light rounded-full"></div>
                <Heading
                  level={4}
                  className="font-normal uppercase text-accent"
                >
                  2027
                </Heading>
                <div className="w-7 flex justify-center">
                  <div className="bg-accent-light w-[4px] h-auto"></div>
                </div>
                <div className="pb-12">
                  <p className="uppercase font-bold">
                    {t('roadmap_2027_title')}
                  </p>
                  <ul className=" my-4 list-none">
                    <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                      {t('roadmap_2027_bullet_1')}
                    </li>
                    <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                      {t('roadmap_2027_bullet_2')}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Call to Action */}
        <section className="flex justify-center py-16 bg-accent-light">
          <div className="text-center max-w-4xl mx-auto px-4">
            <Heading level={2} className="text-3xl md:text-4xl mb-6">
              {t('roadmap_cta_heading')}
            </Heading>
            <p className="text-lg mb-8 max-w-2xl mx-auto">
              {t('roadmap_cta_description')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/token"
                className="bg-accent text-white rounded-full py-3 px-8 text-lg font-bold hover:bg-accent-dark transition-colors"
              >
                {t('roadmap_cta_buy_tokens')}
              </Link>
              <Link
                href="/subscriptions"
                className="bg-white text-accent border-2 border-accent rounded-full py-3 px-8 text-lg font-bold hover:bg-accent hover:text-white transition-colors"
              >
                {t('roadmap_cta_subscribe')}
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

RoadmapPage.getInitialProps = async (context: NextPageContext) => {
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

export default RoadmapPage;
