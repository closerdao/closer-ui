import { useRouter } from 'next/router';

import { useEffect, useState } from 'react';

import BookingBackButton from '../../../components/BookingBackButton';
import PageError from '../../../components/PageError';
import QuestionnaireItem from '../../../components/QuestionnaireItem';
import Button from '../../../components/ui/Button';
import ProgressBar from '../../../components/ui/ProgressBar';

import PageNotAllowed from '../../401';
import PageNotFound from '../../404';
import { BOOKING_STEPS } from '../../../constants';
import { useAuth } from '../../../contexts/auth';
import { BaseBookingParams, Booking, Question } from '../../../types';
import api from '../../../utils/api';
import { __ } from '../../../utils/helpers';
import { ParsedUrlQuery } from 'querystring';
import { parseMessageFromError } from '../../../utils/common';

const questionsHardcoded: Question[] = [
  { type: 'text', name: 'What brings you to Closer?', required: true },
  { type: 'text', name: 'Do you have any dietary needs?' },
  {
    type: 'select',
    name: 'How do you like your mattress?',
    options: ['soft', 'medium', 'hard'],
  },
];

interface Props extends BaseBookingParams {
  questions: Question[];
  booking: Booking;
  error?: string;
}

const Questionnaire = ({ questions, booking, error }: Props) => {
  const hasRequiredQuestions = questions.some((question) => question.required);
  const [isSubmitDisabled, setSubmitDisabled] = useState(hasRequiredQuestions);


  console.log(booking?.fields);
  const [answers, setAnswers] = useState(
    booking?.fields.length ? booking?.fields : questions.map((question) => ({ [question.name]: '' })),
  );

  useEffect(() => {
    console.log('answers=', answers);
    if (!hasRequiredQuestions) {
      return;
    }
    const allRequiredQuestionsCompleted = questions.some((question) => {
      const answer = getAnswer(answers, question.name);
      const isAnswered = answer !== '';
      return question.required && isAnswered;
    });
    setSubmitDisabled(!allRequiredQuestionsCompleted);
  }, [answers]);

  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const handleSubmit = async () => {
    try {
      await api.patch(`/booking/${booking._id}`, {
        fields: answers,
      });
      router.push(`/bookings/${booking._id}/summary`);
    } catch (err) {
      console.log(err); // TO DO handle error
    }
  };

  const handleAnswer = (name: string, value: string) => {
    console.log('name=', name);
    console.log('value=', value);

    // console.log('answers=', answers);

    const updatedAnswers = answers.map((answer) => {
      if (Object.keys(answer)[0] === name) {
        return { [name]: value };
      }
      return answer;
    });
    setAnswers(updatedAnswers);

    console.log('updatedAnswers=', updatedAnswers);
  };

  const resetBooking = () => {
    router.push('/bookings/create');
  };

  const getAnswer = (answers: { [key: string]: string; }[], questionName: string) => {
    const savedAnswer = answers?.find(
      (answer) => Object.keys(answer)[0] === questionName,
    );
    if (savedAnswer) {
      return savedAnswer[questionName];
    }
    return '';
  };

  if (process.env.NEXT_PUBLIC_FEATURE_BOOKING !== 'true') {
    return <PageNotFound />;
  }

  if (!isAuthenticated) {
    return <PageNotAllowed />;
  }

  if (!questions) {
    return null;
  }

  if (error) {
    return <PageError error={error} />;
  }

  return (
    <>
      <div className="w-full max-w-screen-sm mx-auto p-8">
        <BookingBackButton
          onClick={resetBooking}
          name={__('buttons_back_to_dates')}
        />
        <h1 className="step-title border-b border-[#e1e1e1] border-solid pb-2 flex space-x-1 items-center mt-8">
          <span className="mr-1">📄</span>
          <span>{__('bookings_questionnaire_step_title')}</span>
        </h1>
        <ProgressBar steps={BOOKING_STEPS} />
        <div className="my-16 gap-16 mt-16">
          {questions.map((question) => (
            <QuestionnaireItem
              question={question}
              key={question.name}
              handleAnswer={handleAnswer}
              savedAnswer={getAnswer(booking?.fields, question.name)}
            />
          ))}

          <Button onClick={handleSubmit} disabled={isSubmitDisabled}>
            {__('buttons_submit')}
          </Button>
        </div>
      </div>
    </>
  );
};

Questionnaire.getInitialProps = async ({ query }: { query: ParsedUrlQuery }) => {
  try {
    const [
      {
        data: { results: booking },
      },
      {
        data: { results: settings },
      },
    ] = await Promise.all([
      api.get(`/booking/${query.slug}`),
      api.get('/bookings/settings'),
    ]);
    // return { booking, questions: settings.questions, error: null };
    return { booking, questions: questionsHardcoded, error: null };
  } catch (err) {
    return {
      error: parseMessageFromError(err),
      booking: null,
      questions: null,
    };
  }
};

export default Questionnaire;
