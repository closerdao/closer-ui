// import { AxiosError } from 'axios';

export const parseMessageFromError = (err: any ) => {
  if (typeof err === 'string') {
    return err;
  }
  if (err?.response?.data?.error) {
    return err.response?.data?.error;
  }
  if (err instanceof Error) {
    return err.message;
  }

  if (typeof err === 'object' && err !== null && 'message' in err) {
    return err.message;
  }
  return 'Unknown error';
};
