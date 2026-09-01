import { SettingsLayout } from '../../components/Settings';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select/Dropdown';
import MultiSelect from '../../components/ui/Select/MultiSelect';

import { Info, Star } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { SHARED_ACCOMMODATION_PREFERENCES } from '../../constants/shared.constants';
import { useConfig } from '../../hooks/useConfig';
import { useSettingsUser } from '../../hooks/useSettingsUser';
import { VolunteerConfig } from '../../types';
import { getCachedConfig } from '../../utils/cachedConfig.helpers';
import { getDietOptions, toSingleDiet } from '../../utils/dietOptions';
import PageNotFound from '../not-found';

const PreferencesSettingsPage = () => {
  const volunteerConfig = getCachedConfig(
    'volunteering',
  ) as VolunteerConfig | null;
  const t = useTranslations() as (key: string) => string;
  const { APP_NAME } = useConfig();

  const skillsOptions = volunteerConfig?.skills?.split(',') || [];
  const dietOptions = getDietOptions();

  const {
    user,
    isAuthenticated,
    error,
    hasSaved,
    setHasSaved,
    saveUserData,
  } = useSettingsUser();

  if (!isAuthenticated || !user) {
    return (
      <PageNotFound
        back="/settings/preferences"
        error="Please log in to see this page."
      />
    );
  }

  return (
    <SettingsLayout
      activeTab="preferences"
      pageTitle={`${user.screenname} | ${t('settings_page_title')}`}
      error={error}
    >
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Star className="w-5 h-5 text-gray-700" />
          <h3 className="text-lg font-medium text-gray-900">
            {t('settings_recommended_preferences')}
          </h3>
        </div>

        <Select
          label={t('settings_dietary_preferences')}
          value={toSingleDiet(user?.preferences?.diet)}
          options={dietOptions}
          className="mb-4"
          onChange={saveUserData('diet')}
        />

        {APP_NAME && APP_NAME?.toLowerCase() !== 'moos' && (
          <Select
            label={t('settings_shared_accommodation_preference')}
            value={user?.preferences?.sharedAccomodation}
            options={SHARED_ACCOMMODATION_PREFERENCES}
            className="mb-4"
            onChange={saveUserData('sharedAccomodation')}
            isRequired
          />
        )}

        <Input
          label={t('settings_superpower')}
          placeholder={t('settings_superpower_placeholder')}
          value={user?.preferences?.superpower}
          onChange={saveUserData('superpower') as any}
          isInstantSave={true}
          hasSaved={hasSaved}
          setHasSaved={setHasSaved}
          className="mb-4"
        />

        <MultiSelect
          label={t('settings_skills')}
          values={user?.preferences?.skills}
          onChange={saveUserData('skills')}
          options={skillsOptions}
          placeholder={t('settings_pick_or_create_yours')}
          className="mb-4"
        />
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Info className="w-5 h-5 text-gray-700" />
          <h3 className="text-lg font-medium text-gray-900">
            {t('settings_optional_information')}
          </h3>
        </div>

        <Input
          label={t('settings_dream')}
          placeholder={t('settings_dream_placeholder')}
          value={user?.preferences?.dream}
          onChange={saveUserData('dream') as any}
          isInstantSave={true}
          hasSaved={hasSaved}
          setHasSaved={setHasSaved}
          className="mb-4"
        />

        <Input
          label={t('settings_needs')}
          placeholder=""
          value={user?.preferences?.needs}
          onChange={saveUserData('needs') as any}
          isInstantSave={true}
          hasSaved={hasSaved}
          setHasSaved={setHasSaved}
          className="mb-4"
        />

        <Input
          label={t('settings_more_info')}
          placeholder=""
          value={user?.preferences?.moreInfo}
          onChange={saveUserData('moreInfo') as any}
          isInstantSave={true}
          hasSaved={hasSaved}
          setHasSaved={setHasSaved}
        />
      </div>
    </SettingsLayout>
  );
};

export default PreferencesSettingsPage;
