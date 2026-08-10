export type EmailTemplate = {
  _id?: string;
  slug: string;
  name: string;
  description?: string;
  subject?: string;
  title?: string;
  text?: string;
  body?: string;
  lowerText?: string;
  ctaLink?: string;
  ctaText?: string;
  list?: string;
  footerCopy?: string;
  triggerModel?: string;
  triggerAction?: string;
  triggerDelay?: number;
  emailEnabled?: boolean;
};
