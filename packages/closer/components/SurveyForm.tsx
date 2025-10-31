import { useTranslations } from 'next-intl';
import React from 'react';

import { Button, Input } from 'closer';
import { useFormValidation } from '../hooks/useFormValidation';

interface SurveyFormProps {
  initialTitle?: string;
  initialFolder?: string;
  onSave?: (title: string, folder: string) => Promise<void>;
  onSubmit?: (title: string, folder: string) => Promise<void>;
  submitButtonText?: string;
  titleLabel?: string;
  folderLabel?: string;
  titlePlaceholder?: string;
  folderPlaceholder?: string;
  className?: string;
}

const SurveyForm: React.FC<SurveyFormProps> = ({
  initialTitle = '',
  initialFolder = '',
  onSave,
  onSubmit,
  submitButtonText,
  titleLabel,
  folderLabel,
  titlePlaceholder,
  folderPlaceholder,
  className = '',
}) => {
  const t = useTranslations();

  const {
    title,
    folder,
    isValid,
    isSaving,
    error,
    handleTitleChange,
    handleFolderChange,
    handleSubmit,
  } = useFormValidation({
    initialTitle,
    initialFolder,
    onSave,
    debounceDelay: 300,
  });

  const handleFormSubmit = async (e: React.FormEvent) => {
    const success = await handleSubmit(e);
    if (success && onSubmit) {
      await onSubmit(title, folder);
    }
  };

  const handleTitleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleTitleChange(e.target.value);
  };

  const handleFolderInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFolderChange(e.target.value);
  };

  return (
    <form onSubmit={handleFormSubmit} className={`space-y-6 ${className}`}>
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <Input
          id="survey-title"
          label={titleLabel || t('survey_title') || 'Survey Title'}
          value={title}
          onChange={handleTitleInputChange}
          placeholder={
            titlePlaceholder ||
            t('survey_title_placeholder') ||
            'Enter survey title'
          }
          isRequired={true}
          isDisabled={isSaving}
        />

        <Input
          id="survey-folder"
          label={folderLabel || t('survey_folder') || 'Survey Folder'}
          value={folder}
          onChange={handleFolderInputChange}
          placeholder={
            folderPlaceholder ||
            t('survey_folder_placeholder') ||
            'Select folder'
          }
          isRequired={true}
          isDisabled={isSaving}
        />
      </div>

      {isSaving && (
        <div className="text-sm text-gray-500">
          {t('saving') || 'Saving...'}
        </div>
      )}

      <div className="flex justify-end">
        <Button
          type="submit"
          isEnabled={isValid && !isSaving}
          isLoading={isSaving}
          className="px-6 py-2"
        >
          {submitButtonText || t('save_survey') || 'Save Survey'}
        </Button>
      </div>
    </form>
  );
};

export default SurveyForm;
