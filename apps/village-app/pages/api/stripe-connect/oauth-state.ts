import { createStripeConnectOAuthStateHandler } from '../../../../../packages/closer/pages/api/stripe-connect/oauth-state';

export default createStripeConnectOAuthStateHandler({ stateWithOrigin: true });
