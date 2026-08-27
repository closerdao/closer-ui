import { isAxiosError } from 'axios';

export type ApiErrorDetails = {
  message: string;
  code?: string;
  explorerUrl?: string;
};

export const getApiErrorDetails = (
  error: unknown,
  fallbackMessage: string,
): ApiErrorDetails => {
  if (isAxiosError(error)) {
    const data = error.response?.data;
    if (data && typeof data === 'object') {
      return {
        message: typeof data.error === 'string' ? data.error : fallbackMessage,
        code: typeof data.code === 'string' ? data.code : undefined,
        explorerUrl:
          typeof data.explorerUrl === 'string' ? data.explorerUrl : undefined,
      };
    }
  }
  return {
    message: error instanceof Error ? error.message : fallbackMessage,
  };
};
