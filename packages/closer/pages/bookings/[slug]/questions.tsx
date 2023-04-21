import { useRouter } from 'next/router';

import { useEffect, useState } from 'react';

import BookingBackButton from '../../../components/BookingBackButton';
import PageError from '../../../components/PageError';
import QuestionnaireItem from '../../../components/QuestionnaireItem';
import Button from '../../../components/ui/Button';
import ProgressBar from '../../../components/ui/ProgressBar';

import { ParsedUrlQuery } from 'querystring';

import PageNotAllowed from '../../401';
import PageNotFound from '../../404';
import { BOOKING_STEPS } from '../../../constants';
import { useAuth } from '../../../contexts/auth';
import { BaseBookingParams, Booking, Question } from '../../../types';
import api from '../../../utils/api';
import { parseMessageFromError } from '../../../utils/common';
import { __ } from '../../../utils/helpers';

const prepareQuestions = (eventQuestions: any) => {
  const preparedQuestions = eventQuestions.map((question: any) => {
    Object.assign(question, { type: question['fieldType'] });
    return question;
  });
  return preparedQuestions;
};

interface Props extends BaseBookingParams {
  eventQuestions: Question[];
  booking: Booking;
  error?: string;
}

const Questionnaire = ({ eventQuestions, booking, error }: Props) => {
  const questions: Question[] = prepareQuestions(eventQuestions);

  const hasRequiredQuestions = questions.some((question) => question.required);
  const [isSubmitDisabled, setSubmitDisabled] = useState(hasRequiredQuestions);

  const [answers, setAnswers] = useState(
    booking?.fields && booking?.fields?.length
      ? booking?.fields
      : questions.map((question) => ({ [question.name]: '' })),
  );

  useEffect(() => {
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
      //TODO when we have user profile page updated: update user preferences
      // PATCH /user/:id {preferences}
      router.push(`/bookings/${booking._id}/summary`);
    } catch (err) {
      console.log(err); // TO DO handle error
    }
  };

  const handleAnswer = (name: string, value: string) => {
    const updatedAnswers = answers.map((answer) => {
      if (Object.keys(answer)[0] === name) {
        return { [name]: value };
      }
      return answer;
    });
    setAnswers(updatedAnswers);
  };

  const resetBooking = () => {
    router.push('/bookings/create');
  };

  const getAnswer = (
    answers: { [key: string]: string }[],
    questionName: string,
  ) => {
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
        <h1 className="step-title pb-2 flex space-x-1 items-center mt-8">
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

          <Button onClick={handleSubmit} isEnabled={!isSubmitDisabled}>
            {__('buttons_submit')}
          </Button>
        </div>
      </div>
    </>
  );
};

Questionnaire.getInitialProps = async ({
  query,
}: {
  query: ParsedUrlQuery;
}) => {
  try {
    const {
      data: { results: booking },
    } = await api.get(`/booking/${query.slug}`);

    const [
      {
        data: { results: event },
      },
    ] = await Promise.all([api.get(`/event/${booking.eventId}`)]);

    return { booking, eventQuestions: event.fields, error: null };
  } catch (err) {
    return {
      error: parseMessageFromError(err),
      booking: null,
      questions: null,
    };
  }
};

export default Questionnaire;
