import { useRouter } from 'next/router';

import { useEffect, useState } from 'react';

import BookingBackButton from '../../../components/BookingBackButton';
import PageError from '../../../components/PageError';
import QuestionnaireItem from '../../../components/QuestionnaireItem';
import ProgressBar from '../../../components/ui/ProgressBar';

import PageNotAllowed from '../../401';
import PageNotFound from '../../404';
import { BOOKING_STEPS } from '../../../constants';
import { useAuth } from '../../../contexts/auth';
import api from '../../../utils/api';
import { __ } from '../../../utils/helpers';

const Questionnaire = ({ questions, booking, error }) => {
  const hasRequiredQuestions = questions.some((question) => question.required);
  const [isSubmitDisabled, setSubmitDisabled] = useState(hasRequiredQuestions);
  const [answers, setAnswers] = useState(
    booking?.fields || questions.map((question) => ({ [question.name]: '' })),
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
      router.push(`/bookings/${booking._id}/summary`);
    } catch (err) {
      console.log(err); // TO DO handle error
    }
  };

  const handleAnswer = (name, value) => {
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

  const getAnswer = (answers, questionName) => {
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
          action={resetBooking}
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
          <button
            className="booking-btn"
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
          >
            {__('buttons_submit')}
          </button>
        </div>
      </div>
    </>
  );
};

Questionnaire.getInitialProps = async ({ query }) => {
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
    return { booking, questions: settings.questions, error: null };
  } catch (err) {
    return {
      error: err.message,
      booking: null,
      questions: null,
    };
  }
};

export default Questionnaire;
