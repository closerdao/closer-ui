import { useRouter } from 'next/router';

import { ChangeEvent, useState } from 'react';

import { Button, Input } from '../../components/ui';
import Checkbox from '../../components/ui/Checkbox';
import HeadingRow from '../../components/ui/HeadingRow';

import { useTranslations } from 'next-intl';

import { useAuth } from '../../contexts/auth';
import { usePlatform } from '../../contexts/platform';
import { Project, VolunteerConfig } from '../../types';
import MultiSelect from '../ui/Select/MultiSelect';

interface Props {
  volunteerConfig: VolunteerConfig;
  type: 'volunteer' | 'residence';
  projects?: Project[];
}

const normalizeProjectId = (
  projectId: string | string[] | undefined,
): string[] => {
  if (!projectId) return [];
  return Array.isArray(projectId) ? projectId : [projectId];
};

const VolunteerOrResidenceApplication = ({
  volunteerConfig,
  type,
  projects,
}: Props) => {
  const t = useTranslations();
  const router = useRouter();
  const { user } = useAuth();
  const { platform } = usePlatform() as any;

  const initialDiet = Array.isArray(user?.preferences?.diet)
    ? user?.preferences?.diet
    : user?.preferences?.diet?.split(',') || [];
  const initialSkills = user?.preferences?.skills || [];

  const initialVolunteerData = {
    skills: initialSkills,
    diet: initialDiet,
    projectId: normalizeProjectId(router.query.projectId),
    // suggestions: '',
  };
  const [volunteerData, setVolunteerData] =
    useState<Record<string, string | string[] | undefined>>(initialVolunteerData);
  const [loading, setLoading] = useState(false);

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
      skills: (Array.isArray(volunteerData.skills)
        ? volunteerData.skills.join(',')
        : volunteerData.skills) || '',
      diet: (Array.isArray(volunteerData.diet)
        ? volunteerData.diet.join(',')
        : volunteerData.diet) || '',
      suggestions: volunteerData.suggestions as string || '',
      bookingType: type,
      ...(volunteerData?.projectId && volunteerData.projectId.length > 0 && {
        projectId: Array.isArray(volunteerData.projectId)
          ? volunteerData.projectId.join(',')
          : volunteerData.projectId,
      }),
    } as Record<string, string>);

    const updatedUser = {
      ...user,
      preferences: {
        skills: Array.isArray(volunteerData.skills) ? [...new Set(volunteerData.skills)] : [],
        diet: Array.isArray(volunteerData.diet) ? [...new Set(volunteerData.diet)] : [],
      },
    };

    try {
      setLoading(true);
      await platform.user.patch(user?._id, updatedUser);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      router.push(`/bookings/create/dates?${params}`);
    }
  };

  return (
    <main className="flex flex-col gap-12 py-12">
      <section>
        <HeadingRow>{t('projects_skills_and_qualifications_title')}</HeadingRow>
        <div className="flex flex-col  gap-6 mt-3 ">
          <p> {t('projects_skills_and_qualifications_intro')}</p>

          <MultiSelect
            values={volunteerData.skills as string[]}
            onChange={(newSkills: string[]) => {
              setVolunteerData((prevData) => ({
                ...prevData,
                skills: newSkills.filter(Boolean),
              }));
            }}
            options={volunteerConfig?.skills?.split(',') || []}
            placeholder="Pick or create yours"
          />
        </div>
      </section>

      {type === 'residence' && (
        <section>
          <HeadingRow>{t('projects_build_title')}</HeadingRow>
          <div className="flex flex-col  gap-6 mt-3 ">
            <p> {t('projects_build_intro')}</p>

            <div>
              {projects &&
                projects.map((project) => (
                  <Checkbox
                    key={project._id}
                    id={project.name}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                      updateVolunteerData(
                        'projectId',
                        project._id,
                        !e.target.checked,
                      );
                    }}
                    isChecked={volunteerData.projectId?.includes(project._id)}
                  >
                    {project.name}
                  </Checkbox>
                ))}
            </div>
          </div>
        </section>
      )}

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

          <MultiSelect
            values={volunteerData.diet as string[]}
            onChange={(newDiet: string[]) => {
              setVolunteerData((prevData) => ({
                ...prevData,
                diet: newDiet,
              }));
            }}
            options={volunteerConfig?.diet?.split(',') || []}
            placeholder="Pick or create yours"
          />
        </div>
      </section>
      <Button className="booking-btn" onClick={handleNext} isEnabled={!loading}>
        {t('token_sale_button_continue')}
      </Button>
    </main>
  );
};

export default VolunteerOrResidenceApplication;
