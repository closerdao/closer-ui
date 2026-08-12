import { useRouter } from 'next/router';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useTranslations } from 'next-intl';

import {
  VOLUNTEER_APPLICATION_FUNNEL_STEPS,
  VOLUNTEER_APPLICATION_STEPS,
  VOLUNTEER_APPLICATION_STEP_TITLE_KEYS,
} from '../../constants/volunteerApplication';
import { useAuth } from '../../contexts/auth';
import { usePlatform } from '../../contexts/platform';
import type { VolunteerInfo } from '../../types/booking';
import type { VolunteerConfig } from '../../types/api';
import type {
  VolunteerApplication,
  VolunteerApplicationStepId,
} from '../../types/volunteerApplication';
import {
  pruneConditionalAnswers,
  validateVolunteerApplicationStep,
  type VolunteerApplicationErrors,
} from '../../utils/volunteerApplication.helpers';
import {
  emptyVolunteerApplication,
  readVolunteerApplicationDraft,
  writeVolunteerApplicationDraft,
} from '../../utils/volunteerApplicationDraft';
import Button from '../ui/Button';
import Heading from '../ui/Heading';
import Progress from '../ui/ProgressBar/Progress';
import VolunteerApplicationStepAbout from './volunteerApplicationStepAbout';
import VolunteerApplicationStepAgreement from './volunteerApplicationStepAgreement';
import VolunteerApplicationStepExperience from './volunteerApplicationStepExperience';
import VolunteerApplicationStepHealth from './volunteerApplicationStepHealth';

interface Props {
  volunteerConfig: VolunteerConfig | null;
  bookingType: 'volunteer' | 'residence';
  platformName: string;
  /** Dates carried over from the listing, if the applicant came from one. */
  start?: string;
  end?: string;
  guestRateLabel?: string;
  onExit: () => void;
}

const splitConfigList = (value: string | undefined): string[] =>
  value
    ?.split(',')
    .map((item) => item.trim())
    .filter(Boolean) || [];

const VolunteerApplicationForm = ({
  volunteerConfig,
  bookingType,
  platformName,
  start,
  end,
  guestRateLabel,
  onExit,
}: Props) => {
  const t = useTranslations();
  const router = useRouter();
  const { user } = useAuth();
  const { platform } = usePlatform() as any;

  const [volunteerInfo, setVolunteerInfo] = useState<VolunteerInfo>(() => ({
    bookingType,
    skills: [],
    diet: [],
    suggestions: '',
    projectId: [],
    application: emptyVolunteerApplication(),
  }));
  const [stepId, setStepId] = useState<VolunteerApplicationStepId>('about');
  const [errors, setErrors] = useState<VolunteerApplicationErrors>({});
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const application =
    volunteerInfo.application || emptyVolunteerApplication();

  const stepIndex = VOLUNTEER_APPLICATION_STEPS.indexOf(stepId);
  const isLastStep = stepIndex === VOLUNTEER_APPLICATION_STEPS.length - 1;

  const skillOptions = useMemo(
    () => splitConfigList(volunteerConfig?.skills),
    [volunteerConfig?.skills],
  );
  const dietOptions = useMemo(
    () => splitConfigList(volunteerConfig?.diet),
    [volunteerConfig?.diet],
  );

  // Restore the saved draft, falling back to what we already know about the user.
  useEffect(() => {
    if (isHydrated || !user?._id) return;
    const draft = readVolunteerApplicationDraft(user._id, bookingType);
    if (draft) {
      setVolunteerInfo({ ...draft.volunteerInfo, bookingType });
      setStepId(draft.step);
      setSavedAt(draft.savedAt);
    } else {
      const preferences = user.preferences as any;
      const userDiet = Array.isArray(preferences?.diet)
        ? preferences.diet
        : preferences?.diet?.split(',').filter(Boolean) || [];
      setVolunteerInfo((prev) => ({
        ...prev,
        skills: preferences?.skills || [],
        diet: userDiet,
        application: {
          ...emptyVolunteerApplication(),
          about: {
            ...emptyVolunteerApplication().about,
            fullName: user.screenname || '',
            phone: (user as any).phone || '',
          },
        },
      }));
    }
    setIsHydrated(true);
  }, [user?._id, isHydrated, bookingType]);

  // Persist on every change so a drop-off mid-step loses nothing.
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!isHydrated || !user?._id) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const at = writeVolunteerApplicationDraft(user._id, bookingType, {
        volunteerInfo,
        step: stepId,
      });
      if (at) setSavedAt(at);
    }, 500);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [volunteerInfo, stepId, isHydrated, user?._id, bookingType]);

  const updateApplication = useCallback(
    (patch: Partial<VolunteerApplication>) => {
      setVolunteerInfo((prev) => ({
        ...prev,
        application: {
          ...(prev.application || emptyVolunteerApplication()),
          ...patch,
        },
      }));
    },
    [],
  );

  const clearError = (keys: string[]) =>
    setErrors((prev) => {
      const next = { ...prev };
      keys.forEach((key) => delete next[key]);
      return next;
    });

  const goToStep = (nextStepId: VolunteerApplicationStepId) => {
    setStepId(nextStepId);
    setErrors({});
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    if (stepIndex === 0) {
      onExit();
      return;
    }
    goToStep(VOLUNTEER_APPLICATION_STEPS[stepIndex - 1]);
  };

  const persistUserPreferences = async () => {
    if (!user?._id) return;
    try {
      await platform.user.patch(user._id, {
        preferences: {
          ...(user.preferences as any),
          skills: [...new Set(volunteerInfo.skills || [])],
          diet: [...new Set(volunteerInfo.diet || [])],
        },
      });
    } catch (error) {
      // Preferences are a convenience — never block the application on them.
      console.error(error);
    }
  };

  const handleNext = async () => {
    const pruned = pruneConditionalAnswers(application);
    const stepErrors = validateVolunteerApplicationStep(stepId, pruned, t);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    updateApplication(pruned);

    if (!isLastStep) {
      goToStep(VOLUNTEER_APPLICATION_STEPS[stepIndex + 1]);
      return;
    }

    setIsSubmitting(true);

    // Flush synchronously: the debounced save would be cancelled by the unmount
    // that router.push triggers, and /stay/create reads this draft immediately.
    writeVolunteerApplicationDraft(user?._id, bookingType, {
      volunteerInfo: { ...volunteerInfo, application: pruned },
      step: stepId,
    });

    await persistUserPreferences();

    // The application itself stays in the local draft — it holds health data and
    // must never travel in the URL. /stay/create picks it up and sends it with
    // POST /stays.
    const params = new URLSearchParams({
      bookingType,
      ...(start ? { start } : {}),
      ...(end ? { end } : {}),
    });
    router.push(`/stay/create?${params.toString()}`);
  };

  const stepTitles = VOLUNTEER_APPLICATION_FUNNEL_STEPS.map((step) => {
    const key =
      VOLUNTEER_APPLICATION_STEP_TITLE_KEYS[
        step as VolunteerApplicationStepId
      ];
    return key ? t(key) : step;
  });

  return (
    <div className="flex flex-col gap-6">
      <Progress
        progress={stepIndex + 1}
        total={VOLUNTEER_APPLICATION_FUNNEL_STEPS.length}
        stepIds={VOLUNTEER_APPLICATION_FUNNEL_STEPS}
        stepTitles={stepTitles}
      />

      <div>
        <p className="text-xs uppercase tracking-wide text-complimentary-light">
          {t('volunteer_application_step_counter', {
            current: stepIndex + 1,
            total: VOLUNTEER_APPLICATION_FUNNEL_STEPS.length,
          })}
        </p>
        <Heading level={2} className="!mt-1 text-xl">
          {t(VOLUNTEER_APPLICATION_STEP_TITLE_KEYS[stepId])}
        </Heading>
      </div>

      {stepId === 'about' && (
        <VolunteerApplicationStepAbout
          about={application.about}
          errors={errors}
          onChange={(patch) => {
            clearError(Object.keys(patch));
            updateApplication({ about: { ...application.about, ...patch } });
          }}
          diet={volunteerInfo.diet || []}
          onDietChange={(diet) =>
            setVolunteerInfo((prev) => ({ ...prev, diet }))
          }
          dietOptions={dietOptions}
        />
      )}

      {stepId === 'experience' && (
        <VolunteerApplicationStepExperience
          experience={application.experience}
          errors={errors}
          onChange={(patch) => {
            clearError(Object.keys(patch));
            updateApplication({
              experience: { ...application.experience, ...patch },
            });
          }}
          skills={volunteerInfo.skills || []}
          onSkillsChange={(skills) =>
            setVolunteerInfo((prev) => ({ ...prev, skills }))
          }
          skillOptions={skillOptions}
          platformName={platformName}
        />
      )}

      {stepId === 'health' && (
        <VolunteerApplicationStepHealth
          health={application.health}
          errors={errors}
          onChange={(patch) => {
            clearError(Object.keys(patch));
            updateApplication({ health: { ...application.health, ...patch } });
          }}
        />
      )}

      {stepId === 'agreement' && (
        <VolunteerApplicationStepAgreement
          agreement={application.agreement}
          errors={errors}
          onChange={(patch) => {
            clearError(['acceptedAt']);
            updateApplication({
              agreement: { ...application.agreement, ...patch },
            });
          }}
          guestRateLabel={guestRateLabel}
        />
      )}

      <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between border-t border-line pt-4">
        <div className="flex flex-col gap-1">
          <p className="text-sm text-complimentary-light">
            {savedAt
              ? t('volunteer_application_draft_saved')
              : t('volunteer_application_draft_pending')}
          </p>
          <button
            type="button"
            onClick={onExit}
            className="text-sm text-accent underline self-start"
          >
            {t('volunteer_application_save_and_exit')}
          </button>
        </div>
        <div className="flex flex-col-reverse sm:flex-row gap-3">
          <Button
            variant="secondary"
            onClick={handleBack}
            isEnabled={!isSubmitting}
            className="sm:w-auto"
          >
            {t('buttons_back')}
          </Button>
          <Button
            onClick={handleNext}
            isLoading={isSubmitting}
            isEnabled={!isSubmitting}
            className="sm:w-auto"
          >
            {isLastStep
              ? t('volunteer_application_continue_to_accommodation')
              : t('token_sale_button_continue')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VolunteerApplicationForm;
