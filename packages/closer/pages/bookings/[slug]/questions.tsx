import { useRouter } from 'next/router';

import { useEffect, useState } from 'react';

import BookingBackButton from '../../../components/BookingBackButton';
import PageError from '../../../components/PageError';
import QuestionnaireItem from '../../../components/QuestionnaireItem';
import { Heading } from '../../../components/ui';
import Button from '../../../components/ui/Button';
import ProgressBar from '../../../components/ui/ProgressBar';

import dayjs from 'dayjs';
import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import PageNotAllowed from '../../401';
import { BOOKING_STEPS } from '../../../constants';
import { useAuth } from '../../../contexts/auth';
import {
  BaseBookingParams,
  Booking,
  BookingConfig,
  Question,
} from '../../../types';
import api from '../../../utils/api';
import { parseMessageFromError } from '../../../utils/common';
import { loadLocaleData } from '../../../utils/locale.helpers';
import PageNotFound from '../../not-found';

const prepareQuestions = (eventQuestions: any) => {
  const preparedQuestions = eventQuestions?.map((question: any) => {
    Object.assign(question, { type: question['fieldType'] });
    return question;
  });
  return preparedQuestions;
};

interface Props extends BaseBookingParams {
  eventQuestions: Question[];
  booking: Booking | null;
  bookingConfig: BookingConfig | null;
  error?: string;
}

const Questionnaire = ({
  eventQuestions,
  booking,
  error,
  bookingConfig,
}: Props) => {
  const t = useTranslations();
  const router = useRouter();
  const { goBack } = router.query;
  const { isAuthenticated } = useAuth();

  const isBookingEnabled =
    bookingConfig?.enabled &&
    process.env.NEXT_PUBLIC_FEATURE_BOOKING === 'true';

  const questions: Question[] = prepareQuestions(eventQuestions);

  const hasRequiredQuestions = questions?.some((question) => question.required);
  const [isSubmitDisabled, setSubmitDisabled] = useState(hasRequiredQuestions);

  const [answers, setAnswers] = useState(
    booking?.fields && booking?.fields?.length
      ? booking?.fields
      : questions?.map((question) => ({ [question.name]: '' })),
  );

  useEffect(() => {
    if (!hasRequiredQuestions) {
      return;
    }
    const allRequiredQuestionsCompleted = questions?.some((question) => {
      const answer = getAnswer(answers, question.name);
      const isAnswered = answer !== '';
      return question.required && isAnswered;
    });
    setSubmitDisabled(!allRequiredQuestionsCompleted);
  }, [answers]);

  // useEffect(() => {
  //   //this is a temporary solution to redirect to summary page if there are no questions
  //   //once we have questions from user profile integrated we should remove this
  //   if (!questions?.length) {
  //     if (goBack === 'true') {
  //       resetBooking();
  //       return;
  //     }
  //     router.push(`/bookings/${booking?._id}/summary`);
  //   }
  // }, []);

  const handleSubmit = async () => {
    try {
      await api.patch(`/booking/${booking?._id}`, {
        fields: answers,
      });
      //TODO when we have user profile page updated: update user preferences
      // PATCH /user/:id {preferences}
      router.push(`/bookings/${booking?._id}/summary`);
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
    if (goBack === 'true') {
      router.push(`/bookings/${booking?._id}/rules`);
      return;
    }
    if (booking?.eventId) {
      router.push(
        `/bookings/create/dates?eventId=${booking.eventId}&start=${dayjs(
          booking.start,
        ).format('YYYY-MM-DD')}&end=${dayjs(booking.end).format('YYYY-MM-DD')}`,
      );
      return;
    }
    if (booking?.volunteerId) {
      router.push(
        `/bookings/create/dates?volunteerId=${
          booking.volunteerId
        }&start=${dayjs(booking.start).format('YYYY-MM-DD')}&end=${dayjs(
          booking.end,
        ).format('YYYY-MM-DD')}`,
      );
      return;
    }
    router.push(
      `/bookings/create/dates?start=${dayjs(booking?.start).format(
        'YYYY-MM-DD',
      )}&end=${dayjs(booking?.end).format('YYYY-MM-DD')}`,
    );
  };

  const getAnswer = (
    answers: { [key: string]: string }[] | undefined,
    questionName: string,
  ) => {
    if (!answers) {
      return '';
    }
    const savedAnswer = answers?.find(
      (answer) => Object.keys(answer)[0] === questionName,
    );
    if (savedAnswer) {
      return savedAnswer[questionName];
    }
  };

  if (!isBookingEnabled) {
    return <PageNotFound />;
  }

  if (!isAuthenticated) {
    return <PageNotAllowed />;
  }

  if (error) {
    return <PageError error={error} />;
  }

  return (
    <>
      <div className="w-full max-w-screen-sm mx-auto p-8">
        <BookingBackButton
          onClick={resetBooking}
          name={t('buttons_back')}
        />

        <Heading level={1} className="pb-4 mt-8">
          <span className="mr-4">📄</span>
          <span>{t('bookings_questionnaire_step_title')}</span>
        </Heading>
        <ProgressBar steps={BOOKING_STEPS} />
        <div className="my-16 gap-16 mt-16">
          {questions?.map((question) => (
            <QuestionnaireItem
              question={question}
              key={question.name}
              handleAnswer={handleAnswer}
              savedAnswer={getAnswer(booking?.fields, question.name) || ''}
            />
          ))}

          <Button onClick={handleSubmit} isEnabled={!isSubmitDisabled}>
            {t('buttons_submit')}
          </Button>
        </div>
      </div>
    </>
  );
};

Questionnaire.getInitialProps = async (context: NextPageContext) => {
  const { query } = context;

  try {
    const [bookingRes, bookingConfigRes, messages] = await Promise.all([
      api.get(`/booking/${query.slug}`).catch((err) => {
        console.error('Error fetching booking config:', err);
        return null;
      }),
      api.get('/config/booking').catch(() => {
        return null;
      }),
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);
    const booking = bookingRes?.data?.results;
    const bookingConfig = bookingConfigRes?.data?.results?.value;

    const optionalEvent =
      booking.eventId && (await api.get(`/event/${booking.eventId}`));
    const event = optionalEvent?.data?.results;

    return {
      booking,
      bookingConfig,
      eventQuestions: event?.fields,
      error: null,
      messages,
    };
  } catch (err) {
    return {
      error: parseMessageFromError(err),
      booking: null,
      bookingConfig: null,
      questions: null,
      messages: null,
    };
  }
};

export default Questionnaire;
