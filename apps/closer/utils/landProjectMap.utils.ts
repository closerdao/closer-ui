import staticLandProjects from 'closer/data/staticLandProjects';

import { LandProject, LandProjectMapItem } from 'closer/types/landProject';
import { landProjectToMapItem } from 'closer/utils/landProject.utils';

export function getStaticLandProjectMapItems(): LandProjectMapItem[] {
  return staticLandProjects
    .map((project) => landProjectToMapItem(project))
    .filter((project): project is LandProjectMapItem => Boolean(project));
}

export function mergeLandProjectMapItems(
  apiProjects: LandProject[],
): LandProjectMapItem[] {
  const fromApi = apiProjects
    .map((project) => landProjectToMapItem(project))
    .filter((project): project is LandProjectMapItem => Boolean(project));

  if (fromApi.length > 0) return fromApi;
  return getStaticLandProjectMapItems();
}
