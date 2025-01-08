import { CloserCurrencies } from './currency';

import { Price } from './currency';

export type Lesson = {
  previewVideo: string;
  fullVideo: string; // deprecate
  title: string;
  category: string;
  tags: string[];
  summary: string;
  photo: string;
  description: string;
  paid: boolean; // deprecate
  slug: string;
  visibleBy: string[];
  fields: Field[];
  createdBy: string;
  updated: string;
  created: string;
  attributes: string[];
  managedBy: string[];
  _id: string;

  price?: Price<CloserCurrencies>;
  variant?:
    | 'live-lesson'
    | 'live-course'
    | 'prerecorded-lesson'
  | 'prerecorded-course';
  access?:
  | 'subscription-any'
  | 'subscription-tier-1'
  | 'subscription-tier-2'
  | 'single-payment'
  | 'free';
  modules?: {
    title: string;
    description: string;
    lessons: {
      title: string;
      fullText: string;
      videoUrl: string;
      isFree: boolean;
      _id: string;
    }[];
    _id: string;
  }[];
};

export type Field = {
  name: string;
  fieldType: string;
  _id: string;
  options: string[];
};
