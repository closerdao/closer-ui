import { useRouter } from 'next/router';

import { useEffect, useState } from 'react';

import BookingBackButton from '../../../components/BookingBackButton';
import PageError from '../../../components/PageError';
import QuestionnaireItem from '../../../components/QuestionnaireItem';
import { Heading } from '../../../components/ui';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import ProgressBar from '../../../components/ui/ProgressBar';
import Select from '../../../components/ui/Select/Dropdown';
import MultiSelect from '../../../components/ui/Select/MultiSelect';
import { SHARED_ACCOMMODATION_PREFERENCES } from '../../../constants/shared.constants';

import dayjs from 'dayjs';
import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import PageNotAllowed from '../../401';
import { BOOKING_STEPS } from '../../../constants';
import { useAuth } from '../../../contexts/auth';
import { usePlatform } from '../../../contexts/platform';
import { useConfig } from '../../../hooks/useConfig';
import {
  BaseBookingParams,
  Booking,
  BookingConfig,
  Question,
  VolunteerConfig,
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
  volunteerConfig: VolunteerConfig | null;
  error?: string;
}

const Questionnaire = ({
  eventQuestions,
  booking,
  error: bookingError,
  bookingConfig,
  volunteerConfig,
}: Props) => {
  const t = useTranslations();
  const router = useRouter();
  const { goBack } = router.query;
  const { isAuthenticated, user: initialUser, refetchUser } = useAuth();
  const { APP_NAME } = useConfig();
  const { platform } = usePlatform() as any;

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

  const [userPreferences, setUserPreferences] = useState({
    diet: Array.isArray(initialUser?.preferences?.diet)
      ? initialUser?.preferences?.diet
      : initialUser?.preferences?.diet?.split(',') || [],
    sharedAccomodation: initialUser?.preferences?.sharedAccomodation || '',
    superpower: initialUser?.preferences?.superpower || '',
    skills: initialUser?.preferences?.skills || [],
  });

  useEffect(() => {
    if (initialUser?.preferences) {
      setUserPreferences({
        diet: Array.isArray(initialUser.preferences.diet)
          ? initialUser.preferences.diet
          : initialUser.preferences.diet?.split(',') || [],
        sharedAccomodation: initialUser.preferences.sharedAccomodation || '',
        superpower: initialUser.preferences.superpower || '',
        skills: initialUser.preferences.skills || [],
      });
    }
  }, [initialUser]);

  const [hasSaved, setHasSaved] = useState(false);
  const [preferencesError, setPreferencesError] = useState<string | null>(null);

  const skillsOptions = volunteerConfig?.skills?.split(',') || [];
  const dietOptions = volunteerConfig?.diet?.split(',') || [];

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

  const saveUserData = (
    attribute: keyof typeof userPreferences,
  ): ((value: string | string[]) => void) => {
    return async (value: string | string[]) => {
      const payload: any = {
        preferences: {
          ...initialUser?.preferences,
          [attribute]: value,
        },
      };

      try {
        setHasSaved(false);
        await platform.user.patch(initialUser?._id, payload);
        await refetchUser();
        setPreferencesError(null);
        setHasSaved(true);
        setTimeout(() => setHasSaved(false), 2000);
      } catch (err) {
        const errorMessage = parseMessageFromError(err);
        setPreferencesError(errorMessage);
      }
    };
  };

  const handleSubmit = async () => {
    try {
      await api.patch(`/booking/${booking?._id}`, {
        fields: answers,
      });
      router.push(`/bookings/${booking?._id}/summary`);
    } catch (err) {
      console.log(err);
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

  if (bookingError) {
    return <PageError error={bookingError} />;
  }

  return (
    <>
      <div className="w-full max-w-screen-sm mx-auto p-8">
        <BookingBackButton onClick={resetBooking} name={t('buttons_back')} />

        <Heading level={1} className="pb-4 mt-8">
          <span className="mr-4">📄</span>
          <span>{t('bookings_questionnaire_step_title')}</span>
        </Heading>
        <ProgressBar steps={BOOKING_STEPS} />

        {preferencesError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md mb-6">
            <span className="block sm:inline">{preferencesError}</span>
          </div>
        )}

        <div className="my-16 gap-16 mt-16">
          {questions?.map((question) => (
            <QuestionnaireItem
              question={question}
              key={question.name}
              handleAnswer={handleAnswer}
              savedAnswer={getAnswer(booking?.fields, question.name) || ''}
            />
          ))}

          {/* User Preferences */}
          <section className=" bg-white border border-gray-200 rounded-lg p-6 shadow-sm mb-8">
            <MultiSelect
              label={t('settings_dietary_preferences')}
              values={userPreferences.diet}
              onChange={(value) => {
                setUserPreferences((prev) => ({ ...prev, diet: value }));
                saveUserData('diet')(value);
              }}
              options={dietOptions}
              placeholder={t('settings_pick_or_create_yours')}
              className="mb-4"
            />

            {APP_NAME && APP_NAME?.toLowerCase() !== 'moos' && (
              <Select
                label={t('settings_shared_accommodation_preference')}
                value={userPreferences.sharedAccomodation}
                options={SHARED_ACCOMMODATION_PREFERENCES}
                className="mb-4"
                onChange={(value) => {
                  setUserPreferences((prev) => ({
                    ...prev,
                    sharedAccomodation: value,
                  }));
                  saveUserData('sharedAccomodation')(value);
                }}
                isRequired
              />
            )}

            <Input
              label={t('settings_superpower')}
              placeholder={t('settings_superpower_placeholder')}
              value={userPreferences.superpower}
              onChange={(e) => {
                setUserPreferences((prev) => ({
                  ...prev,
                  superpower: e.target.value,
                }));
                saveUserData('superpower')(e.target.value);
              }}
              isInstantSave={true}
              hasSaved={hasSaved}
              setHasSaved={setHasSaved}
              className="mb-4"
            />

            <MultiSelect
              label={t('settings_skills')}
              values={userPreferences.skills}
              onChange={(value) => {
                setUserPreferences((prev) => ({ ...prev, skills: value }));
                saveUserData('skills')(value);
              }}
              options={skillsOptions}
              placeholder={t('settings_pick_or_create_yours')}
              className="mb-4"
            />
          </section>

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
    const [bookingRes, bookingConfigRes, volunteerConfigRes, messages] =
      await Promise.all([
        api.get(`/booking/${query.slug}`).catch((err) => {
          console.error('Error fetching booking config:', err);
          return null;
        }),
        api.get('/config/booking').catch(() => {
          return null;
        }),
        api.get('/config/volunteering').catch(() => {
          return null;
        }),
        loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
      ]);
    const booking = bookingRes?.data?.results;
    const bookingConfig = bookingConfigRes?.data?.results?.value;
    const volunteerConfig = volunteerConfigRes?.data?.results?.value;

    const optionalEvent =
      booking.eventId && (await api.get(`/event/${booking.eventId}`));
    const event = optionalEvent?.data?.results;

    return {
      booking,
      bookingConfig,
      volunteerConfig,
      eventQuestions: event?.fields,
      error: null,
      messages,
    };
  } catch (err) {
    return {
      error: parseMessageFromError(err),
      booking: null,
      bookingConfig: null,
      volunteerConfig: null,
      questions: null,
      messages: null,
    };
  }
};

export default Questionnaire;
