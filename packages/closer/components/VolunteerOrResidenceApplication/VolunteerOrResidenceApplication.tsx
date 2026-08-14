import { useRouter } from 'next/router';

import { ChangeEvent, useState } from 'react';

import { Button, Input } from '../../components/ui';
import Checkbox from '../../components/ui/Checkbox';
import HeadingRow from '../../components/ui/HeadingRow';

import { useTranslations } from 'next-intl';

import { useAuth } from '../../contexts/auth';
import { usePlatform } from '../../contexts/platform';
import { Project, VolunteerConfig } from '../../types';
import {
  emptyVolunteerApplication,
  readVolunteerApplicationDraft,
  writeVolunteerApplicationDraft,
} from '../../utils/volunteerApplicationDraft';
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
    useState<Record<string, string | string[] | undefined>>(
      initialVolunteerData,
    );
  const [loading, setLoading] = useState(false);

  const updateVolunteerData = (key: string, value: any, remove = false) => {
    if (key === 'suggestions') {
      setVolunteerData((prev) => ({
        ...prev,
        [key]: value,
      }));
    } else {
      setVolunteerData((prev) => ({
        ...prev,
        [key]: remove
          ? ((prev[key] as string[]) || []).filter(
              (item: string) => item !== value,
            )
          : [...(prev[key] || []), value],
      }));
    }
  };

  const handleNext = async () => {
    const projectIds = Array.isArray(volunteerData.projectId)
      ? volunteerData.projectId
      : volunteerData.projectId
        ? [volunteerData.projectId]
        : [];

    const params = new URLSearchParams({
      bookingType: type,
      ...(projectIds.length > 0 && { projectId: projectIds.join(',') }),
    } as Record<string, string>);

    // Skills, diet and suggestions go into the application draft rather than the
    // URL: the next step reads that draft, and it is where the rest of the
    // answers already live. An application in progress keeps its own answers.
    const draft = readVolunteerApplicationDraft(user?._id, type);
    writeVolunteerApplicationDraft(user?._id, type, {
      step: draft?.step || 'about',
      volunteerInfo: {
        ...draft?.volunteerInfo,
        bookingType: type,
        skills: (volunteerData.skills as string[]) || [],
        diet: (volunteerData.diet as string[]) || [],
        suggestions: (volunteerData.suggestions as string) || '',
        projectId: projectIds,
        application:
          draft?.volunteerInfo.application || emptyVolunteerApplication(),
      },
    });

    const updatedUser = {
      ...user,
      preferences: {
        skills: Array.isArray(volunteerData.skills)
          ? [...new Set(volunteerData.skills)]
          : [],
        diet: Array.isArray(volunteerData.diet)
          ? [...new Set(volunteerData.diet)]
          : [],
      },
    };

    try {
      setLoading(true);
      await platform.user.patch(user?._id, updatedUser);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      // The whole application is filled in before an accommodation is picked,
      // same as the volunteer flow — /stay/create comes after the last step.
      router.push(`/volunteer/apply?${params}`);
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
              {projects?.map((project) => (
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
