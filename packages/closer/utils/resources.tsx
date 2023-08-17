import { FormattedFaqs } from '../types/resources';

export const prepareFaqsData = (inputData: any[]): FormattedFaqs[] => {
  const tmpData: any[] = [];
  const preparedData: [string, { q: string; a: string }[]][] = [];

  inputData.forEach((item) => {
    const category = item.c[0]?.v;
    const question = item.c[1]?.v;
    const answer = item.c[2]?.v;

    if (question && answer) {
      if (category) {
        tmpData.push([category, { q: question, a: answer }]);
      } else {
        tmpData.push([
          tmpData[tmpData.length - 1][0],
          { q: question, a: answer },
        ]);
      }
    }
  });
  let currentCategory = '';
  let categoryGroup: { q: string; a: string }[] | any[] = [];

  for (const [category, item] of tmpData) {
    if (category !== currentCategory) {
      if (categoryGroup) {
        preparedData.push([currentCategory, categoryGroup]);
      }
      currentCategory = category;
      categoryGroup = [item];
    } else {
      categoryGroup.push(item);
    }
  }

  if (categoryGroup) {
    preparedData.push([currentCategory, categoryGroup]);
  }

  return preparedData.slice(1);
};
