import Head from 'next/head';
import Link from 'next/link';

import { useState } from 'react';

import JoinWebinarPrompt from 'closer/components/JoinWebinarPrompt';

import { Button, Heading } from 'closer';
import { loadLocaleData } from 'closer/utils/locale.helpers';
import { NextPageContext } from 'next';
import { event } from 'nextjs-google-analytics';

const HomePage = () => {
  const [isPromptOpen, setIsPromptOpen] = useState(false);

  const joinWebinar = () => {
    setIsPromptOpen(true);
  };

  return (
    <>
      <Head>
        <title>TDF Data Room - investment details</title>
        <meta
          name="description"
          content="Traditional Dream Factory (TDF) is a regenerative playground in Abela, Portugal."
        />
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
                alt="Aerial view of Traditional Dream Factory"
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
                  Join us in developing a pioneering regenerative village in
                  Portugal.
                </Heading>
                <p className="mb-4">
                  We are raising €800k to kickstart the development of a village
                  restoring the soils, improving the water cycle, growing food -
                  and creating modern living and working spaces for 100+
                  thriving humans. This initial funding enables us to:
                </p>

                <ul>
                  <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                    secure the real estate (25ha of land with approved
                    construction plans)
                  </li>
                  <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                    develop the co-living (14 suites)
                  </li>
                  <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                    build 2 lakes and achieve water sovereignty
                  </li>
                  <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                    leverage EU funding
                  </li>
                  <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                    establish a cash flow positive hospitality and farming
                    business
                  </li>
                  <li className="bg-[length:16px_16px] bg-[top_5px_left] bg-[url(/images/subscriptions/bullet.svg)] bg-no-repeat pl-6 mb-1.5">
                    expand our impact and issue ecosystem credits
                  </li>
                </ul>
                <ul className="my-8 flex items-center">
                  <li className="flex flex-col flex-start space-y-4 md:space-y-0 md:space-x-4 md:flex-row justify-start">
                    <Link
                      href="/pdf/deck.pdf"
                      target="_blank"
                      className="bg-accent border-2 border-accent uppercase text-white rounded-full py-2 px-3 text-center md:text-left"
                      onClick={() =>
                        event('click', {
                          category: 'Dataroom',
                          label: 'Investment deck',
                        })
                      }
                    >
                      Investment deck
                    </Link>
                  </li>
                  <li>
                    <Button
                      className="bg-transparent md:ml-2 border-2 border-white uppercase text-white rounded-full py-2 px-3 text-center md:text-left"
                      onClick={joinWebinar}
                    >
                      Join webinar
                    </Button>
                  </li>
                </ul>
                <div className="mt-8">
                  📁 Documents:
                  <Link
                    href="/pdf/2021-TDF-report.pdf"
                    target="_blank"
                    className="ml-2 underline"
                  >
                    2021 report
                  </Link>
                  <Link
                    href="/pdf/2022-TDF-report.pdf"
                    target="_blank"
                    className="ml-2 underline"
                  >
                    2022 report
                  </Link>
                  <Link
                    href="/pdf/2024-TDF-report.pdf"
                    target="_blank"
                    className="ml-2 underline"
                  >
                    2024 report
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
