export type Lesson = {
  previewVideo: string;
  fullVideo: string;
  title: string;
  category: string;
  tags: string[];
  summary: string;
  photo: string;
  description: string;
  paid: boolean;

  slug: string;
  visibleBy: string[];
  fields: Field[];
  createdBy: string;
  updated: string;
  created: string;
  attributes: string[];
  managedBy: string[];
  _id: string;
};

export type Field = {
  name: string;
  fieldType: string;
  _id: string;
  options: string[];
};
