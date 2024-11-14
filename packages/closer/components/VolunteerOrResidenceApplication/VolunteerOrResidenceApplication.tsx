import { useRouter } from 'next/router';

import { ChangeEvent, useState } from 'react';

import { Button, Input } from '../../components/ui';
import Checkbox from '../../components/ui/Checkbox';
import HeadingRow from '../../components/ui/HeadingRow';

import { useTranslations } from 'next-intl';

import { VolunteerConfig } from '../../types';

const DIET_OPTIONS = [
  'Vegan',
  'Vegetarian',
  'Non-Vegetarian',
  'Gluten-free',
  'Diary-free',
];

interface Props {
  volunteerConfig: VolunteerConfig;
  type: 'volunteer' | 'residence';
}
const VolunteerOrResidenceApplication = ({ volunteerConfig, type }: Props) => {
  const t = useTranslations();

  const router = useRouter();

  const [volunteerData, setVolunteerData] = useState<
    Record<string, string | string[]>
  >({});
  const [skillsInputValue, setSkillsInputValue] = useState('');
  const [dietInputValue, setDietInputValue] = useState('');

  const updateVolunteerData = (key: string, value: any, remove = false) => {
    if (key === 'suggestions') {
      setVolunteerData({
        ...volunteerData,
        [key]: value,
      });
    } else {
      setVolunteerData({
        ...volunteerData,
        [key]: remove
          ? ((volunteerData[key] as string[]) || []).filter(
              (item: string) => item !== value,
            )
          : [...(volunteerData[key] || []), value],
      });
    }
  };

  const handleNext = async () => {
    const params = new URLSearchParams({
      skills: Array.isArray(volunteerData.skills)
        ? volunteerData.skills.join(',')
        : volunteerData.skills,
      diet: Array.isArray(volunteerData.diet)
        ? volunteerData.diet.join(',')
        : volunteerData.diet,
      suggestions: volunteerData.suggestions as string,
      bookingType: type,
    }).toString();

    router.push(`/bookings/create/dates?${params}`);
  };

  return (
    <main className="flex flex-col gap-12 py-12">
      <section>
        <HeadingRow>{t('projects_skills_and_qualifications_title')}</HeadingRow>
        <div className="flex flex-col  gap-6 mt-3 ">
          <p> {t('projects_skills_and_qualifications_intro')}</p>

          <div className="flex flex-col  w-full">
            {volunteerConfig?.skills &&
              volunteerConfig?.skills &&
              volunteerConfig?.skills.split(',').map((skill) => (
                <div key={skill}>
                  <Checkbox
                    id={skill}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                      updateVolunteerData('skills', skill, !e.target.checked);
                    }}
                    className="mb-4"
                  >
                    {skill}
                  </Checkbox>
                </div>
              ))}
          </div>

          <div className="flex flex-col  w-full">
            <Input
              label={t('projects_other_label')}
              type="text"
              value={skillsInputValue}
              onChange={(e) => {
                const newValue = e.target.value;
                setSkillsInputValue(newValue);
                setVolunteerData((prevData) => ({
                  ...prevData,
                  skills: [
                    ...((prevData.skills as string[]) || []).filter(
                      (skill) => skill !== skillsInputValue,
                    ),
                    newValue,
                  ].filter(Boolean),
                }));
              }}
            />
          </div>
        </div>
      </section>

      <section>
        <HeadingRow>{t('projects_suggestions_title')}</HeadingRow>
        <div className="flex flex-col  gap-6 mt-3 ">
          <p> {t('projects_suggestions_intro')}</p>

          <div className="flex flex-col  w-full">
            <Input
              label={t('projects_suggestions_label')}
              onChange={(e) => {
                updateVolunteerData('suggestions', e.target.value);
              }}
              type="text"
            />
          </div>
        </div>
      </section>

      <section>
        <HeadingRow>{t('projects_food_title')}</HeadingRow>
        <div className="flex flex-col  gap-6 mt-3 ">
          <p> {t('projects_food_intro')}</p>

          <div>
            {DIET_OPTIONS.map((option) => (
              <Checkbox
                key={option}
                id={option}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  updateVolunteerData('diet', option, !e.target.checked);
                }}
              >
                {option}
              </Checkbox>
            ))}
          </div>

          <div className="flex flex-col  w-full">
            <Input
              label={t('projects_other_label')}
              type="text"
              value={dietInputValue}
              onChange={(e) => {
                const newValue = e.target.value;
                setDietInputValue(newValue);
                setVolunteerData((prevData) => ({
                  ...prevData,
                  diet: [
                    ...((prevData.diet as string[]) || []).filter(
                      (diet) => diet !== dietInputValue,
                    ),
                    newValue,
                  ].filter(Boolean),
                }));
              }}
            />
          </div>
        </div>
      </section>
      <Button className="booking-btn" onClick={handleNext}>
        {t('token_sale_button_continue')}
      </Button>
    </main>
  );
};

export default VolunteerOrResidenceApplication;
