import type { SectionType } from '../types/page';

export const DYNAMIC_BLOCK_TYPES: SectionType[] = [
  'staySearch',
  'events',
  'fundraiser',
  'tokenStats',
  'webinar',
];

const dynamicBlockTypeSet = new Set<string>(DYNAMIC_BLOCK_TYPES);

export const isDynamicBlockType = (type: string): boolean =>
  dynamicBlockTypeSet.has(type);
