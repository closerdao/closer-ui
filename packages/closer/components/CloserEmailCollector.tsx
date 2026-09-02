import React, { useContext, useEffect, useRef, useState } from 'react';

// Added api
import Dropdown from 'closer/components/ui/Select/Dropdown';

import { Button, Heading, Input, api } from 'closer';
// Import custom Dropdown
import { REFERRAL_ID_LOCAL_STORAGE_KEY } from 'closer/constants';
import { parseMessageFromError } from 'closer/utils/common';
import { normalizeLinkAnswer } from 'closer/utils/safeHref';
import { X } from 'lucide-react';
import { z } from 'zod';

import { useAuth } from '../contexts/auth';
import { saveApplicationAnswers } from '../utils/applicationAnswersStorage';
import { isSubscriptionActive } from '../utils/subscriptions.helpers';
import ProfilePhoto from './ProfilePhoto';
import type { PromptGetInTouchContextType } from './PromptGetInTouchContext';
import { PromptGetInTouchContext } from './PromptGetInTouchContext';
import { VillageFunnelCta, VillageFunnelSteps } from './VillageUI/FunnelSteps';

// Form validation schema
const formSchema = z.object({
  fullName: z.string().min(1, { message: 'Full name is required' }),
  email: z
    .string()
    .min(1, { message: 'Email is required' })
    .email({ message: 'Please enter a valid email address' }),
  projectCommunityName: z
    .string()
    .min(1, { message: 'Project/Community name is required' }),
  // Optional, but if given it has to be a usable link: it becomes the
  // village's website when the applicant launches from their answers.
  website: z
    .string()
    .optional()
    .refine((value) => !value?.trim() || normalizeLinkAnswer(value) !== null, {
      message: 'Please enter a valid link',
    }),
  currentStage: z.string().optional(),
  country: z.string().optional(),
  communitySize: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;
type FormErrors = Partial<Record<keyof FormData, string>>;

interface CountryOption {
  value: string;
  label: string;
}

const currentStageOptions = [
  { value: '', label: 'Select current stage' },
  { value: 'planning', label: '🟢 Planning' },
  { value: 'under_construction', label: '🚧 Under Construction' },
  { value: 'operational', label: '🏡 Operational' },
  { value: 'expanding', label: '🌱 Expanding' },
];

const communitySizeOptions = [
  { value: '', label: 'Select community size' },
  { value: '1-15', label: '1–15 people' },
  { value: '15-50', label: '15–50 people' },
  { value: '51-150', label: '51–150 people' },
  { value: '150+', label: '150+ people' },
];

/**
 * Answers land on `application.fields` as `{ name: answer }`, so the value we
 * store has to read well on its own — the dashboard has no access to these
 * option lists. Dropdowns therefore store their label, not their code.
 */
const labelForValue = (options: CountryOption[], value?: string) => {
  if (!value) return '';
  const option = options.find((o) => o.value === value);
  return (option?.label || value).replace(/^[^\p{L}\p{N}]+/u, '');
};

const CloserEmailCollector = () => {
  const { user, isAuthenticated } = useAuth();
  const { isOpen, setIsOpen } = useContext(
    PromptGetInTouchContext,
  ) as PromptGetInTouchContextType;

  const closedByUser = useRef(false);

  // A signed-in member is not asked who they are: the form shows them and
  // signs the application with their account's name and email.
  const signedInUser = isAuthenticated && user ? user : null;

  const [hasSentApplication, setHasSentApplication] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    projectCommunityName: '',
    website: '',
    currentStage: '',
    country: '',
    communitySize: '',
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [countries, setCountries] = useState<CountryOption[]>([
    { value: '', label: 'Select a country' },
  ]);
  const [countryError, setCountryError] = useState<string | null>(null);

  // Same five steps the application modal, /signup, /subscriptions and the
  // village pages draw — see `utils/villageFunnel`.
  const funnelFacts = {
    hasApplication: true,
    isAuthenticated,
    hasSubscription: isSubscriptionActive(user?.subscription),
  };

  useEffect(() => {
    if (!isOpen || !signedInUser) return;
    setFormData((prev) => ({
      ...prev,
      fullName: signedInUser.screenname || prev.fullName,
      email: signedInUser.email || prev.email,
    }));
  }, [isOpen, signedInUser]);

  useEffect(() => {
    const getCountries = async () => {
      try {
        setCountryError(null);
        const res = await api.get('/meta/countries');
        const countryList: CountryOption[] = res.data.results.map(
          (country: any) => ({
            label: country.name,
            value: country.code,
          }),
        );
        setCountries([
          { value: '', label: 'Select a country' },
          ...countryList,
        ]);
      } catch (error) {
        setCountryError(parseMessageFromError(error));
        console.error('Failed to fetch countries:', error);
      }
    };
    if (isOpen) {
      getCountries();
    }
  }, [isOpen]);

  const handleDrawerClose = (isOpenModal: boolean) => {
    setIsOpen(false);
    if (!isOpenModal) {
      closedByUser.current = true;
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement /* Removed HTMLSelectElement here as it's handled separately */>,
  ) => {
    const { id, value } = e.target; // Use id instead of name for Input components
    // const fieldName = e.target.name || id; // name is not on Input, id is used for form data keys
    setFormData((prev) => ({ ...prev, [id]: value }));
    setFormErrors((prev) => ({ ...prev, [id]: undefined }));
  };

  const handleDropdownChange =
    (fieldName: keyof FormData) => (value: string) => {
      setFormData((prev) => ({ ...prev, [fieldName]: value }));
      setFormErrors((prev) => ({ ...prev, [fieldName]: undefined }));
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    setSubmitError(null);

    const validationParseResult = formSchema.safeParse(formData); // Renamed to avoid conflict

    if (!validationParseResult.success) {
      const errors: FormErrors = {};
      validationParseResult.error.errors.forEach((err: z.ZodIssue) => {
        // Added type for err
        if (err.path[0]) {
          errors[err.path[0] as keyof FormData] = err.message;
        }
      });
      setFormErrors(errors);
      return;
    }

    const validatedData = validationParseResult.data;

    setIsLoading(true);
    try {
      const referredBy = localStorage.getItem(REFERRAL_ID_LOCAL_STORAGE_KEY);
      const { fullName, email, projectCommunityName, ...rest } = validatedData;

      // Only `name` and `email` are top-level columns on the application model;
      // everything else is a free-form answer, so it goes on `fields`.
      const fields: Record<string, string> = Object.fromEntries(
        Object.entries({
          projectCommunityName,
          website: normalizeLinkAnswer(rest.website || '') || '',
          currentStage: labelForValue(currentStageOptions, rest.currentStage),
          country: labelForValue(countries, rest.country),
          communitySize: labelForValue(
            communitySizeOptions,
            rest.communitySize,
          ),
        }).filter(([, answer]) => answer),
      );

      const { data } = await api.post('/application', {
        name: fullName,
        email,
        fields,
        ...(referredBy && { referredBy }),
      });

      const createdApplication = data?.results || data;
      saveApplicationAnswers({
        ...(typeof createdApplication?._id === 'string'
          ? { _id: createdApplication._id }
          : {}),
        name: fullName,
        email,
        fields,
      });

      localStorage.setItem('email', email);

      setHasSentApplication(true);
    } catch (error) {
      console.error(error);
      setSubmitError(parseMessageFromError(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {isOpen && (
        <div className="fixed bg-foreground/60 backdrop-blur-sm inset-0 z-[100] flex items-start sm:items-center justify-center overflow-y-auto p-4 sm:p-6">
          <div className="relative bg-neutral-light z-[101] rounded-[26px] shadow-2xl max-w-md w-full my-auto">
            <button
              onClick={() => handleDrawerClose(false)}
              aria-label="Close"
              className="absolute right-4 top-4 w-9 h-9 rounded-full flex items-center justify-center text-foreground/70 hover:bg-accent-light hover:text-accent-text transition-colors z-10"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex flex-col">
              <div className="mx-auto w-full px-7 py-9 flex flex-col">
                {hasSentApplication ? (
                  <div className="py-2">
                    <div className="text-center mb-7">
                      <div className="w-14 h-14 rounded-full bg-accent-light text-accent-text flex items-center justify-center mx-auto mb-5 text-2xl">
                        🌱
                      </div>
                      <Heading level={3} className="mb-2">
                        You&rsquo;re on the list
                      </Heading>
                      <p className="text-sm text-foreground/70">
                        We read every application. Expect a reply within a few
                        days — we&rsquo;ll be in touch at{' '}
                        <b className="text-foreground">{formData.email}</b>.
                      </p>
                    </div>

                    <div className="border-t border-neutral-dark pt-6">
                      <span className="block text-xs font-bold uppercase tracking-[0.22em] text-accent-text mb-2">
                        Don&rsquo;t want to wait?
                      </span>
                      <p className="text-sm text-foreground/70 mb-5">
                        Create your account and subscribe to launch your village
                        directly — no need to wait for our reply.
                      </p>
                      <VillageFunnelSteps
                        facts={funnelFacts}
                        className="mb-6"
                      />

                      <VillageFunnelCta
                        facts={funnelFacts}
                        onNavigate={() => setIsOpen(false)}
                        className="w-full"
                      />
                      <button
                        onClick={() => handleDrawerClose(false)}
                        className="block text-sm underline mt-4 mx-auto text-foreground/70 hover:text-foreground"
                      >
                        I&rsquo;ll wait for your reply
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <span className="block text-xs font-bold uppercase tracking-[0.22em] text-accent-text mb-3">
                      Get started
                    </span>
                    <Heading level={3} className="mb-2 !text-[26px]">
                      Launch your community
                    </Heading>
                    <p className="text-sm text-foreground/70 mb-6">
                      Tell us about your project and we&rsquo;ll walk you
                      through the platform — and the Village Fund if you
                      qualify.
                    </p>
                    <form
                      onSubmit={handleSubmit}
                      noValidate
                      className="flex flex-col gap-4"
                    >
                      {signedInUser ? (
                        <div
                          className="flex items-center gap-3 rounded-xl border border-accent-medium bg-accent-light/60 px-4 py-3"
                          data-testid="signed-in-applicant"
                        >
                          <ProfilePhoto
                            user={signedInUser}
                            size="10"
                            stack={false}
                          />
                          <div className="min-w-0 flex-1">
                            <span className="block text-[11px] font-bold uppercase tracking-[0.18em] text-accent-text">
                              Applying as
                            </span>
                            <span className="block text-sm font-semibold text-foreground truncate">
                              {signedInUser.screenname}
                            </span>
                            <span className="block text-xs text-foreground/70 truncate">
                              {signedInUser.email}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div>
                            <Input
                              id="fullName"
                              type="text"
                              value={formData.fullName}
                              onChange={handleInputChange}
                              placeholder={'Full Name'}
                              isRequired
                              autoFocus
                            />
                            {formErrors.fullName && (
                              <div className="text-red-600 text-sm mt-1">
                                {formErrors.fullName}
                              </div>
                            )}
                          </div>

                          <div>
                            <Input
                              id="email"
                              type="text"
                              value={formData.email}
                              onChange={handleInputChange}
                              placeholder={'Email Address'}
                              isRequired
                            />
                            {formErrors.email && (
                              <div className="text-red-600 text-sm mt-1">
                                {formErrors.email}
                              </div>
                            )}
                          </div>
                        </>
                      )}

                      <div>
                        <Input
                          id="projectCommunityName"
                          type="text"
                          value={formData.projectCommunityName}
                          onChange={handleInputChange}
                          placeholder="Project/Community Name"
                          isRequired
                          autoFocus={Boolean(signedInUser)}
                        />
                        {formErrors.projectCommunityName && (
                          <div className="text-red-600 text-sm mt-1">
                            {formErrors.projectCommunityName}
                          </div>
                        )}
                      </div>

                      <div>
                        <Input
                          id="website"
                          type="url"
                          value={formData.website}
                          onChange={handleInputChange}
                          placeholder="Link to your website or deck"
                        />
                        {formErrors.website && (
                          <div className="text-red-600 text-sm mt-1">
                            {formErrors.website}
                          </div>
                        )}
                      </div>

                      <div>
                        <Dropdown
                          id="currentStage"
                          label={'Current Stage'}
                          value={formData.currentStage}
                          options={currentStageOptions}
                          onChange={handleDropdownChange('currentStage')}
                          placeholder="Current Stage"
                          className="h-10" // Example class, adjust as needed
                        />
                        {formErrors.currentStage && (
                          <div className="text-red-600 text-sm mt-1">
                            {formErrors.currentStage}
                          </div>
                        )}
                      </div>

                      <div>
                        <Dropdown
                          id="country"
                          label={'Country'}
                          value={formData.country}
                          options={countries}
                          onChange={handleDropdownChange('country')}
                          placeholder="Select a country"
                          className="h-10" // Example class, adjust as needed
                        />
                        {formErrors.country && (
                          <div className="text-red-600 text-sm mt-1">
                            {formErrors.country}
                          </div>
                        )}
                        {countryError && (
                          <div className="text-red-600 text-sm mt-1">
                            {countryError}
                          </div>
                        )}
                      </div>

                      <div>
                        <Dropdown
                          id="communitySize"
                          label={'Community Size'}
                          value={formData.communitySize}
                          options={communitySizeOptions}
                          onChange={handleDropdownChange('communitySize')}
                          placeholder="Select community size"
                          className="h-10" // Example class, adjust as needed
                        />
                        {formErrors.communitySize && (
                          <div className="text-red-600 text-sm mt-1">
                            {formErrors.communitySize}
                          </div>
                        )}
                      </div>

                      {submitError && (
                        <div
                          className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3"
                          role="alert"
                        >
                          {submitError}
                        </div>
                      )}

                      <Button
                        type="submit"
                        variant="primary"
                        size="medium"
                        className="w-full mt-2 rounded-xl border-transparent font-semibold normal-case tracking-normal shadow-[0_6px_20px_theme(colors.accent/35%)]"
                        isLoading={isLoading}
                      >
                        Launch your community
                      </Button>
                      <p className="text-xs text-foreground/70 text-center">
                        No credit card. We&rsquo;ll reply personally.
                      </p>
                    </form>
                  </>
                )}
                {/* Removed redundant close button from here as one is at the top */}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CloserEmailCollector;
