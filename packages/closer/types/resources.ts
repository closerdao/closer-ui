export interface QuestionAndAnswer {
  q: string;
  a: string;
  linkTexts: string[] | null;
  linkUrls: string[] | null;
}

export type FormattedFaqs = [string, QuestionAndAnswer[]];
