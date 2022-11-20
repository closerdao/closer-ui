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
  const { steps } = useBookingState();
  const currentStep = steps.find(
    (step) => step.path === '/bookings/new/questionnaire',
  );
  const accomodation = steps.find(
    (step) => step.path === '/bookings/new/accomodation',
  ).data;
  const savedData = currentStep.data;

  const currentStepIndex = steps.indexOf(currentStep);
  const { saveStepData, goToNextStep } = useBookingActions();

  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [answers, setAnswers] = useState(new Map());

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setIsLoading(true);
        const {
          data: { results },
        } = await api.get('/bookings/questions');
        setQuestions(results);
        if (savedData) {
          setAnswers(savedData);
          return;
        }
        const newMap = new Map();
        results.forEach((question) => {
          if (!newMap.has(question.name)) {
            newMap.set(question.name, '');
          }
        });
        setAnswers(newMap);
      } catch (err) {
        console.log(err); // TO DO handle error
      } finally {
        setIsLoading(false);
      }
    };
    if (!accomodation.bookingId) {
      router.push('/bookings/new/accomodation');
    }
    fetchQuestions();
  }, []);

  const handleSubmit = async () => {
    saveStepData(answers);
    try {
      await api.patch(
        `/booking/${accomodation.bookingId}`,
        JSON.stringify({
          fields: Object.fromEntries(answers),
        }),
      );
      goToNextStep();
    } catch (err) {
      console.log(err); // TO DO handle error
    }
  };

  const handleAnswer = (name, answer) => {
    setAnswers((prevMap) => {
      let newMap;
      if (prevMap.size) {
        newMap = new Map(prevMap);
      } else {
        newMap = new Map();
      }
      newMap.set(name, answer);
      return newMap;
    });
  };

  return (
    <Layout>
      <div className="max-w-screen-xl mx-auto p-8">
        <BookingBackButton />
        <h1 className="font-normal border-b border-[#e1e1e1] border-solid pb-2 flex space-x-1 items-center mt-8">
          <span className="mr-1">🏡</span>
          <span>{__('bookings_questionnaire_step_title')}</span>
        </h1>
        <Progress progress={currentStepIndex + 1} total={steps.length} />
        <h2 className="text-2xl leading-10 font-normal mt-16 mb-4">
          {__('bookings_questionnaire_step_subtitle')}
        </h2>
        <div className="my-16">
          {isLoading && <p>Loading...</p>}
          {!isLoading &&
            questions.map((question) => (
              <QuestionnaireItem
                question={question}
                key={question.name}
                handleAnswer={handleAnswer}
                savedAnswer={answers.size && answers.get(question.name)}
              />
            ))}
        </div>
        <button className="w-full btn uppercase" onClick={handleSubmit}>
          {__('buttons_submit')}
        </button>
      </div>
    </Layout>
  );
};

export default Questionnaire;
