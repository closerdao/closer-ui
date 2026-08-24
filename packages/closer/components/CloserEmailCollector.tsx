import { useRouter } from 'next/router';

import React, { useContext, useEffect, useRef, useState } from 'react';

// Added api
import Dropdown from 'closer/components/ui/Select/Dropdown';

import { Button, Heading, Input, api } from 'closer';
// Import custom Dropdown
import { REFERRAL_ID_LOCAL_STORAGE_KEY } from 'closer/constants';
import { parseMessageFromError } from 'closer/utils/common';
import { Check, X } from 'lucide-react';
import { z } from 'zod';

import { useAuth } from '../contexts/auth';
import type { PromptGetInTouchContextType } from './PromptGetInTouchContext';
import { PromptGetInTouchContext } from './PromptGetInTouchContext';

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

const LaunchStep = ({
  status,
  label,
  hint,
}: {
  status: 'done' | 'active' | 'pending';
  label: string;
  hint?: string;
}) => (
  <li
    className={`flex gap-3 items-start ${
      status === 'pending' ? 'opacity-50' : ''
    }`}
  >
    <span
      className={`w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5 ${
        status === 'done'
          ? 'bg-[#0FA968] text-white'
          : 'bg-[#E2FAEE] text-[#0B7A4C]'
      }`}
    >
      {status === 'done' ? <Check className="w-3.5 h-3.5" /> : '●'}
    </span>
    <span className="flex flex-col text-left">
      <span className="text-sm font-medium text-[#10201A]">{label}</span>
      {hint && <span className="text-xs text-[#5C6E64] mt-0.5">{hint}</span>}
    </span>
  </li>
);

const CloserEmailCollector = () => {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { isOpen, setIsOpen } = useContext(
    PromptGetInTouchContext,
  ) as PromptGetInTouchContextType;

  const closedByUser = useRef(false);

  const [hasSentApplication, setHasSentApplication] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    projectCommunityName: '',
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
      const fields: Record<string, string> = {
        projectCommunityName,
        currentStage: labelForValue(currentStageOptions, rest.currentStage),
        country: labelForValue(countries, rest.country),
        communitySize: labelForValue(communitySizeOptions, rest.communitySize),
      };

      await api.post('/application', {
        name: fullName,
        email,
        fields: Object.fromEntries(
          Object.entries(fields).filter(([, answer]) => answer),
        ),
        ...(referredBy && { referredBy }),
      });

      // SignupForm pre-fills from this key, so the "launch now" path starts
      // with the email the applicant just typed.
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
        <div className="fixed bg-[#0E1E16]/60 backdrop-blur-sm inset-0 z-[100] flex items-start sm:items-center justify-center overflow-y-auto p-4 sm:p-6">
          <div className="relative bg-[#FCFDFB] z-[101] rounded-[26px] shadow-2xl max-w-md w-full my-auto">
            <button
              onClick={() => handleDrawerClose(false)}
              aria-label="Close"
              className="absolute right-4 top-4 w-9 h-9 rounded-full flex items-center justify-center text-[#5C6E64] hover:bg-[#E2FAEE] hover:text-[#0B7A4C] transition-colors z-10"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex flex-col">
              <div className="mx-auto w-full px-7 py-9 flex flex-col">
                {hasSentApplication ? (
                  <div className="py-2">
                    <div className="text-center mb-7">
                      <div className="w-14 h-14 rounded-full bg-[#E2FAEE] text-[#0B7A4C] flex items-center justify-center mx-auto mb-5 text-2xl">
                        🌱
                      </div>
                      <Heading level={3} className="mb-2">
                        You&rsquo;re on the list
                      </Heading>
                      <p className="text-sm text-[#5C6E64]">
                        We read every application. Expect a reply within a few
                        days — we&rsquo;ll be in touch at{' '}
                        <b className="text-[#10201A]">{formData.email}</b>.
                      </p>
                    </div>

                    <div className="border-t border-[#E4EFE8] pt-6">
                      <span className="block text-xs font-bold uppercase tracking-[0.22em] text-[#0FA968] mb-2">
                        Don&rsquo;t want to wait?
                      </span>
                      <p className="text-sm text-[#5C6E64] mb-5">
                        Create your account and subscribe to launch your
                        village directly — no need to wait for our reply.
                      </p>
                      <ol className="flex flex-col gap-4 mb-6">
                        <LaunchStep status="done" label="Application received" />
                        <LaunchStep
                          status={isAuthenticated ? 'done' : 'active'}
                          label={
                            isAuthenticated
                              ? 'You’re signed in'
                              : 'Create your account'
                          }
                          hint={
                            isAuthenticated
                              ? undefined
                              : 'Your email is already filled in — it takes a minute.'
                          }
                        />
                        <LaunchStep
                          status={isAuthenticated ? 'active' : 'pending'}
                          label="Subscribe & launch your village"
                          hint="Pick a plan and your platform goes live."
                        />
                      </ol>

                      <Button
                        variant="primary"
                        size="medium"
                        className="w-full rounded-xl border-transparent font-semibold normal-case tracking-normal shadow-[0_6px_20px_rgba(62,224,143,0.35)]"
                        onClick={() => {
                          setIsOpen(false);
                          router.push(
                            isAuthenticated
                              ? '/subscriptions'
                              : `/signup?back=${encodeURIComponent(
                                  '/subscriptions',
                                )}`,
                          );
                        }}
                      >
                        {isAuthenticated
                          ? 'Choose a plan'
                          : 'Create my account'}
                      </Button>
                      <button
                        onClick={() => handleDrawerClose(false)}
                        className="block text-sm underline mt-4 mx-auto text-[#5C6E64] hover:text-[#10201A]"
                      >
                        I&rsquo;ll wait for your reply
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <span className="block text-xs font-bold uppercase tracking-[0.22em] text-[#0FA968] mb-3">
                      Get started
                    </span>
                    <Heading level={3} className="mb-2 !text-[26px]">
                      Launch your community
                    </Heading>
                    <p className="text-sm text-[#5C6E64] mb-6">
                      Tell us about your project and we&rsquo;ll walk you
                      through the platform — and the Village Fund if you
                      qualify.
                    </p>
                    <form
                      onSubmit={handleSubmit}
                      className="flex flex-col gap-4"
                    >
                      <div>
                        <Input
                          id="fullName"
                          // name="fullName" // Removed name prop
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
                          // name="email" // Removed name prop
                          type="text" // Changed type to "text"
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

                      <div>
                        <Input
                          id="projectCommunityName"
                          // name="projectCommunityName" // Removed name prop
                          type="text"
                          value={formData.projectCommunityName}
                          onChange={handleInputChange}
                          placeholder="Project/Community Name"
                          isRequired
                        />
                        {formErrors.projectCommunityName && (
                          <div className="text-red-600 text-sm mt-1">
                            {formErrors.projectCommunityName}
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
                        className="w-full mt-2 rounded-xl border-transparent font-semibold normal-case tracking-normal shadow-[0_6px_20px_rgba(62,224,143,0.35)]"
                        isLoading={isLoading}
                      >
                        Launch your community
                      </Button>
                      <p className="text-xs text-[#5C6E64] text-center">
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
