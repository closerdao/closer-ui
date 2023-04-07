import { AxiosError } from 'axios';

export const parseMessageFromError = (err: unknown) => {
  if (typeof err === 'string') {
    return err;
  }
  if ((err as AxiosError).response) {
    return (err as AxiosError).response?.data?.error;
  }
  if (err instanceof Error) {
    return err.message;
  }
  return 'Unknown error';
};
