import { useRouter } from 'next/router';

import { useEffect, useState } from 'react';

import { BookingBackButton } from '../../../components/BookingBackButton';
import Layout from '../../../components/Layout';
import { Progress } from '../../../components/Progress';
import { QuestionnaireItem } from '../../../components/QuestionnaireItem';

import { useBookingActions, useBookingState } from '../../../contexts/booking';
import api from '../../../utils/api';
import { __ } from '../../../utils/helpers';

const Questionnaire = () => {
  const router = useRouter();
  const { steps, settings } = useBookingState();
  const { questions } = settings;
  const accomodation = steps.find(
    (step) => step.path === '/bookings/new/accomodation',
  ).data;

  const currentStep = steps.find(
    (step) => step.path === '/bookings/new/questionnaire',
  );
  const savedData = currentStep.data;
  const currentStepIndex = steps.indexOf(currentStep);
  const { saveStepData, goToNextStep } = useBookingActions();
  const [answers, setAnswers] = useState(
    new Map(savedData.size ? savedData : []),
  );

  useEffect(() => {
    if (!questions) {
      return;
    }
    const newMap = new Map();
    questions.forEach((question) => {
      newMap.set(question.name, '');
    });
    setAnswers(newMap);
    if (!accomodation.bookingId) {
      router.push('/bookings/new/accomodation');
    }
  }, [settings.questions]);

  const hasRequiredQuestions =
    questions && questions.some((question) => question.required);
  const [isSubmitDisabled, setSubmitDisabled] = useState(hasRequiredQuestions);

  useEffect(() => {
    if (!questions || !hasRequiredQuestions) {
      return;
    }
    const allRequiredQuestionsCompleted = questions.some(
      (question) => question.required && answers.get(question.name) !== '',
    );
    console.log('allRequiredQuestionsCompleted', allRequiredQuestionsCompleted);
    setSubmitDisabled(!allRequiredQuestionsCompleted);
  }, [answers]);

  if (!questions) {
    return null;
  }

  const handleSubmit = async () => {
    saveStepData(answers);
    if (!answers.size) {
      return;
    }
    try {
      await api.patch(`/booking/${accomodation.bookingId}`, {
        fileds: Array.from(answers, ([key, value]) => ({
          [key]: value,
        })),
      });
      goToNextStep();
    } catch (err) {
      console.log(err); // TO DO handle error
    }
  };

  const handleAnswer = (name, answer) => {
    setAnswers((prevMap) => {
      const newMap = prevMap.size ? new Map(prevMap) : new Map();
      newMap.set(name, answer);
      return newMap;
    });
  };

  return (
    <Layout>
      <div className="max-w-screen-xl mx-auto p-8">
        <BookingBackButton />
        <h1 className="font-normal border-b border-[#e1e1e1] border-solid pb-2 flex space-x-1 items-center mt-8">
          <span className="mr-1">📄</span>
          <span>{__('bookings_questionnaire_step_title')}</span>
        </h1>
        <Progress progress={currentStepIndex + 1} total={steps.length} />
        <h2 className="text-2xl leading-10 font-normal mt-16 mb-4">
          {__('bookings_questionnaire_step_subtitle')}
        </h2>
        <div className="my-16 gap-16">
          {questions.map((question) => (
            <QuestionnaireItem
              question={question}
              key={question.name}
              handleAnswer={handleAnswer}
              savedAnswer={answers.size ? answers.get(question.name) : ''}
            />
          ))}
          <button
            className="w-full btn uppercase disabled:cursor-not-allowed disabled:text-gray-400 disabled:border-gray-400"
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

export default Questionnaire;
