import { useTranslations } from 'next-intl';
import React, { useState } from 'react';

import { api } from 'closer';
import SurveyForm from './SurveyForm';

interface SurveyFormExampleProps {
  surveyId?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

const SurveyFormExample: React.FC<SurveyFormExampleProps> = ({
  surveyId,
  onSuccess,
  onError,
}) => {
  const t = useTranslations();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle auto-save during typing
  const handleAutoSave = async (title: string, folder: string) => {
    try {
      if (surveyId) {
        // Update existing survey
        await api.patch(`/surveys/${surveyId}`, {
          title,
          folder,
        });
      } else {
        // Create new survey
        await api.post('/surveys', {
          title,
          folder,
        });
      }
    } catch (error) {
      console.error('Auto-save failed:', error);
      // Don't show error toast for auto-save failures
      // Only show for explicit form submissions
    }
  };

  // Handle form submission
  const handleSubmit = async (title: string, folder: string) => {
    setIsSubmitting(true);
    try {
      if (surveyId) {
        // Update existing survey
        await api.patch(`/surveys/${surveyId}`, {
          title,
          folder,
        });
      } else {
        // Create new survey
        await api.post('/surveys', {
          title,
          folder,
        });
      }

      onSuccess?.();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'An error occurred';
      onError?.(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">
        {surveyId
          ? t('edit_survey') || 'Edit Survey'
          : t('create_survey') || 'Create Survey'}
      </h2>

      <SurveyForm
        onSave={handleAutoSave}
        onSubmit={handleSubmit}
        submitButtonText={
          isSubmitting
            ? t('saving') || 'Saving...'
            : surveyId
              ? t('update_survey') || 'Update Survey'
              : t('create_survey') || 'Create Survey'
        }
        titleLabel={t('survey_title') || 'Survey Title'}
        folderLabel={t('survey_folder') || 'Survey Folder'}
        titlePlaceholder={t('survey_title_placeholder') || 'Enter survey title'}
        folderPlaceholder={t('survey_folder_placeholder') || 'Select folder'}
      />
    </div>
  );
};

export default SurveyFormExample;
