import { FormattedFaqs, QuestionAndAnswer } from '../types/resources';

const getLinks = (links: string) => {
  if (!links) {
    return null;
  }
  if (links.includes(',')) {
    return links.split(',');
  } else {
    return [links];
  }
};

export const prepareFaqsData = (inputData: any[]): FormattedFaqs[] => {
  const tmpData: any[] = [];
  const preparedData: [string, QuestionAndAnswer[]][] = [];

  inputData.forEach((item) => {
    const category = item.c[0]?.v;
    const question = item.c[1]?.v;
    const answer = item.c[2]?.v;
    const linkTexts = getLinks(item.c[3]?.v);
    const linkUrls = getLinks(item.c[4]?.v);

    if (question && answer) {
      if (category) {
        tmpData.push([
          category,
          { q: question, a: answer, linkTexts, linkUrls },
        ]);
      } else {
        tmpData.push([
          tmpData[tmpData.length - 1][0],
          { q: question, a: answer, linkTexts, linkUrls },
        ]);
      }
    }
  });
  let currentCategory = '';
  let categoryGroup: QuestionAndAnswer[] | any[] = [];

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
