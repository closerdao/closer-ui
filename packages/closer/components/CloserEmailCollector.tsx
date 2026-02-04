import React, { useContext, useEffect, useRef, useState } from 'react';

// Added api
import Dropdown from 'closer/components/ui/Select/Dropdown';

import { X } from 'lucide-react';
import { Button, Heading, Input, api } from 'closer';
// Import custom Dropdown
import { REFERRAL_ID_LOCAL_STORAGE_KEY } from 'closer/constants';
import { parseMessageFromError } from 'closer/utils/common';
import { z } from 'zod';

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

const CloserEmailCollector = () => {
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
      const application = { ...validatedData };

      setIsLoading(true);

      console.log('application=', application);
      await api.post('/application', {
        ...application,
        ...(referredBy && { referredBy }),
      });

      setHasSentApplication(true);

      setHasSentApplication(true);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {isOpen && (
        <div className="fixed bg-background/50 inset-0 z-[100] flex items-center justify-center min-h-[600px] overflow-y-auto py-10">
          <div
            className={
              'p-5 rounded-md relative bg-white z-[101] shadow-lg max-w-md w-full'
            }
          >
            <Button
              onClick={() => handleDrawerClose(false)}
              variant="secondary"
              size="small"
              className="my-4 absolute right-4 top-0 w-10 h-10 p-0 z-10"
            >
              <X className="w-4 h-4" />
            </Button>

            <div className={'flex flex-col'}>
              <div className="mx-auto w-full p-4 flex flex-col">
                {hasSentApplication ? (
                  <div className="text-green-600 py-10 text-center text-lg">
                    {
                      // Fallback translation
                      'Thank you! Your information has been submitted.'
                    }
                  </div>
                ) : (
                  <>
                    <Heading level={3} className="mb-4 text-center">
                      Schedule a demo
                    </Heading>
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
                          placeholder="Project/Community Name "
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

                      <Button
                        type="submit"
                        variant="primary"
                        size="medium" // Adjusted size for better fit
                        className="w-full mt-2" // Full width and some margin
                        isLoading={isLoading}
                      >
                        {'Submit'}
                      </Button>
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
