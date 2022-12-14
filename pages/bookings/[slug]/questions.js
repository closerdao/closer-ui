import { useRouter } from 'next/router';

import { useEffect, useState } from 'react';

import BookingBackButton from '../../../components/BookingBackButton';
import BookingProgress from '../../../components/BookingProgress';
import Layout from '../../../components/Layout';
import PageError from '../../../components/PageError';
import QuestionnaireItem from '../../../components/QuestionnaireItem';

import PageNotAllowed from '../../401';
import { useAuth } from '../../../contexts/auth';
import { useBookingActions, useBookingState } from '../../../contexts/booking';
import api from '../../../utils/api';
import { __ } from '../../../utils/helpers';

const Questionnaire = ({ questions, booking, error }) => {
  const {
    data: { questions: questionsData },
  } = useBookingState();
  const { saveAnswer } = useBookingActions();
  const hasRequiredQuestions = questions.some((question) => question.required);
  const [isSubmitDisabled, setSubmitDisabled] = useState(hasRequiredQuestions);

  useEffect(() => {
    if (!hasRequiredQuestions) {
      return;
    }
    const allRequiredQuestionsCompleted = questions.some((question) => {
      const answer = questionsData.get(question.name);
      const isAnswered = answer !== '' && answer !== undefined;
      return question.required && isAnswered;
    });
    setSubmitDisabled(!allRequiredQuestionsCompleted);
  }, [questionsData]);

  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const handleSubmit = async () => {
    if (!questionsData.size) {
      return;
    }
    try {
      await api.patch(`/booking/${booking._id}`, {
        fields: Array.from(questionsData, ([key, value]) => ({
          [key]: value,
        })),
      });
      router.push(`/bookings/${booking._id}/summary`);
    } catch (err) {
      console.log(err); // TO DO handle error
    }
  };

  const handleAnswer = (name, value) => {
    saveAnswer({ name, value });
  };

  const backToAccomodation = () => {
    router.push(`/bookings/${booking._id}/accomodation`);
  };

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
    <Layout>
      <div className="max-w-screen-sm mx-auto p-8">
        <BookingBackButton goBack={backToAccomodation} />
        <h1 className="step-title border-b border-[#e1e1e1] border-solid pb-2 flex space-x-1 items-center mt-8">
          <span className="mr-1">📄</span>
          <span>{__('bookings_questionnaire_step_title')}</span>
        </h1>
        <BookingProgress />
        <div className="my-16 gap-16 mt-16">
          {questions.map((question) => (
            <QuestionnaireItem
              question={question}
              key={question.name}
              handleAnswer={handleAnswer}
              savedAnswer={questionsData.get(question.name)}
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
    </Layout>
  );
};

Questionnaire.getInitialProps = async ({ query }) => {
  try {
    const [
      {
        data: { results: booking },
      },
      {
        data: { results: questions },
      },
    ] = await Promise.all([
      api.get(`/booking/${query.slug}`),
      api.get('/bookings/questions'),
    ]);
    return { booking, questions, error: null };
  } catch (err) {
    return {
      error: err.message,
      booking: null,
      questions: null,
    };
  }
};

export default Questionnaire;
