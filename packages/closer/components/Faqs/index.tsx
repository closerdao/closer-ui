import { FormattedFaqs, QuestionAndAnswer } from '../../types/resources';
import { ErrorMessage } from '../ui';

interface Props {
  faqs: null | FormattedFaqs[];
  error: string | null;
  isExpanded?: boolean;
}

const Faqs = ({ faqs, error, isExpanded }: Props) => {
  return (
    <div className="w-full">
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
              <details
                className="appearance-none group py-2 "
                {...(isExpanded ? { open: true } : {})}
              >
                <summary className="custom-summary flex cursor-pointer items-center justify-between py-1 hover:text-c-blue ">
                  <p className="uppercase font-bold text-lg my-2">
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
                <div className="px-4">
                  {questionsAndAnswers.map(
                    (questionAndAnswer: QuestionAndAnswer) => {
                      return (
                        <div
                          key={questionAndAnswer.q}
                          className="shadow rounded-md border-t border-gray-50 mb-3 overflow-hidden"
                        >
                          <details className="appearance-none group/level2">
                            <summary className="custom-summary  flex cursor-pointer items-center justify-between py-1 hover:text-c-blue pr-3">
                              <p className="font-bold px-4 py-3">
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
                                <>
                                  {questionAndAnswer.linkTexts.map(
                                    (linkText, index) => {
                                      return (
                                        <span key={linkText}>
                                          {' '}
                                          <a
                                            href={
                                              (questionAndAnswer?.linkUrls &&
                                                questionAndAnswer?.linkUrls[
                                                  index
                                                ]) ||
                                              ''
                                            }
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="underline text-accent hover:text-black"
                                          >
                                            {linkText}
                                          </a>
                                        </span>
                                      );
                                    },
                                  )}
                                </>
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
    </div>
  );
};

export default Faqs;
