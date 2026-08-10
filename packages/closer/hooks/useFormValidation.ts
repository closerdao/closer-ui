import { useCallback, useEffect, useRef, useState } from 'react';

interface ValidationState {
  title: string;
  folder: string;
  isValid: boolean;
  isSaving: boolean;
  error: string | null;
}

interface UseFormValidationProps {
  initialTitle?: string;
  initialFolder?: string;
  onSave?: (title: string, folder: string) => Promise<void>;
  debounceDelay?: number;
}

export const useFormValidation = ({
  initialTitle = '',
  initialFolder = '',
  onSave,
  debounceDelay = 300,
}: UseFormValidationProps) => {
  const [state, setState] = useState<ValidationState>({
    title: initialTitle,
    folder: initialFolder,
    isValid: false,
    isSaving: false,
    error: null,
  });

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isCurrentlySaving = useRef(false);
  const lastSavedTitle = useRef(initialTitle);
  const lastSavedFolder = useRef(initialFolder);

  // Validate form fields
  const validateForm = useCallback((title: string, folder: string): boolean => {
    const isTitleValid = title.trim().length > 0;
    const isFolderValid = folder.trim().length > 0;
    return isTitleValid && isFolderValid;
  }, []);

  // Update validation state
  useEffect(() => {
    const isValid = validateForm(state.title, state.folder);
    setState((prev) => ({ ...prev, isValid }));
  }, [state.title, state.folder, validateForm]);

  // Debounced save function
  const debouncedSave = useCallback(
    async (title: string, folder: string) => {
      // Clear any existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Cancel any ongoing save operation
      if (isCurrentlySaving.current) {
        isCurrentlySaving.current = false;
      }

      // Set saving state
      setState((prev) => ({ ...prev, isSaving: true, error: null }));

      // Debounce the save operation
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          isCurrentlySaving.current = true;

          if (onSave) {
            await onSave(title, folder);
          }

          // Only update if this is still the current save operation
          if (isCurrentlySaving.current) {
            lastSavedTitle.current = title;
            lastSavedFolder.current = folder;
            setState((prev) => ({
              ...prev,
              isSaving: false,
              error: null,
            }));
          }
        } catch (error) {
          // Only update if this is still the current save operation
          if (isCurrentlySaving.current) {
            setState((prev) => ({
              ...prev,
              isSaving: false,
              error:
                error instanceof Error ? error.message : 'An error occurred',
            }));
          }
        } finally {
          isCurrentlySaving.current = false;
        }
      }, debounceDelay);
    },
    [onSave, debounceDelay],
  );

  // Handle title change
  const handleTitleChange = useCallback(
    (title: string) => {
      setState((prev) => ({ ...prev, title }));

      // Only save if both title and folder are valid
      if (validateForm(title, state.folder)) {
        debouncedSave(title, state.folder);
      }
    },
    [state.folder, validateForm, debouncedSave],
  );

  // Handle folder change
  const handleFolderChange = useCallback(
    (folder: string) => {
      setState((prev) => ({ ...prev, folder }));

      // Only save if both title and folder are valid
      if (validateForm(state.title, folder)) {
        debouncedSave(state.title, folder);
      }
    },
    [state.title, validateForm, debouncedSave],
  );

  // Handle form submission
  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();

      if (!state.isValid) {
        setState((prev) => ({
          ...prev,
          error: 'Необходимо указать название опроса и выбрать папку',
        }));
        return false;
      }

      // Wait for any ongoing save operation to complete
      if (isCurrentlySaving.current) {
        return new Promise<boolean>((resolve) => {
          const checkSaving = () => {
            if (!isCurrentlySaving.current) {
              resolve(true);
            } else {
              setTimeout(checkSaving, 50);
            }
          };
          checkSaving();
        });
      }

      // Perform final save
      try {
        setState((prev) => ({ ...prev, isSaving: true, error: null }));
        if (onSave) {
          await onSave(state.title, state.folder);
        }
        setState((prev) => ({ ...prev, isSaving: false, error: null }));
        return true;
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isSaving: false,
          error: error instanceof Error ? error.message : 'An error occurred',
        }));
        return false;
      }
    },
    [state.title, state.folder, state.isValid, onSave],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      isCurrentlySaving.current = false;
    };
  }, []);

  return {
    title: state.title,
    folder: state.folder,
    isValid: state.isValid,
    isSaving: state.isSaving,
    error: state.error,
    handleTitleChange,
    handleFolderChange,
    handleSubmit,
  };
};
