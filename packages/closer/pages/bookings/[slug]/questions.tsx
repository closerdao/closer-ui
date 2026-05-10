import { useRouter } from 'next/router';

import { useEffect, useState } from 'react';

import BookingBackButton from '../../../components/BookingBackButton';
import FriendsBookingBlock from '../../../components/FriendsBookingBlock';
import PageError from '../../../components/PageError';
import QuestionnaireItem from '../../../components/QuestionnaireItem';
import { Heading } from '../../../components/ui';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import ProgressBar from '../../../components/ui/ProgressBar';
import Select from '../../../components/ui/Select/Dropdown';
import MultiSelect from '../../../components/ui/Select/MultiSelect';

import { NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import PageNotAllowed from '../../401';
import { BOOKING_STEPS, BOOKING_STEP_TITLE_KEYS } from '../../../constants';
import { SHARED_ACCOMMODATION_PREFERENCES } from '../../../constants/shared.constants';
import { useAuth } from '../../../contexts/auth';
import { usePlatform } from '../../../contexts/platform';
import { useConfig } from '../../../hooks/useConfig';
import { useRedirectPaidBookingToDetail } from '../../../hooks';
import {
  BaseBookingParams,
  BookingConfig,
  Question,
  VolunteerConfig,
} from '../../../types';
import config from '../../../configCached';
import {
  buildBookingAccomodationUrl,
  buildBookingDatesUrl,
  getBookingTokenCurrency,
} from '../../../utils/booking.helpers';
import { parseMessageFromError } from '../../../utils/common';
import { patchUserAndSyncAuthStore } from '../../../utils/platformUserSync';
import { logMetricIfAuthenticated } from '../../../utils/metrics';
import { loadLocaleData } from '../../../utils/locale.helpers';
import FeatureNotEnabled from '../../../components/FeatureNotEnabled';

const prepareQuestions = (eventQuestions: any) => {
  const preparedQuestions = eventQuestions?.map((question: any) => {
    Object.assign(question, { type: question['fieldType'] });
    return question;
  });
  return preparedQuestions;
};

interface Props extends BaseBookingParams {
  bookingConfig: BookingConfig | null;
  volunteerConfig: VolunteerConfig | null;
  error?: string;
  tokenCurrency: string;
}

const Questionnaire = ({
  error: bookingError,
  bookingConfig,
  volunteerConfig,
  tokenCurrency,
}: Props) => {
  const t = useTranslations();
  const router = useRouter();
  const slugParam = router.query.slug;
  const slug = typeof slugParam === 'string' ? slugParam : slugParam?.[0];
  const { goBack } = router.query;

  const { platform } = usePlatform() as any;

  useEffect(() => {
    if (!router.isReady || !slug) return;
    void platform.booking.getOne(slug, { force: true });
  }, [router.isReady, slug, platform]);

  const booking = slug ? platform.booking.findOne(slug)?.toJS?.() ?? null : null;

  useEffect(() => {
    if (booking?.eventId) {
      void platform.event.getOne(booking.eventId);
    }
  }, [booking?.eventId, platform]);

  const event = booking?.eventId
    ? platform.event.findOne(booking.eventId)?.toJS?.() ?? null
    : null;

  useRedirectPaidBookingToDetail(booking);
  const {
    isAuthenticated,
    user: initialUser,
    refetchUser,
    setUser,
  } = useAuth();
  const { APP_NAME } = useConfig();

  const isBookingEnabled =
    bookingConfig?.enabled &&
    process.env.NEXT_PUBLIC_FEATURE_BOOKING === 'true';

  const eventQuestions = event?.fields || [];
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
        if (!initialUser?._id) return;
        await patchUserAndSyncAuthStore({
          platform,
          userId: initialUser._id,
          patchBody: payload,
          setUser,
          refetchUser,
        });
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
      await platform.booking.patch(booking?._id, {
        fields: answers,
      });
      void logMetricIfAuthenticated(initialUser, {
        event: 'booking-questions-save-success',
        value: 'booking',
        point: booking?.duration ?? booking?.adults ?? 0,
      });
      router.push(`/bookings/${booking?._id}/summary`);
    } catch (err) {
      void logMetricIfAuthenticated(initialUser, {
        event: 'booking-questions-save-error',
        value: 'booking',
        point: booking?.duration ?? booking?.adults ?? 0,
      });
      console.log(err);
    }
  };

  const handleAnswer = (name: string, value: string) => {
    const updatedAnswers = answers.map((answer: Record<string, string>) => {
      if (Object.keys(answer)[0] === name) {
        return { [name]: value };
      }
      return answer;
    });
    setAnswers(updatedAnswers);
  };

  const stepUrlParams =
    booking?.start && booking?.end
      ? {
          start: booking.start,
          end: booking.end,
          adults: booking.adults ?? 0,
          ...(booking.children && { children: booking.children }),
          ...(booking.infants && { infants: booking.infants }),
          ...(booking.pets && { pets: booking.pets }),
          currency: booking.useTokens ? tokenCurrency : undefined,
          ...(booking.eventId && { eventId: booking.eventId }),
          ...(booking.volunteerId && { volunteerId: booking.volunteerId }),
          ...(booking.volunteerInfo && {
            volunteerInfo: {
              ...(booking.volunteerInfo.bookingType && {
                bookingType: booking.volunteerInfo.bookingType,
              }),
              ...(booking.volunteerInfo.skills?.length && {
                skills: booking.volunteerInfo.skills,
              }),
              ...(booking.volunteerInfo.diet?.length && {
                diet: booking.volunteerInfo.diet,
              }),
              ...(booking.volunteerInfo.projectId?.length && {
                projectId: booking.volunteerInfo.projectId,
              }),
              ...(booking.volunteerInfo.suggestions && {
                suggestions: booking.volunteerInfo.suggestions,
              }),
            },
          }),
          ...(booking.isFriendsBooking && { isFriendsBooking: true }),
          ...(booking.friendEmails && { friendEmails: booking.friendEmails }),
        }
      : null;

  const resetBooking = () => {
    if (goBack === 'true') {
      router.push(`/bookings/${booking?._id}/rules`);
      return;
    }
    if (stepUrlParams) {
      router.push(buildBookingDatesUrl(stepUrlParams));
    }
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
    return <FeatureNotEnabled feature="booking" />;
  }

  if (!isAuthenticated) {
    return <PageNotAllowed />;
  }

  if (bookingError) {
    return <PageError error={bookingError} />;
  }

  return (
    <>
      <div className="w-full max-w-screen-sm mx-auto p-4 md:p-8">
        <div className="relative flex items-center min-h-[2.75rem] mb-6">
          <BookingBackButton onClick={resetBooking} name={t('buttons_back')} className="relative z-10" />
          <div className="absolute inset-0 flex justify-center items-center pointer-events-none px-4">
            <Heading level={1} className="text-2xl md:text-3xl pb-0 mt-0 text-center">
              <span>{t('bookings_questionnaire_step_title')}</span>
            </Heading>
          </div>
        </div>
        <FriendsBookingBlock isFriendsBooking={booking?.isFriendsBooking} />

        <ProgressBar
          steps={BOOKING_STEPS}
          stepTitleKeys={BOOKING_STEP_TITLE_KEYS}
          stepHrefs={
            stepUrlParams && booking
              ? [
                  buildBookingDatesUrl(stepUrlParams),
                  buildBookingAccomodationUrl(stepUrlParams),
                  `/bookings/${booking._id}/food`,
                  `/bookings/${booking._id}/rules`,
                  null,
                  null,
                  null,
                ]
              : undefined
          }
        />

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
            {t('booking_button_continue')}
          </Button>
        </div>
      </div>
    </>
  );
};

Questionnaire.getInitialProps = async (context: NextPageContext) => {
  try {
    const [messages] = await Promise.all([
      loadLocaleData(context?.locale, process.env.NEXT_PUBLIC_APP_NAME),
    ]);
    const bookingConfig = config.booking;
    const web3Config = config.web3;
    const tokenCurrency = getBookingTokenCurrency(web3Config, bookingConfig);
    const volunteerConfig = config.volunteering;

    return {
      bookingConfig,
      volunteerConfig,
      error: null,
      messages,
      tokenCurrency,
    };
  } catch (err) {
    return {
      error: parseMessageFromError(err),
      bookingConfig: null,
      volunteerConfig: null,
      questions: null,
      messages: null,
      tokenCurrency: getBookingTokenCurrency(),
    };
  }
};

export default Questionnaire;
