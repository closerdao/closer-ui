import { VillageFunnelBanner } from '../../components/VillageUI/FunnelSteps';

import { createFixedSlugCustomPage } from '../customPageView';

// The plans themselves are authored in the admin; the strip above them is the
// funnel telling a village launcher which step they are on.
export default createFixedSlugCustomPage('/subscriptions', {
  header: <VillageFunnelBanner className="max-w-3xl mx-auto mt-8 mb-4" />,
});
