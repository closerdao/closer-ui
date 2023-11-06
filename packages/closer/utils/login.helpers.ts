export const getQueryParam = (query: any, param: string) => {
  return new URLSearchParams(query as unknown as string).get(param) || '';
};
