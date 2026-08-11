import staticVillages from 'closer/data/staticVillages';

import { Village, VillageMapItem } from 'closer/types/village';
import { villageToMapItem } from 'closer/utils/village.utils';

export function getStaticVillageMapItems(): VillageMapItem[] {
  return staticVillages
    .map((project) => villageToMapItem(project))
    .filter((project): project is VillageMapItem => Boolean(project));
}

export function mergeVillageMapItems(
  apiProjects: Village[],
): VillageMapItem[] {
  const fromApi = apiProjects
    .map((project) => villageToMapItem(project))
    .filter((project): project is VillageMapItem => Boolean(project));

  if (fromApi.length > 0) return fromApi;
  return getStaticVillageMapItems();
}
