export const SECTION_BACKGROUNDS = [
  'transparent',
  'white',
  'neutral-light',
  'accent-light',
  'gray-50',
  'gradient-accent',
  'dark',
] as const;

export type SectionBackground = (typeof SECTION_BACKGROUNDS)[number];

export const getSectionBackgroundClass = (
  bg?: string | null,
): string => {
  switch (bg) {
    case 'white':
      return 'bg-white';
    case 'neutral-light':
      return 'bg-neutral-light';
    case 'accent-light':
      return 'bg-accent-light';
    case 'gray-50':
      return 'bg-gray-50';
    case 'gradient-accent':
      return 'bg-gradient-to-br from-accent-light to-accent-alt-light';
    case 'dark':
      return 'bg-gray-900 text-white';
    case 'transparent':
    case '':
    case null:
    case undefined:
    default:
      return '';
  }
};
