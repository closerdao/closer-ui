import { OpportunityByCategory, VolunteerOpportunity } from '../types';

export const getOpportunitiesByCategory = (
  opportunities: VolunteerOpportunity[],
): OpportunityByCategory[] => {
  const transformedOpportunities: { [key: string]: OpportunityByCategory } = {};

  opportunities.forEach((item) => {
    const { category } = item;
    if (!transformedOpportunities[category]) {
      transformedOpportunities[category] = {
        category,
        opportunities: [],
      };
    }
    transformedOpportunities[category].opportunities.push(item);
  });

  return Object.values(transformedOpportunities);
};
