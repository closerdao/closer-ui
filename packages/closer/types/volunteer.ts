import { VolunteerOpportunity } from './api';

export interface OpportunityByCategory {
  category: string;
  opportunities: VolunteerOpportunity[];
}
