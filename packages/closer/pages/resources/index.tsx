import Head from 'next/head';

import { useEffect, useState } from 'react';

import Resources from '../../components/Resources';
import { ErrorMessage, Heading } from '../../components/ui';

import { useConfig } from '../../hooks/useConfig';
import { FormattedFaqs, QuestionAndAnswer } from '../../types/resources';
import { __ } from '../../utils/helpers';
import { prepareFaqsData } from '../../utils/resources';

interface Props {
  faqsData: any[];
}

const ResourcesPage = ({ faqsData }: Props) => {
  const { PLATFORM_NAME } = useConfig() || {};
  const [faqs, setFaqs] = useState<null | FormattedFaqs[]>(null);
  const [error, setError] = useState<null | string>(null);

  useEffect(() => {
    setFaqs(prepareFaqsData(faqsData));

    if (!faqsData) {
      setError('Error fetching FAQs');
    }
  }, []);

  return (
    <div className="max-w-screen-lg mx-auto">
      <Head>
        <title>{`${__('resources_heading')} - ${PLATFORM_NAME}`}</title>
      </Head>
      <main className="pt-16 pb-24 md:flex-row flex-wrap">
        <div className="flex justify-center bg-cover bg-[center_top_6rem] sm:bg-[center_top_4rem] bg-no-repeat bg-[url(/images/resources/resources-hero.png)] h-[650px]">
          <div className="flex flex-col items-center">
            <Heading
              level={1}
              className="w-[300px] sm:w-[350px] font-extrabold mb-6 uppercase text-center text-2xl sm:text-5xl"
            >
              {__('resources_heading')}
            </Heading>
            <p className="mb-4 max-w-[630px]">{__('resources_subheading')}</p>
          </div>
        </div>

        <section className="flex items-center flex-col py-24">
          <div className="w-full">
            <div className="text-center mb-6 flex flex-wrap justify-center">
              <Heading
                level={2}
                className="mb-4 uppercase w-full font-extrabold text-5xl max-w-[600px]"
              >
                {__('resources_faq_heading')}
              </Heading>
              <p className="mb-4 w-full">{__('resources_faq_subheading')}</p>
            </div>

            {error && <ErrorMessage error={error} />}

            {faqs &&
              faqs.map((category) => {
                const questionsAndAnswers = category.slice(
                  1,
                )[0] as QuestionAndAnswer[];
                return (
                  <div
                    key={category[0]}
                    className="border-b border-accent-light text-sm"
                  >
                    <details className="group py-2 ">
                      <summary className="flex cursor-pointer items-center justify-between py-1 hover:text-c-blue ">
                        <p className="uppercase font-bold my-2">
                          {category[0]}
                        </p>
                        <svg
                          className="min-h-4  min-w-4 h-4 w-8 rotate-0 transform text-gray-400 stroke-black group-open:rotate-180 group-open:stroke-accent"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="2"
                          stroke="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19 9l-7 7-7-7"
                          ></path>
                        </svg>
                      </summary>
                      <div className=" ">
                        {questionsAndAnswers.map(
                          (questionAndAnswer: QuestionAndAnswer) => {
                            return (
                              <div
                                key={questionAndAnswer.q}
                                className="shadow rounded-md border-t border-gray-50 mb-3"
                              >
                                <details className="group/level2">
                                  <summary className="flex cursor-pointer items-center justify-between py-1 hover:text-c-blue pr-3">
                                    <p className="uppercase font-bold px-4 py-3">
                                      {questionAndAnswer.q}
                                    </p>
                                    <svg
                                      className="min-h-4  min-w-4 h-4 w-8 rotate-0 transform text-gray-400 stroke-black group-open/level2:rotate-180 group-open/level2:stroke-accent"
                                      xmlns="http://www.w3.org/2000/svg"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      strokeWidth="2"
                                      stroke="currentColor"
                                      aria-hidden="true"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M19 9l-7 7-7-7"
                                      ></path>
                                    </svg>
                                  </summary>
                                  <div
                                    className="p-4 bg-accent-light
                              "
                                  >
                                    {questionAndAnswer.a}
                                    {questionAndAnswer.linkTexts && (
                                      <ul>
                                        {questionAndAnswer.linkTexts.map(
                                          (linkText, index) => {
                                            return (
                                              <li key={linkText}>
                                                <a
                                                  href={
                                                    (questionAndAnswer?.linkUrls &&
                                                      questionAndAnswer
                                                        ?.linkUrls[index]) ||
                                                    ''
                                                  }
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="underline text-accent hover:text-black font-bold"
                                                >
                                                  {linkText}
                                                </a>
                                              </li>
                                            );
                                          },
                                        )}
                                      </ul>
                                    )}
                                  </div>
                                </details>
                              </div>
                            );
                          },
                        )}
                      </div>
                    </details>
                  </div>
                );
              })}
            <div></div>
          </div>
        </section>

        <section className="mb-12 max-w-6xl mx-auto pb-20">
          <div className="text-center  flex flex-wrap justify-center mb-20">
            <Heading
              level={2}
              className="mb-4 uppercase w-full font-extrabold text-5xl max-w-[700px] bg-[url(/images/resources/tea-cup.png)] bg-no-repeat pt-[250px] bg-top"
            >
              {__('resources_resources_heading')}
            </Heading>
            <p className="mb-4 w-full">
              {__('resources_resources_subheading')}
            </p>
          </div>
          <Resources />
        </section>
      </main>
    </div>
  );
};

ResourcesPage.getInitialProps = async () => {
  const FAQS_GOOGLE_SHEET_ID = '1dlaVEfLwHAbXCwoiDGzUd3w8d7YYnGl5dbPDINKmRUg';
  try {
    const response = await fetch(
      `https://docs.google.com/spreadsheets/d/${FAQS_GOOGLE_SHEET_ID}/gviz/tq?tqx=out:json`,
    );
    const faqsData = await response.text();
    const json = JSON.parse(
      faqsData.replace(
        /.*google.visualization.Query.setResponse\({(.*?)}\);?/s,
        '{$1}',
      ),
    );

    return {
      faqsData: json.table.rows.slice(1),
    };
  } catch (error) {
    console.log(error);
    return { faqsData: null };
  }
};

export default ResourcesPage;
