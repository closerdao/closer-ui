export type SectionType =
  | 'hero'
  | 'gallery'
  | 'testimonials'
  | 'stats'
  | 'features'
  | 'richText'
  | 'cta'
  | 'media'
  | 'textBlock'
  | 'staySearch'
  | 'events'
  | 'fundraiser'
  | 'tokenStats'
  | 'webinar';

export type SectionBackground =
  | 'transparent'
  | 'white'
  | 'neutral-light'
  | 'accent-light'
  | 'gray-50'
  | 'gradient-accent'
  | 'dark';

export interface PageSection {
  _id?: string;
  _localId?: string;
  type: SectionType;
  data: Record<string, unknown> & { background?: SectionBackground };
}

export interface PageDoc {
  _id: string;
  title: string;
  slug: string;
  description?: string;
  ogImage?: string;
  sections: PageSection[];
  aiMeta?: Record<string, unknown>;
}
