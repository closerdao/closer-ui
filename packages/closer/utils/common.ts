export const parseMessageFromError = (err: unknown) => {
  if (typeof err === 'string') {
    return err;
  }
  if (err instanceof Error) {
    return err.message;
  }
  return 'Unknown error';
};
