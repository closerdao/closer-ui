import staticVillages from 'closer/data/staticVillages';

import { Village, VillageMapItem } from 'closer/types/village';
import { villageToMapItem } from 'closer/utils/village.utils';

/**
 * `staticVillages` is authored in Leaflet order already, so it skips
 * `villageToMapItem` — running it through would swap lat/lng a second time.
 */
export function getStaticVillageMapItems(): VillageMapItem[] {
  return staticVillages.filter(
    (project) =>
      Array.isArray(project.coords) &&
      project.coords.length === 2 &&
      Math.abs(project.coords[0]) <= 90 &&
      Math.abs(project.coords[1]) <= 180,
  );
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
