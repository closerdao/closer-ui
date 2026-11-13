import type { ComponentProps } from 'react';

import { StripeConnectCallbackPage } from 'closer';
import { STRIPE_CONNECT_REDIRECT_URI } from 'closer/constants';

const VillageStripeConnectCallbackPage = (
  props: ComponentProps<typeof StripeConnectCallbackPage>,
) => (
  <StripeConnectCallbackPage
    {...props}
    redirectUri={STRIPE_CONNECT_REDIRECT_URI}
  />
);

VillageStripeConnectCallbackPage.getInitialProps =
  StripeConnectCallbackPage.getInitialProps;

export default VillageStripeConnectCallbackPage;
