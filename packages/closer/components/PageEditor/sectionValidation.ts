import type { PageSection } from '../../types/page';

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

export interface SectionValidationError {
  index: number;
  type?: string;
  message: string;
}

export const describeSection = (
  index: number,
  type: string | undefined,
): string => {
  const label = type ? `${type}` : 'unknown';
  return `Section ${index + 1} (${label})`;
};

export const validateSection = (
  section: unknown,
  index: number,
): SectionValidationError[] => {
  const errors: SectionValidationError[] = [];
  if (!isPlainObject(section)) {
    errors.push({
      index,
      message: `${describeSection(index, undefined)}: must be an object.`,
    });
    return errors;
  }
  const type = section.type;
  if (typeof type !== 'string' || !type.trim()) {
    errors.push({
      index,
      message: `${describeSection(index, undefined)}: "type" must be a non-empty string.`,
    });
    return errors;
  }
  const data = section.data;
  if (data != null && !isPlainObject(data)) {
    errors.push({
      index,
      type,
      message: `${describeSection(index, type)}: "data" must be an object.`,
    });
    return errors;
  }
  if (isPlainObject(data)) {
    if (data.settings != null && !isPlainObject(data.settings)) {
      errors.push({
        index,
        type,
        message: `${describeSection(index, type)}: "data.settings" must be an object.`,
      });
    }
    if (data.content != null && !isPlainObject(data.content)) {
      errors.push({
        index,
        type,
        message: `${describeSection(index, type)}: "data.content" must be an object.`,
      });
    }
  }
  return errors;
};

export const validatePageSections = (
  sections: unknown,
): SectionValidationError[] => {
  if (sections == null) return [];
  if (!Array.isArray(sections)) {
    return [{ index: -1, message: '"sections" must be an array.' }];
  }
  return sections.flatMap((s, i) => validateSection(s, i));
};

export const sanitizeSection = (section: PageSection): PageSection => {
  const data = isPlainObject(section.data)
    ? (section.data as Record<string, unknown>)
    : {};
  const next: PageSection['data'] = { ...data };
  if (!isPlainObject(next.settings)) {
    next.settings = {};
  }
  if (!isPlainObject(next.content)) {
    next.content = {};
  }
  return { ...section, data: next };
};

export const sanitizePageSections = (
  sections: PageSection[],
): PageSection[] => sections.map(sanitizeSection);

const MONGOOSE_PREFIX = 'Page validation failed:';

export const formatPageSaveError = (
  message: string | null | undefined,
): string => {
  if (!message) return '';
  const trimmed = message.trim();
  if (!trimmed.startsWith(MONGOOSE_PREFIX)) return trimmed;
  const rest = trimmed.slice(MONGOOSE_PREFIX.length).trim();
  const parts = rest.split(/,\s*(?=[a-zA-Z0-9_.]+:\s)/);
  return parts
    .map((p) => p.replace(/^([a-zA-Z0-9_.]+):\s*/, '$1: '))
    .join('\n');
};
