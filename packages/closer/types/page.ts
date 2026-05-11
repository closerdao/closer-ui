export type SectionType =
  | 'hero'
  | 'gallery'
  | 'testimonials'
  | 'stats'
  | 'features'
  | 'richText'
  | 'cta';

export interface PageSection {
  _id?: string;
  _localId?: string;
  type: SectionType;
  data: Record<string, unknown>;
}

export interface PageDoc {
  _id: string;
  title: string;
  slug: string;
  description?: string;
  ogImage?: string;
  sections: PageSection[];
}
