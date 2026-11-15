import { StripeConnectPage } from 'closer';
import { STRIPE_CONNECT_REDIRECT_URI } from 'closer/constants';

const VillageStripeConnectPage = () => (
  <StripeConnectPage redirectUri={STRIPE_CONNECT_REDIRECT_URI} />
);

VillageStripeConnectPage.getInitialProps = StripeConnectPage.getInitialProps;

export default VillageStripeConnectPage;
