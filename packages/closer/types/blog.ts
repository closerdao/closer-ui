export type Article = {
  title: string;
  slug: string;
  category?: string;
  tags?: string[];
  html?: string;
  editorState?: string;
  summary?: string;
  photo?: string;
  photoUrl?: string;
  created: string;
  createdBy: string;
  updated: string;
  _id: string;
};

export type Author = {
  screenname: string;
  photo: string | undefined;
  _id: string | undefined;
  about?: string | undefined;
};

export type ArticleWithAuthorInfo = Article & {
  authorInfo: Author;
};
